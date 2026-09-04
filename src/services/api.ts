import { DisplayConfig } from '../types';
import { DEFAULT_DISPLAYS } from '../data/defaultConfig';
import {
  saveDisplaysToDb,
  loadDisplaysFromDb,
  saveSingleDisplayToDb,
} from './storageDb';
import { generateAndCache12MonthSchedule } from './prayerScheduleCache';
import { cacheDisplayAssets } from './assetCache';
import { performSmartSync } from './syncManager';
import {
  db,
  testFirestoreConnection,
  isFirestoreQuotaExceeded,
  setFirestoreQuotaExceeded,
} from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  getSupabase,
  isSupabaseConfigured,
  ensureSupabaseClient,
  fetchDisplaysFromSupabase,
  saveAllDisplaysToSupabase,
  saveSingleDisplayToSupabase,
  deleteDisplayFromSupabase,
  subscribeToSupabaseDisplays,
} from './supabase';

const STORAGE_KEY = 'masjid_tv_displays_cache';
const BACKUP_KEY = 'masjid_tv_displays_backup_permanent';
const ACTIVE_DISPLAY_KEY = 'masjid_tv_active_display_code';

export function normalizeDisplayConfig(raw: Partial<DisplayConfig>): DisplayConfig {
  const base = DEFAULT_DISPLAYS[0];
  const merged: DisplayConfig = {
    ...base,
    ...raw,
    location: {
      ...base.location,
      ...(raw?.location || {}),
    },
    prayerAdjustments: {
      ...base.prayerAdjustments,
      ...(raw?.prayerAdjustments || {}),
    },
    prayerModeSettings: {
      ...base.prayerModeSettings,
      ...(raw?.prayerModeSettings || (raw as any)?.prayerMode || {}),
      iqamahCountdownMinutes: {
        ...base.prayerModeSettings.iqamahCountdownMinutes,
        ...(raw?.prayerModeSettings?.iqamahCountdownMinutes || (raw as any)?.prayerMode?.iqamahCountdownMinutes || {}),
      },
    },
    theme: {
      ...base.theme,
      ...(raw?.theme || {}),
    },
    layout: {
      ...base.layout,
      ...(raw?.layout || {}),
    },
    slides: Array.isArray(raw?.slides) ? raw.slides : base.slides,
    announcements: Array.isArray(raw?.announcements) ? raw.announcements : base.announcements,
    runningTexts: Array.isArray(raw?.runningTexts) ? raw.runningTexts : base.runningTexts,
  };
  return merged;
}

// Broadcast channel for real-time multi-tab / multi-screen synchronization
let syncBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncBroadcastChannel = new BroadcastChannel('masjid_tv_sync_channel');
  }
} catch (e) {
  console.warn('BroadcastChannel not supported:', e);
}

export function broadcastConfigUpdate(displays: DisplayConfig[]): void {
  try {
    if (syncBroadcastChannel) {
      syncBroadcastChannel.postMessage({
        type: 'DISPLAYS_UPDATED',
        displays,
        timestamp: Date.now(),
      });
    }
  } catch (e) {
    // Ignore channel post error
  }
}

// Helper to clean payload for Cloud Firestore (removes undefined, strips functions, handles nulls)
export function cleanForFirestore<T>(data: T): any {
  if (data === null || data === undefined) return null;
  return JSON.parse(JSON.stringify(data));
}

// Cache signatures of documents to prevent echo loops and redundant writes
const lastCloudDocSignatures = new Map<string, string>();

function getDisplaySignature(d: DisplayConfig): string {
  const { updatedAt, ...rest } = d;
  return JSON.stringify(cleanForFirestore(rest));
}

export function subscribeToConfigUpdates(callback: (displays: DisplayConfig[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleBroadcast = (event: MessageEvent) => {
    if (event.data && event.data.type === 'DISPLAYS_UPDATED' && Array.isArray(event.data.displays)) {
      callback(event.data.displays.map(normalizeDisplayConfig));
    }
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (Array.isArray(parsed) && parsed.length > 0) {
          callback(parsed.map(normalizeDisplayConfig));
        }
      } catch (e) {
        // Ignore
      }
    }
  };

  if (syncBroadcastChannel) {
    syncBroadcastChannel.addEventListener('message', handleBroadcast);
  }
  window.addEventListener('storage', handleStorage);

  // 1. Real-time Supabase Subscription
  let unsubscribeSupabase = () => {};
  try {
    unsubscribeSupabase = subscribeToSupabaseDisplays((fresh) => {
      if (fresh && fresh.length > 0) {
        saveDisplaysToDb(fresh).catch(() => {});
        safeSetLocalStorage(STORAGE_KEY, fresh);
        safeSetLocalStorage(BACKUP_KEY, fresh);
        callback(fresh);
      }
    });
  } catch (err) {
    console.warn('⚠️ [Supabase] Realtime listener error:', err);
  }

  // 2. High-reliability Polling Ticker (checks Supabase/Server every 10 seconds)
  let lastKnownJson = '';
  const pollTimer = setInterval(async () => {
    try {
      // First try Supabase direct
      if (isSupabaseConfigured()) {
        const cloudData = await fetchDisplaysFromSupabase();
        if (cloudData && cloudData.length > 0) {
          const serialized = JSON.stringify(cloudData.map(d => ({ c: d.code, u: d.updatedAt })));
          if (serialized !== lastKnownJson) {
            lastKnownJson = serialized;
            saveDisplaysToDb(cloudData).catch(() => {});
            safeSetLocalStorage(STORAGE_KEY, cloudData);
            callback(cloudData);
            return;
          }
        }
      }

      // Fallback to server API
      const res = await fetch('/api/displays', { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.map(normalizeDisplayConfig);
          const serialized = JSON.stringify(normalized.map(d => ({ c: d.code, u: d.updatedAt })));
          if (serialized !== lastKnownJson) {
            lastKnownJson = serialized;
            saveDisplaysToDb(normalized).catch(() => {});
            safeSetLocalStorage(STORAGE_KEY, normalized);
            callback(normalized);
          }
        }
      }
    } catch {
      // Ignore background poll errors
    }
  }, 10000);

  // 3. Real-time Cloud Firestore Listener (only if Supabase is NOT configured and Firestore quota is NOT exceeded)
  let unsubscribeFirestore = () => {};
  if (!isSupabaseConfigured() && !isFirestoreQuotaExceeded()) {
    try {
      const displaysCol = collection(db, 'displays');
      unsubscribeFirestore = onSnapshot(
        displaysCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const cloudDisplays: DisplayConfig[] = [];
            snapshot.forEach((docSnap) => {
              if (docSnap.exists()) {
                const d = normalizeDisplayConfig(docSnap.data() as DisplayConfig);
                const cleanCode = (d.code || docSnap.id).trim().toUpperCase();
                lastCloudDocSignatures.set(cleanCode, getDisplaySignature(d));
                cloudDisplays.push(d);
              }
            });
            if (cloudDisplays.length > 0) {
              saveDisplaysToDb(cloudDisplays).catch(() => {});
              safeSetLocalStorage(STORAGE_KEY, cloudDisplays);
              safeSetLocalStorage(BACKUP_KEY, cloudDisplays);
              callback(cloudDisplays);
            }
          }
        },
        (error: any) => {
          if (
            error?.code === 'resource-exhausted' ||
            error?.message?.includes('Quota limit exceeded') ||
            error?.message?.includes('resource-exhausted')
          ) {
            setFirestoreQuotaExceeded(true);
            try {
              unsubscribeFirestore();
            } catch {}
          }
          console.warn('[Firestore] Realtime snapshot notice:', error?.message || error);
        }
      );
    } catch (err: any) {
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
        setFirestoreQuotaExceeded(true);
      }
    }
  }

  return () => {
    clearInterval(pollTimer);
    if (syncBroadcastChannel) {
      syncBroadcastChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorage);
    try {
      unsubscribeFirestore();
    } catch {}
    try {
      unsubscribeSupabase();
    } catch {}
  };
}

function getTimestampMs(dateStr?: string): number {
  if (!dateStr) return 0;
  const t = new Date(dateStr).getTime();
  return Number.isFinite(t) ? t : 0;
}

function safeSetLocalStorage(key: string, data: DisplayConfig[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    try {
      const stripped = data.map((d) => ({
        ...d,
        slides: d.slides.map((s) => ({
          ...s,
          imageUrl: s.imageUrl?.startsWith('data:') ? '' : s.imageUrl,
        })),
      }));
      localStorage.setItem(key, JSON.stringify(stripped));
    } catch {
      // Ignore if localStorage is exhausted; IndexedDB handles complete data safely
    }
  }
}

export async function fetchAllDisplays(): Promise<DisplayConfig[]> {
  // 1. OFFLINE-FIRST: Read immediately from IndexedDB / LocalStorage first (0ms instantaneous display boot)
  let localList: DisplayConfig[] | null = null;
  try {
    const fromDb = await loadDisplaysFromDb();
    if (fromDb && fromDb.length > 0) {
      localList = fromDb.map(normalizeDisplayConfig);
    }
  } catch (e) {
    console.warn('[IndexedDB] read warning:', e);
  }

  if (!localList || localList.length === 0) {
    try {
      const cached = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(BACKUP_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localList = parsed.map(normalizeDisplayConfig);
        }
      }
    } catch (e) {
      console.warn('Local storage read error:', e);
    }
  }

  // If local data exists, return it immediately so the TV display turns on with 0 blank frames!
  if (localList && localList.length > 0) {
    // Trigger background cache and differential sync if network is available
    for (const d of localList) {
      generateAndCache12MonthSchedule(d, false).catch(() => {});
      cacheDisplayAssets(d).catch(() => {});
    }

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      setTimeout(() => {
        performSmartSync(localList!).catch(() => {});
      }, 300);
    }
    return localList;
  }

  // 2. Fresh installation fallback: If NO local data exists at all, try Supabase
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    await ensureSupabaseClient();
    if (isSupabaseConfigured()) {
      try {
        const supabaseData = await fetchDisplaysFromSupabase();
        if (supabaseData && supabaseData.length > 0) {
          console.log(`✓ [API] Loaded ${supabaseData.length} displays directly from Supabase Cloud`);
          await saveDisplaysToDb(supabaseData);
          safeSetLocalStorage(STORAGE_KEY, supabaseData);
          safeSetLocalStorage(BACKUP_KEY, supabaseData);
          for (const d of supabaseData) {
            generateAndCache12MonthSchedule(d, false).catch(() => {});
            cacheDisplayAssets(d).catch(() => {});
          }
          return supabaseData;
        }
      } catch (err) {
        console.warn('⚠️ [Supabase] Initial fetch error:', err);
      }
    }

    // 3. Fallback to Server API
    try {
      const res = await fetch('/api/displays', { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const serverData = await res.json();
        if (Array.isArray(serverData) && serverData.length > 0) {
          const normalizedServer = serverData.map(normalizeDisplayConfig);
          console.log(`✓ [API] Loaded ${normalizedServer.length} displays from Server API`);
          await saveDisplaysToDb(normalizedServer);
          safeSetLocalStorage(STORAGE_KEY, normalizedServer);
          safeSetLocalStorage(BACKUP_KEY, normalizedServer);
          for (const d of normalizedServer) {
            generateAndCache12MonthSchedule(d, false).catch(() => {});
            cacheDisplayAssets(d).catch(() => {});
          }
          return normalizedServer;
        }
      }
    } catch (err) {
      console.warn('⚠️ [API] Server fetch warning:', err);
    }
  }

  // 4. Ultimate fallback to bundled defaults
  await saveDisplaysToDb(DEFAULT_DISPLAYS);
  safeSetLocalStorage(STORAGE_KEY, DEFAULT_DISPLAYS);
  safeSetLocalStorage(BACKUP_KEY, DEFAULT_DISPLAYS);
  for (const d of DEFAULT_DISPLAYS) {
    generateAndCache12MonthSchedule(d, false).catch(() => {});
    cacheDisplayAssets(d).catch(() => {});
  }
  return DEFAULT_DISPLAYS;
}

export async function fetchDisplayByCode(code: string): Promise<DisplayConfig> {
  const cleanCode = (code || 'MASJID-01').trim();

  // 1. OFFLINE-FIRST: Search in IndexedDB first!
  try {
    const fromDb = await loadDisplaysFromDb();
    if (fromDb && fromDb.length > 0) {
      const found = fromDb.find(
        (d) => d.code.toLowerCase() === cleanCode.toLowerCase() || d.id === cleanCode
      );
      if (found) {
        const normalized = normalizeDisplayConfig(found);
        generateAndCache12MonthSchedule(normalized, false).catch(() => {});
        cacheDisplayAssets(normalized).catch(() => {});
        return normalized;
      }
    }
  } catch {}

  // 2. Fallback: Search in local storage
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed: DisplayConfig[] = JSON.parse(cached);
      const found = parsed.find(
        (d) => d.code.toLowerCase() === cleanCode.toLowerCase() || d.id === cleanCode
      );
      if (found) {
        const normalized = normalizeDisplayConfig(found);
        generateAndCache12MonthSchedule(normalized, false).catch(() => {});
        cacheDisplayAssets(normalized).catch(() => {});
        return normalized;
      }
    }
  } catch {}

  // 3. If online and not found locally, fetch from Supabase
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    await ensureSupabaseClient();
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase();
        if (supabase) {
          const { data, error } = await supabase
            .from('displays')
            .select('*')
            .ilike('code', cleanCode)
            .maybeSingle();

          if (!error && data) {
            const item = normalizeDisplayConfig({
              ...(data.data || {}),
              id: data.id || data.data?.id,
              code: (data.code || data.data?.code || cleanCode).trim().toUpperCase(),
              name: data.name || data.data?.name,
              updatedAt: data.updated_at || data.data?.updatedAt || new Date().toISOString(),
            });
            await saveSingleDisplayToDb(item);
            generateAndCache12MonthSchedule(item, false).catch(() => {});
            cacheDisplayAssets(item).catch(() => {});
            return item;
          }
        }
      } catch (err) {
        console.warn(`⚠️ [Supabase] Fetch for ${cleanCode} notice:`, err);
      }
    }

    // 4. Fetch from Backend Server
    try {
      const res = await fetch(`/api/displays/${encodeURIComponent(cleanCode)}`, {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        const normalized = normalizeDisplayConfig(data);
        await saveSingleDisplayToDb(normalized);
        generateAndCache12MonthSchedule(normalized, false).catch(() => {});
        cacheDisplayAssets(normalized).catch(() => {});
        return normalized;
      }
    } catch {}
  }

  const defaultFound = DEFAULT_DISPLAYS.find(
    (d) => d.code.toLowerCase() === cleanCode.toLowerCase() || d.id === cleanCode
  );
  return normalizeDisplayConfig(defaultFound || DEFAULT_DISPLAYS[0]);
}

export async function saveAllDisplays(displays: DisplayConfig[]): Promise<DisplayConfig[]> {
  const updatedList = displays.map((d) => ({
    ...d,
    updatedAt: new Date().toISOString(),
  }));

  // 1. Immediately update IndexedDB (unlimited quota) AND LocalStorage cache
  await saveDisplaysToDb(updatedList);
  safeSetLocalStorage(STORAGE_KEY, updatedList);
  safeSetLocalStorage(BACKUP_KEY, updatedList);

  // Pre-generate 12-month schedules and pre-cache assets for all updated displays
  for (const d of updatedList) {
    generateAndCache12MonthSchedule(d, true).catch(() => {});
    cacheDisplayAssets(d).catch(() => {});
  }

  // 2. Broadcast to all open tabs / TV screens immediately
  broadcastConfigUpdate(updatedList);

  // 3. Persist directly to Supabase Cloud Database if online
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    await ensureSupabaseClient();
    try {
      const success = await saveAllDisplaysToSupabase(updatedList);
      if (success) {
        console.log(`✓ [API] Synced ${updatedList.length} displays to Supabase table`);
      }
    } catch (err) {
      console.warn('⚠️ [Supabase] Auto-save to Supabase notice:', err);
    }

    // 4. Persist to server bulk endpoint
    try {
      await fetch('/api/displays/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedList),
      });
    } catch {}
  }

  return updatedList;
}

export async function saveDisplayConfig(config: DisplayConfig): Promise<DisplayConfig> {
  const updated: DisplayConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
  };
  const cleanCode = (updated.code || 'MASJID-01').trim().toUpperCase();

  // 1. Update IndexedDB & local storage cache immediately
  await saveSingleDisplayToDb(updated);

  // Pre-generate 12-month schedules and pre-cache assets in background
  generateAndCache12MonthSchedule(updated, true).catch(() => {});
  cacheDisplayAssets(updated).catch(() => {});

  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    let list: DisplayConfig[] = cached ? JSON.parse(cached) : [...DEFAULT_DISPLAYS];
    const idx = list.findIndex(
      (d) => (d.id && updated.id && d.id === updated.id) || d.code.toLowerCase() === updated.code.toLowerCase()
    );
    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.push(updated);
    }
    safeSetLocalStorage(STORAGE_KEY, list);
    safeSetLocalStorage(BACKUP_KEY, list);
    broadcastConfigUpdate(list);
  } catch (err) {
    console.warn('Local storage update warning:', err);
  }

  // 2. Save directly to Supabase Cloud Database if online
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    await ensureSupabaseClient();
    try {
      await saveSingleDisplayToSupabase(updated);
    } catch (err) {
      console.warn('⚠️ [Supabase] Save single display notice:', err);
    }

    // 3. Persist to backend API
    try {
      await fetch(`/api/displays/${encodeURIComponent(config.code)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}
  }

  return updated;
}

export async function createNewDisplay(newDisplay: Partial<DisplayConfig>): Promise<DisplayConfig> {
  const base = DEFAULT_DISPLAYS[0];
  const cleanName = newDisplay.name || 'Layar TV Masjid';
  const cleanCode = (newDisplay.code || `DISPLAY-${Date.now().toString().slice(-4)}`).toUpperCase().trim();
  
  const created: DisplayConfig = {
    ...base,
    ...newDisplay,
    name: cleanName,
    id: `display-${Date.now()}`,
    code: cleanCode,
    location: {
      ...base.location,
      ...(newDisplay.location || {}),
      mosqueName: newDisplay.location?.mosqueName || cleanName,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save to IndexedDB
  await saveSingleDisplayToDb(created);

  // Save to Supabase Cloud Database
  await ensureSupabaseClient();
  try {
    await saveSingleDisplayToSupabase(created);
    console.log(`✓ [API] Created & saved display ${created.code} to Supabase`);
  } catch (err) {
    console.warn('⚠️ [Supabase] Create display error:', err);
  }

  // Save to server
  try {
    await fetch('/api/displays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(created),
    });
  } catch (err) {
    // Ignore
  }

  // Save to Firestore if eligible
  if (!isSupabaseConfigured() && !isFirestoreQuotaExceeded()) {
    try {
      const sanitized = cleanForFirestore(created);
      await setDoc(doc(db, 'displays', created.code), sanitized, { merge: true });
    } catch (err: any) {
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
        setFirestoreQuotaExceeded(true);
      }
    }
  }

  return created;
}

export async function deleteDisplay(code: string): Promise<boolean> {
  const cleanCode = (code || '').trim().toUpperCase();

  // Delete from Supabase
  await ensureSupabaseClient();
  try {
    await deleteDisplayFromSupabase(cleanCode);
    console.log(`✓ [API] Deleted display ${cleanCode} from Supabase`);
  } catch (err) {
    console.warn('⚠️ [Supabase] Delete display error:', err);
  }

  // Delete from server
  try {
    await fetch(`/api/displays/${encodeURIComponent(code)}`, {
      method: 'DELETE',
    });
  } catch {
    // Ignore
  }

  // Delete from Firestore if eligible
  if (!isSupabaseConfigured() && !isFirestoreQuotaExceeded()) {
    try {
      await deleteDoc(doc(db, 'displays', cleanCode));
    } catch (err: any) {
      if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
        setFirestoreQuotaExceeded(true);
      }
    }
  }

  // Delete from IndexedDB and local storage
  try {
    const fromDb = await loadDisplaysFromDb();
    if (fromDb) {
      const filtered = fromDb.filter((d) => d.code.toUpperCase() !== cleanCode && d.id !== cleanCode);
      await saveDisplaysToDb(filtered);
      safeSetLocalStorage(STORAGE_KEY, filtered);
      safeSetLocalStorage(BACKUP_KEY, filtered);
      broadcastConfigUpdate(filtered);
    }
  } catch {
    // Ignore
  }

  return true;
}

export async function resetDemoDisplays(): Promise<DisplayConfig[]> {
  try {
    const res = await fetch('/api/displays/reset-demo', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.displays || DEFAULT_DISPLAYS));
      return data.displays || DEFAULT_DISPLAYS;
    }
  } catch (err) {
    console.warn('Reset demo API failed:', err);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DISPLAYS));
  return DEFAULT_DISPLAYS;
}

export function getStoredActiveDisplayCode(): string {
  return localStorage.getItem(ACTIVE_DISPLAY_KEY) || 'MASJID-01';
}

export function setStoredActiveDisplayCode(code: string): void {
  localStorage.setItem(ACTIVE_DISPLAY_KEY, code);
}

export function exportDisplaysToJson(displays: DisplayConfig[]): string {
  return JSON.stringify(displays, null, 2);
}

export async function importDisplaysFromJson(jsonString: string): Promise<DisplayConfig[]> {
  const parsed = JSON.parse(jsonString);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Format file JSON backup tidak valid');
  }
  const normalized = parsed.map(normalizeDisplayConfig);
  return await saveAllDisplays(normalized);
}

export function hasPermanentBackup(): boolean {
  try {
    const b = localStorage.getItem(BACKUP_KEY);
    return !!b && b.length > 50;
  } catch {
    return false;
  }
}

export async function restorePermanentBackup(): Promise<DisplayConfig[]> {
  try {
    const b = localStorage.getItem(BACKUP_KEY);
    if (b) {
      const parsed = JSON.parse(b);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized = parsed.map(normalizeDisplayConfig);
        return await saveAllDisplays(normalized);
      }
    }
  } catch (e) {
    console.error('Failed to restore backup:', e);
  }
  return DEFAULT_DISPLAYS;
}

export const apiService = {
  getAllDisplays: fetchAllDisplays,
  getDisplayByCode: fetchDisplayByCode,
  saveDisplay: saveDisplayConfig,
  saveAllDisplays: saveAllDisplays,
  createDisplay: async (name: string, code: string, copyFromCode?: string) => {
    let base = DEFAULT_DISPLAYS[0];
    if (copyFromCode) {
      const found = await fetchDisplayByCode(copyFromCode);
      if (found) base = found;
    }
    return createNewDisplay({
      ...base,
      name,
      code,
      location: {
        ...base.location,
      },
    });
  },
  deleteDisplay,
  resetDemoDisplays,
  exportToJson: exportDisplaysToJson,
  importFromJson: importDisplaysFromJson,
  hasPermanentBackup,
  restorePermanentBackup,
};
