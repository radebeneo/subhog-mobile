import {
  isPostHogEnabled,
  resolvePostHogConfig,
  warnMissingOptionalAnalytics,
} from "@/adapters/posthog-config";
import { isDevelopmentDataModeActive } from "@/features/subscriptions/data-mode";
import PostHog from "posthog-react-native";

export {
  isPostHogConfigured,
  isPostHogEnabled,
  resolvePostHogConfig,
  sanitizePostHogProperties,
  warnMissingOptionalAnalytics,
} from "@/adapters/posthog-config";
export type { PostHogConfig } from "@/adapters/posthog-config";

const resolvedConfig = resolvePostHogConfig({
  EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN: process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN,
  EXPO_PUBLIC_POSTHOG_HOST: process.env.EXPO_PUBLIC_POSTHOG_HOST,
});
const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : false;
const devDataModeActive = isDevelopmentDataModeActive(
  isDev,
  process.env.EXPO_PUBLIC_DATA_MODE,
);

if (isDev && !devDataModeActive) {
  warnMissingOptionalAnalytics(resolvedConfig);
}

// When development subscription data mode is active, PostHog is disabled
// to prevent polluting the analytics project.
export const posthog: PostHog | null = isPostHogEnabled(
  resolvedConfig,
  devDataModeActive,
)
  ? new PostHog(resolvedConfig.projectToken!, {
      host: resolvedConfig.host!,
    })
  : null;
