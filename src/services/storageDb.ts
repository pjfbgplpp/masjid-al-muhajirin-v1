import { DisplayConfig, PrayerTimeItem } from '../types';

const DB_NAME = 'MasjidTvStorageDB';
const DB_VERSION = 2;
const STORE_NAME = 'displays';
const META_STORE = 'metadata';
const PRAYER_STORE = 'prayer_schedules';
const ASSETS_STORE = 'assets_cache';

export interface StoredPrayerDay {
  id: string; // `${code}:${dateStr}` e.g. "MASJID-01:2026-09-04"
  code: string;
  dateStr: string; // "YYYY-MM-DD"
  monthKey: string; // "YYYY-MM"
  gregorianDateStr: string;
  hijriDateStr: string;
  times: PrayerTimeItem[];
  updatedAt: string;
}

export interface StoredAsset {
  url: string;
  blob: Blob;
  mimeType: string;
  cachedAt: number;
  sizeBytes: number;
}

let dbInstance: IDBDatabase | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'code' });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(PRAYER_STORE)) {
        const pStore = db.createObjectStore(PRAYER_STORE, { keyPath: 'id' });
        pStore.createIndex('idx_code', 'code', { unique: false });
        pStore.createIndex('idx_date', 'dateStr', { unique: false });
        pStore.createIndex('idx_month', 'monthKey', { unique: false });
        pStore.createIndex('idx_code_date', ['code', 'dateStr'], { unique: true });
      }
      if (!db.objectStoreNames.contains(ASSETS_STORE)) {
        db.createObjectStore(ASSETS_STORE, { keyPath: 'url' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('[IndexedDB] Open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// =========================================================================
// DISPLAYS STORAGE
// =========================================================================

export async function saveDisplaysToDb(displays: DisplayConfig[]): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_NAME, META_STORE], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const metaStore = tx.objectStore(META_STORE);

    // Clear existing to avoid orphaned old codes
    store.clear();

    for (const d of displays) {
      store.put(d);
    }

    metaStore.put({
      key: 'last_saved_displays',
      timestamp: Date.now(),
      count: displays.length,
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Save displays error:', err);
  }
}

export async function loadDisplaysFromDb(): Promise<DisplayConfig[] | null> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const result = request.result;
        if (Array.isArray(result) && result.length > 0) {
          resolve(result as DisplayConfig[]);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Load error:', err);
    return null;
  }
}

export async function saveSingleDisplayToDb(display: DisplayConfig): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(display);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Save single error:', err);
  }
}

// =========================================================================
// PRAYER SCHEDULES (MULTI-MONTH / 12-MONTH CACHE)
// =========================================================================

export async function savePrayerSchedulesToDb(schedules: StoredPrayerDay[]): Promise<void> {
  if (!schedules || schedules.length === 0) return;
  try {
    const db = await openDatabase();
    const tx = db.transaction(PRAYER_STORE, 'readwrite');
    const store = tx.objectStore(PRAYER_STORE);

    for (const day of schedules) {
      store.put(day);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Save prayer schedules error:', err);
  }
}

export async function getPrayerDayFromDb(code: string, dateStr: string): Promise<StoredPrayerDay | null> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(PRAYER_STORE, 'readonly');
    const store = tx.objectStore(PRAYER_STORE);
    const id = `${code.toUpperCase().trim()}:${dateStr}`;
    const request = store.get(id);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        resolve((request.result as StoredPrayerDay) || null);
      };
      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Get prayer day error:', err);
    return null;
  }
}

export async function getPrayerDaysForMonthFromDb(code: string, monthKey: string): Promise<StoredPrayerDay[]> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(PRAYER_STORE, 'readonly');
    const store = tx.objectStore(PRAYER_STORE);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const cleanCode = code.toUpperCase().trim();
        const results = (request.result as StoredPrayerDay[]) || [];
        const filtered = results.filter(
          (r) => r.code === cleanCode && r.monthKey === monthKey
        );
        resolve(filtered);
      };
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('[IndexedDB] Get prayer month error:', err);
    return [];
  }
}

export async function countStoredPrayerDays(): Promise<number> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(PRAYER_STORE, 'readonly');
    const store = tx.objectStore(PRAYER_STORE);
    const request = store.count();

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || 0);
      request.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

// =========================================================================
// ASSETS & IMAGE BLOB CACHE
// =========================================================================

export async function saveAssetBlobToDb(url: string, blob: Blob, mimeType: string): Promise<void> {
  if (!url) return;
  try {
    const db = await openDatabase();
    const tx = db.transaction(ASSETS_STORE, 'readwrite');
    const store = tx.objectStore(ASSETS_STORE);

    const record: StoredAsset = {
      url,
      blob,
      mimeType: mimeType || blob.type || 'image/jpeg',
      cachedAt: Date.now(),
      sizeBytes: blob.size,
    };

    store.put(record);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Save asset error:', err);
  }
}

export async function getAssetBlobFromDb(url: string): Promise<StoredAsset | null> {
  if (!url) return null;
  try {
    const db = await openDatabase();
    const tx = db.transaction(ASSETS_STORE, 'readonly');
    const store = tx.objectStore(ASSETS_STORE);
    const request = store.get(url);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        resolve((request.result as StoredAsset) || null);
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('[IndexedDB] Get asset error:', err);
    return null;
  }
}

export async function countStoredAssets(): Promise<number> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(ASSETS_STORE, 'readonly');
    const store = tx.objectStore(ASSETS_STORE);
    const request = store.count();

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || 0);
      request.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

// =========================================================================
// METADATA (LAST SYNC, SYSTEM STATE)
// =========================================================================

export async function setDbMetadata(key: string, value: any): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(META_STORE, 'readwrite');
    const store = tx.objectStore(META_STORE);
    store.put({ key, value, timestamp: Date.now() });
  } catch (err) {
    console.warn('[IndexedDB] Set metadata warning:', err);
  }
}

export async function getDbMetadata(key: string): Promise<any> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(META_STORE, 'readonly');
    const store = tx.objectStore(META_STORE);
    const request = store.get(key);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function clearDb(): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_NAME, META_STORE, PRAYER_STORE, ASSETS_STORE], 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.objectStore(META_STORE).clear();
    tx.objectStore(PRAYER_STORE).clear();
    tx.objectStore(ASSETS_STORE).clear();
  } catch (err) {
    console.warn('[IndexedDB] Clear error:', err);
  }
}

