import { createContext, useContext, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import defaultConfig from '../data/defaultConfig';
import API_BASE_URL from '../utils/api';

const SiteConfigContext = createContext(null);

const CACHE_KEY = 'prakrithi_siteconfig_cache';

// Deep-merge defaults so new config keys always have fallback values
function deepMerge(defaults, overrides) {
  if (!overrides || typeof overrides !== 'object') return { ...defaults };
  const result = { ...defaults };
  for (const key of Object.keys(overrides)) {
    if (
      overrides[key] !== null &&
      typeof overrides[key] === 'object' &&
      !Array.isArray(overrides[key]) &&
      typeof defaults[key] === 'object' &&
      defaults[key] !== null &&
      !Array.isArray(defaults[key])
    ) {
      result[key] = deepMerge(defaults[key], overrides[key]);
    } else {
      result[key] = overrides[key];
    }
  }
  return result;
}

function getInitialConfig() {
  let base = { ...defaultConfig };
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      base = deepMerge(defaultConfig, parsed);
    }
  } catch (e) {
    console.warn('Failed to parse cached site configuration', e);
  }
  if (!Array.isArray(base.products) || base.products.length === 0) {
    base.products = defaultConfig.products || [];
  }
  if (!Array.isArray(base.categories) || base.categories.length === 0) {
    base.categories = defaultConfig.categories || [];
  }
  if (!Array.isArray(base.sections)) {
    base.sections = defaultConfig.sections || [];
  }
  return base;
}

export function SiteConfigProvider({ children }) {
  const [config, setConfig] = useState(getInitialConfig);
  const [savedConfig, setSavedConfig] = useState(getInitialConfig);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(() => {
    try {
      return !localStorage.getItem(CACHE_KEY);
    } catch {
      return true;
    }
  });
  const channelRef = useRef(null);
  const sourceRef = useRef('init');
  const configRef = useRef(config);
  const hasUnsavedChangesRef = useRef(false);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Setup BroadcastChannel for cross-context (iframe/tabs) live preview sync
  useEffect(() => {
    channelRef.current = new BroadcastChannel('siteconfig-sync');
    
    channelRef.current.onmessage = (e) => {
      if (e.data && e.data.type === 'SYNC_CONFIG') {
        sourceRef.current = 'sync';
        setConfig(prev => {
          // Prevent infinite loop
          if (JSON.stringify(prev) !== JSON.stringify(e.data.payload)) {
            return e.data.payload;
          }
          return prev;
        });
      } else if (e.data && e.data.type === 'REQUEST_CONFIG') {
        // Broadcast unsaved changes to new tabs that just opened
        if (hasUnsavedChangesRef.current && channelRef.current) {
          channelRef.current.postMessage({ type: 'SYNC_CONFIG', payload: configRef.current });
        }
      }
    };

    // Ask other tabs for their unsaved config
    channelRef.current.postMessage({ type: 'REQUEST_CONFIG' });

    return () => {
      channelRef.current?.close();
    };
  }, []);

  // Broadcast config changes
  useEffect(() => {
    if (!isLoading && channelRef.current && sourceRef.current === 'user') {
      channelRef.current.postMessage({ type: 'SYNC_CONFIG', payload: config });
    }
  }, [config, isLoading]);

  // Load data from API (Stale-While-Revalidate pattern)
  useEffect(() => {
    async function loadData() {
      try {
        const [configRes, productsRes, categoriesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/config/`),
          fetch(`${API_BASE_URL}/products/`),
          fetch(`${API_BASE_URL}/categories/`)
        ]);
        
        const [configData, productsData, categoriesData] = await Promise.all([
          configRes.json(),
          productsRes.json(),
          categoriesRes.json()
        ]);

        const mergedConfig = deepMerge(defaultConfig, configData);
        
        // Ensure new sections added to defaultConfig are present even if backend has an older sections array
        if (configData.sections && Array.isArray(configData.sections)) {
          const existingIds = new Set(configData.sections.map(s => s.id));
          const newSections = defaultConfig.sections.filter(s => !existingIds.has(s.id));
          if (newSections.length > 0) {
            mergedConfig.sections = [...configData.sections, ...newSections];
          }
        }

        const finalProducts = (Array.isArray(productsData) && productsData.length > 0)
          ? productsData
          : (Array.isArray(mergedConfig.products) && mergedConfig.products.length > 0 ? mergedConfig.products : (defaultConfig.products || []));

        const finalCategories = (Array.isArray(categoriesData) && categoriesData.length > 0)
          ? categoriesData.map(c => ({ id: c.category_id, label: c.label }))
          : (Array.isArray(mergedConfig.categories) && mergedConfig.categories.length > 0 ? mergedConfig.categories : (defaultConfig.categories || []));

        const fullConfig = {
          ...mergedConfig,
          products: finalProducts,
          categories: finalCategories
        };

        setSavedConfig(fullConfig);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(fullConfig));
        } catch (storageErr) {
          console.warn('LocalStorage quota or write error on cache save:', storageErr);
        }

        // Only set config if we haven't already received unsaved changes from sync
        if (sourceRef.current === 'init' || sourceRef.current === 'api') {
          sourceRef.current = 'api';
          setConfig(fullConfig);
        }
      } catch (error) {
        console.error("Failed to load config from API, using cached or default data", error);
        if (sourceRef.current === 'init' || sourceRef.current === 'api') {
          sourceRef.current = 'api';
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Track unsaved changes
  useEffect(() => {
    if (isLoading) return;
    const isDifferent = JSON.stringify(config) !== JSON.stringify(savedConfig);
    setHasUnsavedChanges(isDifferent);
  }, [config, savedConfig, isLoading]);

  const updateConfig = useCallback(
    (path, value) => {
      sourceRef.current = 'user';
      setConfig((prev) => {
        const keys = path.split('.');
        const next = JSON.parse(JSON.stringify(prev));
        let obj = next;
        for (let i = 0; i < keys.length - 1; i++) {
          obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
        return next;
      });
    },
    []
  );

  const updateProduct = useCallback(
    (productId, updates) => {
      sourceRef.current = 'user';
      setConfig((prev) => {
        const next = { ...prev, products: prev.products.map((p) => (p.id === productId ? { ...p, ...updates } : p)) };
        return next;
      });
    },
    []
  );

  const addProduct = useCallback(
    (product) => {
      sourceRef.current = 'user';
      setConfig((prev) => {
        const maxId = prev.products.reduce((max, p) => Math.max(max, p.id || 0), 0);
        return { ...prev, products: [...prev.products, { ...product, id: maxId + 1 }] };
      });
    },
    []
  );

  const deleteProduct = useCallback(
    (productId) => {
      sourceRef.current = 'user';
      setConfig((prev) => ({
        ...prev,
        products: prev.products.filter((p) => p.id !== productId),
      }));
    },
    []
  );

  const saveConfig = useCallback(async (configOverride) => {
    const configToSave = configOverride || config;
    try {
      let response = await fetch(`${API_BASE_URL}/config/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configToSave)
      });
      
      // If direct request failed with network error or 404/405, try relative /api/config/ fallback
      if (!response.ok && API_BASE_URL !== '/api' && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        try {
          const fallbackRes = await fetch('/api/config/', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(configToSave)
          });
          if (fallbackRes.ok) {
            response = fallbackRes;
          }
        } catch {
          // ignore fallback error and handle original response
        }
      }
      
      if (!response.ok) {
        let errMsg = `Server returned status ${response.status}`;
        try {
          const errData = await response.json();
          if (errData?.message || errData?.detail || errData?.error) {
            errMsg = errData.message || errData.detail || errData.error;
          }
        } catch {
          // Response wasn't JSON
        }
        throw new Error(errMsg);
      }
      
      const result = await response.json();
      const updatedConfig = result.config_data ? {
        ...configToSave,
        ...result.config_data,
        products: configToSave.products,
        categories: configToSave.categories
      } : configToSave;

      setConfig(updatedConfig);
      setSavedConfig(updatedConfig);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(updatedConfig));
      } catch (storageErr) {
        console.warn('LocalStorage quota or write error on saveConfig:', storageErr);
      }
      return { success: true };
    } catch (error) {
      console.error("Error saving config:", error);
      alert(`Failed to save configuration to the server: ${error.message || 'Network or Server Error'}`);
      return { success: false, error };
    }
  }, [config]);

  const resetConfig = useCallback(() => {
    sourceRef.current = 'user';
    setConfig(savedConfig);
  }, [savedConfig]);

  const resetToDefaults = useCallback(() => {
    sourceRef.current = 'user';
    setConfig(defaultConfig);
    setSavedConfig(defaultConfig);
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({
      config,
      setConfig,
      updateConfig,
      updateProduct,
      addProduct,
      deleteProduct,
      saveConfig,
      resetConfig,
      resetToDefaults,
      hasUnsavedChanges,
      isLoading
    }),
    [config, updateConfig, updateProduct, addProduct, deleteProduct, saveConfig, resetConfig, resetToDefaults, hasUnsavedChanges, isLoading]
  );

  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfig() {
  const context = useContext(SiteConfigContext);
  if (!context) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  }
  return context;
}
