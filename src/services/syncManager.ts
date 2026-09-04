import { DisplayConfig } from '../types';
import {
  ensureSupabaseClient,
  isSupabaseConfigured,
  fetchDisplaysFromSupabase,
  SupabaseRow,
  parseSupabaseRow,
} from './supabase';
import {
  saveDisplaysToDb,
  loadDisplaysFromDb,
  setDbMetadata,
  getDbMetadata,
} from './storageDb';
import { generateAndCache12MonthSchedule } from './prayerScheduleCache';
import { cacheDisplayAssets } from './assetCache';

export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'SYNCING';

export interface SyncState {
  status: ConnectionStatus;
  lastSyncTimestamp: number | null;
  lastSyncFormatted: string;
  cachedDisplayCount: number;
  hasPendingChanges: boolean;
  message: string;
}

type SyncListener = (state: SyncState) => void;
const listeners = new Set<SyncListener>();

let currentState: SyncState = {
  status: typeof navigator !== 'undefined' && navigator.onLine ? 'ONLINE' : 'OFFLINE',
  lastSyncTimestamp: null,
  lastSyncFormatted: 'Belum pernah sinkron',
  cachedDisplayCount: 0,
  hasPendingChanges: false,
  message: 'Siap',
};

export function formatSyncDate(timestamp: number | null): string {
  if (!timestamp) return 'Belum pernah sinkron';
  const d = new Date(timestamp);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function notifyListeners() {
  for (const listener of listeners) {
    try {
      listener({ ...currentState });
    } catch (e) {
      console.warn('[SyncManager] Listener error:', e);
    }
  }
}

export function getSyncState(): SyncState {
  return { ...currentState };
}

export function subscribeToSyncStatus(listener: SyncListener): () => void {
  listeners.add(listener);
  listener({ ...currentState });
  return () => {
    listeners.delete(listener);
  };
}

export function updateSyncStatus(status: ConnectionStatus, message?: string) {
  currentState.status = status;
  if (message) currentState.message = message;
  notifyListeners();
}

/**
 * Initialize Sync Manager - loads last saved metadata and wires up online/offline listeners
 */
export async function initSyncManager(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const savedLastSync = await getDbMetadata('last_sync_timestamp');
    if (savedLastSync && typeof savedLastSync === 'number') {
      currentState.lastSyncTimestamp = savedLastSync;
      currentState.lastSyncFormatted = formatSyncDate(savedLastSync);
    }
  } catch {}

  const handleOnline = () => {
    console.log('⚡ [SyncManager] Network online detected. Triggering smart sync...');
    currentState.status = 'ONLINE';
    currentState.message = 'Koneksi internet terhubung';
    notifyListeners();
    triggerBackgroundSync();
  };

  const handleOffline = () => {
    console.log('⚠️ [SyncManager] Network offline detected. Switching to local offline mode.');
    currentState.status = 'OFFLINE';
    currentState.message = 'Mode Offline (Menggunakan Data Lokal)';
    notifyListeners();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Re-check when window gains focus or visibility (e.g. TV wakes up)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      triggerBackgroundSync();
    }
  });

  // Periodic lightweight check (every 45 seconds when online)
  setInterval(() => {
    if (navigator.onLine && currentState.status !== 'SYNCING') {
      triggerBackgroundSync();
    }
  }, 45000);
}

// Background sync lock
let isSyncInProgress = false;
let globalDisplaysProvider: (() => DisplayConfig[]) | null = null;
let globalDisplaysConsumer: ((displays: DisplayConfig[]) => void) | null = null;

export function registerSyncHandlers(
  getDisplays: () => DisplayConfig[],
  setDisplays: (displays: DisplayConfig[]) => void
) {
  globalDisplaysProvider = getDisplays;
  globalDisplaysConsumer = setDisplays;
}

export async function triggerBackgroundSync(): Promise<void> {
  if (isSyncInProgress) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    currentState.status = 'OFFLINE';
    currentState.message = 'Mode Offline (Menggunakan Data Lokal)';
    notifyListeners();
    return;
  }

  if (!globalDisplaysProvider || !globalDisplaysConsumer) return;
  const currentDisplays = globalDisplaysProvider();
  await performSmartSync(currentDisplays, globalDisplaysConsumer);
}

/**
 * Smart Differential Sync with Supabase:
 * 1. Checks if Supabase has changed by inspecting updated_at (ultra-lightweight query)
 * 2. If no change, updates lastSyncTimestamp with 0 data re-download
 * 3. If changed, fetches only what is necessary, updates local storage, caches schedules & assets
 * 4. On any failure: NEVER deletes or clears local data! Falls back silently to local storage.
 */
export async function performSmartSync(
  localDisplays: DisplayConfig[],
  onUpdateDisplays?: (updated: DisplayConfig[]) => void
): Promise<DisplayConfig[]> {
  if (isSyncInProgress) return localDisplays;

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    currentState.status = 'OFFLINE';
    currentState.message = 'Mode Offline (Menggunakan Data Lokal)';
    notifyListeners();
    return localDisplays;
  }

  isSyncInProgress = true;
  currentState.status = 'SYNCING';
  currentState.message = 'Memeriksa perubahan di Supabase...';
  notifyListeners();

  try {
    const supabase = await ensureSupabaseClient();

    if (!supabase || !isSupabaseConfigured()) {
      // Fall back to local server /api/displays
      try {
        const res = await fetch('/api/displays', { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const serverData = await res.json();
          if (Array.isArray(serverData) && serverData.length > 0) {
            await handleSuccessfulSync(serverData, onUpdateDisplays);
            return serverData;
          }
        }
      } catch {}

      // Keep existing local data
      currentState.status = navigator.onLine ? 'ONLINE' : 'OFFLINE';
      currentState.message = 'Siap (Data lokal aktif)';
      notifyListeners();
      return localDisplays;
    }

    // 1. Ultra-lightweight check: Select only code and updated_at
    const { data: metaRows, error: metaErr } = await supabase
      .from('displays')
      .select('code, updated_at')
      .order('code', { ascending: true });

    if (metaErr) {
      console.warn('⚠️ [SyncManager] Metadata check notice:', metaErr.message);
      currentState.status = 'OFFLINE';
      currentState.message = 'Gagal menghubungi Supabase, menggunakan data lokal';
      notifyListeners();
      return localDisplays;
    }

    if (!metaRows || metaRows.length === 0) {
      // Supabase is empty, preserve local displays
      currentState.status = 'ONLINE';
      currentState.message = 'Terkoneksi ke Supabase';
      notifyListeners();
      return localDisplays;
    }

    // 2. Compare timestamps with local displays
    let hasRemoteChanges = false;
    if (metaRows.length !== localDisplays.length) {
      hasRemoteChanges = true;
    } else {
      for (const remote of metaRows) {
        const local = localDisplays.find(
          (d) => d.code.toUpperCase() === String(remote.code).toUpperCase()
        );
        if (!local) {
          hasRemoteChanges = true;
          break;
        }
        const remoteTime = new Date(remote.updated_at || 0).getTime();
        const localTime = new Date(local.updatedAt || 0).getTime();
        // If remote is newer by more than 1 second
        if (remoteTime > localTime + 1000) {
          hasRemoteChanges = true;
          break;
        }
      }
    }

    // 3. If no changes, skip full payload download!
    if (!hasRemoteChanges) {
      const now = Date.now();
      currentState.status = 'ONLINE';
      currentState.lastSyncTimestamp = now;
      currentState.lastSyncFormatted = formatSyncDate(now);
      currentState.cachedDisplayCount = localDisplays.length;
      currentState.message = 'Sinkron • Data lokal sudah yang terbaru';
      await setDbMetadata('last_sync_timestamp', now);
      notifyListeners();
      return localDisplays;
    }

    // 4. Remote has changes: Download full rows
    currentState.message = 'Mengunduh data display terbaru...';
    notifyListeners();

    const fullRemote = await fetchDisplaysFromSupabase();
    if (fullRemote && fullRemote.length > 0) {
      await handleSuccessfulSync(fullRemote, onUpdateDisplays);
      return fullRemote;
    }

    return localDisplays;
  } catch (err: any) {
    console.warn('⚠️ [SyncManager] Sync exception notice:', err?.message || err);
    currentState.status = navigator.onLine ? 'ONLINE' : 'OFFLINE';
    currentState.message = 'Menggunakan data lokal yang tersimpan';
    notifyListeners();
    return localDisplays;
  } finally {
    isSyncInProgress = false;
  }
}

async function handleSuccessfulSync(
  freshDisplays: DisplayConfig[],
  onUpdateDisplays?: (updated: DisplayConfig[]) => void
) {
  const now = Date.now();

  // Save to IndexedDB & LocalStorage
  await saveDisplaysToDb(freshDisplays);

  // Pre-generate 12-month prayer schedule and pre-cache assets in background
  for (const d of freshDisplays) {
    generateAndCache12MonthSchedule(d, false).catch(() => {});
    cacheDisplayAssets(d).catch(() => {});
  }

  // Update sync metadata
  await setDbMetadata('last_sync_timestamp', now);
  await setDbMetadata('last_sync_displays_count', freshDisplays.length);

  currentState.status = 'ONLINE';
  currentState.lastSyncTimestamp = now;
  currentState.lastSyncFormatted = formatSyncDate(now);
  currentState.cachedDisplayCount = freshDisplays.length;
  currentState.message = 'Sinkronisasi berhasil • Data tersimpan di memori TV';
  notifyListeners();

  if (onUpdateDisplays) {
    onUpdateDisplays(freshDisplays);
  }
}
