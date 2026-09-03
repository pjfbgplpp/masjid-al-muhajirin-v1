import { DisplayConfig } from '../types';

const DB_NAME = 'MasjidTvStorageDB';
const DB_VERSION = 1;
const STORE_NAME = 'displays';
const META_STORE = 'metadata';

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

export async function clearDb(): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_NAME, META_STORE], 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.objectStore(META_STORE).clear();
  } catch (err) {
    console.warn('[IndexedDB] Clear error:', err);
  }
}
