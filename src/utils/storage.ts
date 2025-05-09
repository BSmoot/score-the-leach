// Storage utility functions for the Hockey Scoreboard application

/**
 * Save state to localStorage with improved type safety and error handling
 * @param key The localStorage key
 * @param value The value to store
 */
export function saveToLocalStorage<T>(key: string, value: T): void {
  if (typeof window !== 'undefined') {
    try {
      const serialized = JSON.stringify(value);
      // Check size before attempting to save
      const size = new Blob([serialized]).size;
      if (size > 4000000) { // 4MB limit
        console.warn(`Data for ${key} too large (${size} bytes), attempting cleanup`);
        if (key === 'hockey_score_history') {
          // For score history, save only the last entry
          const lastEntry = Array.isArray(value) ? [value[0]] : value;
          localStorage.setItem(key, JSON.stringify(lastEntry));
        } else {
          localStorage.setItem(key, serialized);
        }
      } else {
        localStorage.setItem(key, serialized);
      }
    } catch (e: unknown) {
      console.error('Error saving to localStorage:', e);
      if (e instanceof Error && e.name === 'QuotaExceededError') {
        // Clear old data and try again
        try {
          localStorage.clear();
          localStorage.setItem(key, JSON.stringify(value));
        } catch (retryError) {
          console.error('Failed to save even after clearing storage:', retryError);
        }
      }
    }
  }
}

/**
 * Load state from localStorage with improved type safety
 * @param key The localStorage key
 * @param defaultValue Default value if key doesn't exist
 * @returns The stored value or default value
 */
export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  
  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) {
      return defaultValue;
    }
    return JSON.parse(serialized) as T;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
}

/**
 * Hydrate state from localStorage
 * This is a utility function to load multiple values from localStorage
 * @param keys Object with keys mapping to default values
 * @returns Object with hydrated values
 */
export function hydrateFromStorage<T extends Record<string, any>>(
  keys: Record<string, { storageKey: string; defaultValue: any }>
): T {
  const result: Record<string, any> = {};
  
  try {
    Object.entries(keys).forEach(([stateKey, { storageKey, defaultValue }]) => {
      result[stateKey] = loadFromLocalStorage(storageKey, defaultValue);
    });
  } catch (error) {
    console.error('Error hydrating from localStorage', error);
  }
  
  return result as T;
}
