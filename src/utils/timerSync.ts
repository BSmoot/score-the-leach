/**
 * Utility functions for timer synchronization using the Page Visibility API
 * This helps maintain accurate timer state when the app goes to background and returns
 */

// Store timer start information
interface TimerInfo {
  startTime: number;      // Timestamp when timer started
  durationMs: number;     // Total duration in milliseconds
  remainingMs: number;    // Remaining time in milliseconds when last checked
  isRunning: boolean;     // Whether the timer is running
}

// Global variable to store timer information
let timerInfo: TimerInfo | null = null;

/**
 * Initialize timer tracking
 * @param remainingSeconds - Remaining time in seconds
 * @param isRunning - Whether the timer is currently running
 */
export const initializeTimer = (remainingSeconds: number, isRunning: boolean): void => {
  const now = Date.now();
  
  timerInfo = {
    startTime: now,
    durationMs: remainingSeconds * 1000,
    remainingMs: remainingSeconds * 1000,
    isRunning
  };
  
  console.log('Timer initialized:', timerInfo);
};

/**
 * Update timer state when it changes
 * @param remainingSeconds - Current remaining time in seconds
 * @param isRunning - Whether the timer is currently running
 */
export const updateTimerState = (remainingSeconds: number, isRunning: boolean): void => {
  if (!timerInfo) {
    initializeTimer(remainingSeconds, isRunning);
    return;
  }
  
  const now = Date.now();
  
  // If timer state changed (started/stopped)
  if (timerInfo.isRunning !== isRunning) {
    if (isRunning) {
      // Timer started - record new start time
      timerInfo.startTime = now;
      timerInfo.durationMs = remainingSeconds * 1000;
    }
    
    timerInfo.isRunning = isRunning;
  } else if (isRunning) {
    // Timer is still running - update start time based on current remaining time
    timerInfo.startTime = now;
  }
  
  // Update remaining time
  timerInfo.remainingMs = remainingSeconds * 1000;
  
  console.log('Timer state updated:', timerInfo);
};

/**
 * Calculate the current timer value based on elapsed time
 * Call this when the page becomes visible again
 * @returns The current timer value in seconds, or null if timer isn't initialized
 */
export const syncTimerOnVisibilityChange = (): number | null => {
  if (!timerInfo || !timerInfo.isRunning) {
    return null;
  }
  
  const now = Date.now();
  const elapsedSinceHidden = now - timerInfo.startTime;
  
  // Calculate new remaining time based on the time when the page was hidden
  const newRemainingMs = Math.max(0, timerInfo.remainingMs - elapsedSinceHidden);
  
  // Update the timer info with new remaining time and start time
  timerInfo.remainingMs = newRemainingMs;
  timerInfo.startTime = now; // Reset start time to now
  
  console.log('Timer synced on visibility change:', Math.ceil(newRemainingMs / 1000));
  
  // Return the new timer value in seconds (rounded up)
  return Math.ceil(newRemainingMs / 1000);
};
