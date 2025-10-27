/**
 * Computes the server offset in milliseconds
 * @param serverNowISO - Server time as ISO string
 * @returns Offset in milliseconds (serverTime - clientTime)
 */
export function computeServerOffset(serverNowISO: string): number {
  return Date.parse(serverNowISO) - Date.now();
}

/**
 * Computes elapsed seconds for a task
 * @param accumulatedSeconds - Sum of all closed sessions
 * @param runningStartMs - Start time of running session in milliseconds (optional)
 * @param nowMs - Current time in milliseconds (optional, defaults to Date.now())
 * @returns Total elapsed seconds
 */
export function computeElapsedSeconds(
  accumulatedSeconds: number,
  runningStartMs?: number | null,
  nowMs?: number
): number {
  const now = nowMs ?? Date.now();
  const runningSeconds = runningStartMs ? Math.floor((now - runningStartMs) / 1000) : 0;
  return accumulatedSeconds + runningSeconds;
}

/**
 * Formats seconds as HH:MM:SS
 * @param seconds - Total seconds
 * @returns Formatted string (e.g., "01:23:45")
 */
export function formatHHMMSS(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [hours, minutes, secs]
    .map((val) => val.toString().padStart(2, '0'))
    .join(':');
}


