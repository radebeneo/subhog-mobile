/**
 * Determines whether the in-memory development subscription data mode is active.
 *
 * Rules:
 * 1. Must be running in development runtime (__DEV__ === true).
 * 2. EXPO_PUBLIC_DATA_MODE must be set exactly to "development".
 * 3. Static dot-notation access ensures Expo can inline the variable at build time.
 * 4. Production/release builds (__DEV__ === false) NEVER activate development data mode,
 *    even if EXPO_PUBLIC_DATA_MODE was set to "development".
 */
export function isDevelopmentDataModeActive(
  isDev: boolean = typeof __DEV__ !== "undefined" ? __DEV__ : false,
  dataMode: string | undefined = process.env.EXPO_PUBLIC_DATA_MODE,
): boolean {
  return isDev === true && dataMode === "development";
}
