import { DisplayConfig } from '../types';
import { DEFAULT_DISPLAYS } from '../data/defaultConfig';
import {
  saveDisplaysToDb,
  loadDisplaysFromDb,
  saveSingleDisplayToDb,
} from './storageDb';
import { db, testFirestoreConnection } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './firebaseError';

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

// Cache signatures of Firestore documents to prevent echo loops and redundant writes
const lastCloudDocSignatures = new Map<string, string>();

function getDisplaySignature(d: DisplayConfig): string {
  // Exclude updatedAt for structural comparison to prevent timestamp-only bounce loops
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

  // Real-time Cloud Firestore Listener across all devices/TVs
  let unsubscribeFirestore = () => {};
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
            // Update local DB cache silently
            saveDisplaysToDb(cloudDisplays).catch(() => {});
            safeSetLocalStorage(STORAGE_KEY, cloudDisplays);
            safeSetLocalStorage(BACKUP_KEY, cloudDisplays);
            callback(cloudDisplays);
          }
        }
      },
      (error) => {
        console.warn('[Firestore] Realtime snapshot warning:', error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Snapshot setup failed:', err);
  }

  return () => {
    if (syncBroadcastChannel) {
      syncBroadcastChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorage);
    unsubscribeFirestore();
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
    // If quota exceeded due to high-res poster base64, create stripped version for localStorage
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
      // Ignore if localStorage is completely exhausted, IndexedDB is already storing full data
    }
  }
}

export async function fetchAllDisplays(): Promise<DisplayConfig[]> {
  // Test connection in background
  testFirestoreConnection().catch(() => {});

  // 1. Fetch from Google Cloud Firestore (Primary source of truth)
  try {
    const displaysCol = collection(db, 'displays');
    const snapshot = await getDocs(displaysCol);
    if (!snapshot.empty) {
      const firestoreDisplays: DisplayConfig[] = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.exists()) {
          firestoreDisplays.push(normalizeDisplayConfig(docSnap.data() as DisplayConfig));
        }
      });
      if (firestoreDisplays.length > 0) {
        await saveDisplaysToDb(firestoreDisplays);
        safeSetLocalStorage(STORAGE_KEY, firestoreDisplays);
        safeSetLocalStorage(BACKUP_KEY, firestoreDisplays);
        return firestoreDisplays;
      }
    } else {
      // If Firestore is empty, check if local storage or IndexedDB has existing customizations
      let initialSeed = DEFAULT_DISPLAYS;
      try {
        const fromDb = await loadDisplaysFromDb();
        if (fromDb && fromDb.length > 0) {
          initialSeed = fromDb.map(normalizeDisplayConfig);
        } else {
          const cached = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(BACKUP_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              initialSeed = parsed.map(normalizeDisplayConfig);
            }
          }
        }
      } catch {
        // Use DEFAULT_DISPLAYS
      }

      console.log('[Firestore] Seeding Cloud Firestore with initial displays...');
      for (const d of initialSeed) {
        const cleanCode = (d.code || 'MASJID-01').trim().toUpperCase();
        await setDoc(doc(db, 'displays', cleanCode), cleanForFirestore(d), { merge: true });
        lastCloudDocSignatures.set(cleanCode, getDisplaySignature(d));
      }
      await saveDisplaysToDb(initialSeed);
      safeSetLocalStorage(STORAGE_KEY, initialSeed);
      safeSetLocalStorage(BACKUP_KEY, initialSeed);
      return initialSeed;
    }
  } catch (firestoreErr) {
    console.warn('[Firestore] Fetch failed or offline, falling back to local storage:', firestoreErr);
  }

  // 2. Read IndexedDB (unlimited quota) first, then fallback to local storage
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

  // 3. Fetch from Backend Server
  try {
    const res = await fetch('/api/displays', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const serverData = await res.json();
      if (Array.isArray(serverData) && serverData.length > 0) {
        const normalizedServer = serverData.map(normalizeDisplayConfig);

        // If no local storage exists yet, server is source of truth
        if (!localList || localList.length === 0) {
          await saveDisplaysToDb(normalizedServer);
          safeSetLocalStorage(STORAGE_KEY, normalizedServer);
          safeSetLocalStorage(BACKUP_KEY, normalizedServer);
          return normalizedServer;
        }

        // Intelligently merge per-display to preserve any local user modifications
        let localHasNewerChanges = false;
        const mergedList: DisplayConfig[] = [];
        const seenCodes = new Set<string>();

        // Process all local displays
        for (const localDisp of localList) {
          const cleanCode = (localDisp.code || '').toLowerCase().trim();
          seenCodes.add(cleanCode);

          const serverMatch = normalizedServer.find(
            (s) =>
              (s.code && s.code.toLowerCase().trim() === cleanCode) ||
              (s.id && localDisp.id && s.id === localDisp.id)
          );

          if (!serverMatch) {
            // Local display doesn't exist on server yet, keep it and sync
            mergedList.push(localDisp);
            localHasNewerChanges = true;
          } else {
            const localTime = getTimestampMs(localDisp.updatedAt);
            const serverTime = getTimestampMs(serverMatch.updatedAt);

            if (localTime > serverTime) {
              // Local is strictly newer, keep local and schedule sync
              mergedList.push(localDisp);
              localHasNewerChanges = true;
            } else if (serverTime > localTime) {
              // Server is strictly newer
              mergedList.push(serverMatch);
            } else {
              // Same timestamp or defaults - prefer local to safeguard unsaved edits
              mergedList.push(localDisp);
            }
          }
        }

        // Add any server displays not in local list
        for (const serverDisp of normalizedServer) {
          const cleanCode = (serverDisp.code || '').toLowerCase().trim();
          if (!seenCodes.has(cleanCode)) {
            mergedList.push(serverDisp);
          }
        }

        // Update IndexedDB and LocalStorage caches
        await saveDisplaysToDb(mergedList);
        safeSetLocalStorage(STORAGE_KEY, mergedList);
        safeSetLocalStorage(BACKUP_KEY, mergedList);

        return mergedList;
      }
    }
  } catch (err) {
    console.warn('Backend API unavailable, falling back to local storage cache:', err);
  }

  // 4. Fallback to local storage / IndexedDB if server failed
  if (localList && localList.length > 0) {
    return localList;
  }

  // 5. Fallback to bundled defaults
  await saveDisplaysToDb(DEFAULT_DISPLAYS);
  safeSetLocalStorage(STORAGE_KEY, DEFAULT_DISPLAYS);
  safeSetLocalStorage(BACKUP_KEY, DEFAULT_DISPLAYS);
  return DEFAULT_DISPLAYS;
}

export async function fetchDisplayByCode(code: string): Promise<DisplayConfig> {
  const cleanCode = (code || 'MASJID-01').trim();

  // 1. Fetch from Firestore first
  try {
    const docRef = doc(db, 'displays', cleanCode);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return normalizeDisplayConfig(docSnap.data() as DisplayConfig);
    }
  } catch (err) {
    console.warn(`[Firestore] Fetch for ${cleanCode} notice:`, err);
  }

  // 2. Fetch from Backend Server
  try {
    const res = await fetch(`/api/displays/${encodeURIComponent(cleanCode)}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      return normalizeDisplayConfig(data);
    }
  } catch (err) {
    console.warn(`Fetch for display ${cleanCode} failed, falling back to local cache:`, err);
  }

  // 3. Search in IndexedDB
  try {
    const fromDb = await loadDisplaysFromDb();
    if (fromDb && fromDb.length > 0) {
      const found = fromDb.find(
        (d) => d.code.toLowerCase() === cleanCode.toLowerCase() || d.id === cleanCode
      );
      if (found) return normalizeDisplayConfig(found);
      return normalizeDisplayConfig(fromDb[0]);
    }
  } catch {
    // Ignore
  }

  // 4. Search in local storage
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed: DisplayConfig[] = JSON.parse(cached);
      const found = parsed.find(
        (d) => d.code.toLowerCase() === cleanCode.toLowerCase() || d.id === cleanCode
      );
      if (found) return normalizeDisplayConfig(found);
      if (parsed.length > 0) return normalizeDisplayConfig(parsed[0]);
    }
  } catch {
    // Ignore
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

  // 2. Save sanitized items to Cloud Firestore
  try {
    for (const d of updatedList) {
      const cleanCode = (d.code || 'MASJID-01').trim().toUpperCase();
      const sanitized = cleanForFirestore(d);
      lastCloudDocSignatures.set(cleanCode, getDisplaySignature(d));
      await setDoc(doc(db, 'displays', cleanCode), sanitized, { merge: true });
    }
  } catch (err) {
    console.warn('[Firestore] saveAllDisplays notice:', err);
  }

  // 3. Broadcast to all open tabs / TV screens
  broadcastConfigUpdate(updatedList);

  // 4. Persist to server bulk endpoint
  try {
    fetch('/api/displays/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedList),
    }).catch(() => {});
  } catch {
    // Ignore
  }

  return updatedList;
}

export async function saveDisplayConfig(config: DisplayConfig): Promise<DisplayConfig> {
  const updated: DisplayConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
  };
  const cleanCode = (updated.code || 'MASJID-01').trim().toUpperCase();

  // 1. Save sanitized data to Cloud Firestore
  try {
    const sanitized = cleanForFirestore(updated);
    lastCloudDocSignatures.set(cleanCode, getDisplaySignature(updated));
    await setDoc(doc(db, 'displays', cleanCode), sanitized, { merge: true });
  } catch (err) {
    console.warn('[Firestore] saveDisplayConfig notice:', err);
  }

  // 2. Update IndexedDB & local storage cache immediately
  await saveSingleDisplayToDb(updated);
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

  // 3. Persist to backend API
  try {
    fetch(`/api/displays/${encodeURIComponent(config.code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(() => {});
  } catch {
    // Ignore
  }

  return updated;
}

export async function createNewDisplay(newDisplay: Partial<DisplayConfig>): Promise<DisplayConfig> {
  const base = DEFAULT_DISPLAYS[0];
  const created: DisplayConfig = {
    ...base,
    ...newDisplay,
    id: `display-${Date.now()}`,
    code: (newDisplay.code || `DISPLAY-${Date.now().toString().slice(-4)}`).toUpperCase().trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save to Firestore
  try {
    const sanitized = cleanForFirestore(created);
    await setDoc(doc(db, 'displays', created.code), sanitized, { merge: true });
  } catch (err) {
    console.warn('[Firestore] createNewDisplay error:', err);
  }

  // Save to IndexedDB
  await saveSingleDisplayToDb(created);

  try {
    fetch('/api/displays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(created),
    }).catch(() => {});
  } catch (err) {
    console.warn('Create API failed:', err);
  }

  return created;
}

export async function deleteDisplay(code: string): Promise<boolean> {
  const cleanCode = (code || '').trim();

  // Delete from Firestore
  try {
    await deleteDoc(doc(db, 'displays', cleanCode));
  } catch (err) {
    console.warn('[Firestore] delete error:', err);
  }

  try {
    fetch(`/api/displays/${encodeURIComponent(code)}`, {
      method: 'DELETE',
    }).catch(() => {});
  } catch {
    // Ignore
  }

  try {
    const fromDb = await loadDisplaysFromDb();
    if (fromDb) {
      const filtered = fromDb.filter((d) => d.code.toLowerCase() !== cleanCode.toLowerCase());
      await saveDisplaysToDb(filtered);
      safeSetLocalStorage(STORAGE_KEY, filtered);
    }
  } catch (e) {
    console.error(e);
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
