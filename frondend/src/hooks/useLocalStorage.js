import { useState, useCallback, useEffect, useRef } from 'react';

// Bump this number whenever the defaultConfig structure changes
const CONFIG_VERSION = 2;

// BroadcastChannel name for cross-context (iframe ↔ parent) sync
const CHANNEL_NAME = 'siteconfig-sync';

export function useLocalStorage(key, initialValue) {
  const channelRef = useRef(null);

  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      const version = window.localStorage.getItem(key + '_version');

      // If no saved config, or version mismatch, use fresh defaults
      if (!item || version !== String(CONFIG_VERSION)) {
        window.localStorage.setItem(key, JSON.stringify(initialValue));
        window.localStorage.setItem(key + '_version', String(CONFIG_VERSION));
        return initialValue;
      }

      return JSON.parse(item);
    } catch (error) {
      console.warn('Error reading localStorage:', error);
      return initialValue;
    }
  });

  // Set up BroadcastChannel for reliable cross-context sync
  // (parent window ↔ iframe). The storage event doesn't always
  // fire reliably in same-origin iframes in all browsers.
  useEffect(() => {
    try {
      channelRef.current = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current.onmessage = (e) => {
        if (e.data && e.data.key === key && e.data.value !== undefined) {
          setStoredValue(e.data.value);
        }
      };
    } catch {
      // BroadcastChannel not supported — fall back to storage event only
    }

    return () => {
      try {
        channelRef.current?.close();
      } catch {
        // ignore
      }
    };
  }, [key]);

  // Also listen for the standard storage event as a fallback
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch {
          // ignore parse errors
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  const setValue = useCallback(
    (value) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          window.localStorage.setItem(key + '_version', String(CONFIG_VERSION));

          // Broadcast the change to other contexts (iframe/parent)
          try {
            channelRef.current?.postMessage({ key, value: valueToStore });
          } catch {
            // ignore broadcast errors
          }

          return valueToStore;
        });
      } catch (error) {
        console.warn('Error writing to localStorage:', error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}
