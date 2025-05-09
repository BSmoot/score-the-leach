/**
 * Utility functions for handling Wake Lock API
 * This prevents the screen from turning off on supported browsers
 */

// Type for Wake Lock
type WakeLockType = {
  release: () => Promise<void>;
  addEventListener: (type: string, listener: EventListener) => void;
};

// Global variable to store the wake lock
let wakeLock: WakeLockType | null = null;

/**
 * Check if Wake Lock API is supported in the current browser
 */
export const isWakeLockSupported = (): boolean => {
  return 'wakeLock' in navigator && 'request' in (navigator as unknown as { wakeLock: { request: (type: string) => Promise<unknown> } }).wakeLock;
};

/**
 * Request a wake lock to prevent the screen from turning off
 * @returns Promise<boolean> - Whether the wake lock was successfully acquired
 */
export const requestWakeLock = async (): Promise<boolean> => {
  if (!isWakeLockSupported()) {
    console.log('Wake Lock API not supported in this browser');
    return false;
  }

  try {
    // Request a screen wake lock
    wakeLock = await (navigator as unknown as { wakeLock: { request: (type: string) => Promise<WakeLockType> } }).wakeLock.request('screen');
    console.log('Wake Lock is active');
    
    // Add a listener to handle case when wake lock is released automatically
    wakeLock.addEventListener('release', () => {
      console.log('Wake Lock was released');
      wakeLock = null;
    });
    
    return true;
  } catch (err) {
    console.error(`Error requesting Wake Lock: ${err}`);
    return false;
  }
};

/**
 * Release the wake lock if it's active
 */
export const releaseWakeLock = async (): Promise<void> => {
  if (wakeLock) {
    try {
      await wakeLock.release();
      wakeLock = null;
      console.log('Wake Lock released');
    } catch (err) {
      console.error(`Error releasing Wake Lock: ${err}`);
    }
  }
};
