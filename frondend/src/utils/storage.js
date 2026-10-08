/**
 * High-performance dual-layer persistence utility for Prakrithi.
 * Combines synchronous LocalStorage (for 0ms initial render tick)
 * with asynchronous IndexedDB (for high-capacity, quota-free storage of banners and products).
 */

import defaultConfig from '../data/defaultConfig';

const LOCAL_CACHE_KEY = 'prakrithi_siteconfig_cache_v14';
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

function sanitizeCachedHero(configObj) {
  if (!configObj || typeof configObj !== 'object') return configObj;
  if (configObj.hero) {
    if (Array.isArray(configObj.hero.images)) {
      configObj.hero.images = configObj.hero.images
        .filter((img) => typeof img === 'string' && !img.includes('photo-1596040033229-a9821ebd058d'))
        .map((img, idx) => {
          if (typeof img === 'string' && img.startsWith('data:image/webp;base64,') && defaultConfig.hero?.images?.[idx]) {
            return defaultConfig.hero.images[idx];
          }
          return img;
        });
    }
    if (Array.isArray(configObj.hero.mobileImages)) {
      configObj.hero.mobileImages = configObj.hero.mobileImages
        .filter((img) => typeof img === 'string' && !img.includes('photo-1596040033229-a9821ebd058d'))
        .map((img, idx) => {
          if (typeof img === 'string' && img.startsWith('data:image/webp;base64,') && defaultConfig.hero?.mobileImages?.[idx]) {
            return defaultConfig.hero.mobileImages[idx];
          }
          return img;
        });
    }
    // If cache was empty or invalid, fall back to high-speed default banners
    if (!Array.isArray(configObj.hero.images) || configObj.hero.images.length === 0) {
      if (Array.isArray(defaultConfig.hero?.images) && defaultConfig.hero.images.length > 0) {
        configObj.hero.images = [...defaultConfig.hero.images];
        configObj.hero.mobileImages = Array.isArray(defaultConfig.hero?.mobileImages) ? [...defaultConfig.hero.mobileImages] : [];
        configObj.hero.bgImage = defaultConfig.hero.bgImage || configObj.hero.images[0];
        configObj.hero.productLinks = Array.isArray(defaultConfig.hero?.productLinks) ? [...defaultConfig.hero.productLinks] : [];
        configObj.hero.categoryLinks = Array.isArray(defaultConfig.hero?.categoryLinks) ? [...defaultConfig.hero.categoryLinks] : [];
      }
    } else {
      if (!Array.isArray(configObj.hero.categoryLinks)) {
        configObj.hero.categoryLinks = Array.isArray(defaultConfig.hero?.categoryLinks) ? [...defaultConfig.hero.categoryLinks] : [];
      }
      if (typeof configObj.hero.bgImage === 'string' && (configObj.hero.bgImage.includes('photo-1596040033229-a9821ebd058d') || configObj.hero.bgImage.startsWith('data:image/webp;base64,'))) {
        configObj.hero.bgImage = configObj.hero.images && configObj.hero.images.length > 0 ? configObj.hero.images[0] : '';
      }
    }
  }
  return configObj;
}

/**
 * Synchronously retrieves initial configuration from LocalStorage for instantaneous
 * first-frame rendering on page load/reload.
 */
export function getInitialLocalConfig() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    let cached = localStorage.getItem(LOCAL_CACHE_KEY);
    if (!cached) {
      // Migrate from previous cache versions (v9, v8, v7...) so user never experiences cold cache
      for (let v = 9; v >= 1; v--) {
        const prevKey = `prakrithi_siteconfig_cache_v${v}`;
        const prevData = localStorage.getItem(prevKey);
        if (prevData) {
          try {
            const parsed = JSON.parse(prevData);
            const sanitized = sanitizeCachedHero(parsed);
            cached = JSON.stringify(sanitized);
            localStorage.setItem(LOCAL_CACHE_KEY, cached);
          } catch {}
          break;
        }
      }
    }
    if (cached) {
      cleanupLegacyStorage();
      const parsed = JSON.parse(cached);
      return sanitizeCachedHero(parsed);
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
