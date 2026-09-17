/**
 * High-performance dual-layer persistence utility for Prakrithi.
 * Combines synchronous LocalStorage (for 0ms initial render tick)
 * with asynchronous IndexedDB (for high-capacity, quota-free storage of banners and products).
 */

const LOCAL_CACHE_KEY = 'prakrithi_siteconfig_cache_v8';
const DB_NAME = 'prakrithi_storage';
const DB_VERSION = 1;
const STORE_NAME = 'site_config';

// Automatically clean up stale legacy cache versions to free up browser quota
export function cleanupLegacyStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('prakrithi_siteconfig_cache_') && key !== LOCAL_CACHE_KEY) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.warn('Failed to clean up legacy storage:', err);
  }
}

// Open IndexedDB database
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

/**
 * Reads full site config from IndexedDB asynchronously.
 * Returns null if not found or on error.
 */
export async function getStoredConfig() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get('current_config');

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('IndexedDB read failed, falling back to LocalStorage:', err);
    return null;
  }
}

/**
 * Saves full site config to IndexedDB asynchronously.
 * Supports large datasets (megabytes of banners and product images) without quota errors.
 */
export async function setStoredConfig(config) {
  if (!config) return false;
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const toStore = {
        ...config,
        _storedAt: Date.now(),
      };
      const request = store.put(toStore, 'current_config');

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => {
        console.warn('IndexedDB put error:', e);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('IndexedDB write error:', err);
    return false;
  }
}

/**
 * Synchronously retrieves initial configuration from LocalStorage for instantaneous
 * first-frame rendering on page load/reload.
 */
export function getInitialLocalConfig() {
  cleanupLegacyStorage();
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const cached = localStorage.getItem(LOCAL_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.warn('Failed to read initial config from localStorage:', err);
  }
  return null;
}

/**
 * Synchronously writes configuration to LocalStorage with automatic quota protection.
 * If quota is exceeded, attempts to clean legacy keys and store a pruned version.
 */
export function saveLocalConfig(config) {
  if (!config || typeof window === 'undefined' || !window.localStorage) return false;

  const serialized = JSON.stringify(config);
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, serialized);
    return true;
  } catch (err) {
    console.warn('LocalStorage quota error on save. Cleaning legacy keys and trimming...', err);
    cleanupLegacyStorage();

    try {
      // Retry once after legacy cleanup
      localStorage.setItem(LOCAL_CACHE_KEY, serialized);
      return true;
    } catch {
      // If still exceeding, store a trimmed version in LocalStorage (preserving layout, text, products metadata)
      // while IndexedDB retains the full heavy data URLs
      try {
        const trimmed = {
          ...config,
          hero: {
            ...config.hero,
            images: Array.isArray(config.hero?.images) ? config.hero.images.slice(0, 2) : [],
            mobileImages: Array.isArray(config.hero?.mobileImages) ? config.hero.mobileImages.slice(0, 2) : []
          }
        };
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(trimmed));
        return true;
      } catch (finalErr) {
        console.warn('LocalStorage completely full. Relying on IndexedDB:', finalErr);
        return false;
      }
    }
  }
}
