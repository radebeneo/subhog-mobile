# SubHog Next — Agent Guidelines & Boundaries

This repository is an extracted, standalone frontend baseline for the SubHog mobile application.

## Repository Boundaries

- **Workspaces**: Currently, `apps/mobile` is the sole workspace.
- **Future Backend**: A future backend may be added under `apps/api`. Do not create shared packages speculatively until concrete needs arise.
- **Dependency Invariant**: The mobile workspace (`apps/mobile`) must remain self-contained. It must not depend on legacy packages (`@subhog/contracts`, `@subhog/api-client`, `@subhog/domain`).

## Core Invariants

1. **Frontend-Owned Models**:
   - Subscription models live in `apps/mobile/src/features/subscriptions/subscription-model.ts`.
   - Use opaque string IDs.
   - Do not re-introduce MongoDB ObjectIds, `_id`, or database owner fields.
   - Do not re-introduce HTTP envelopes (`success: true, data: ...`) or backend error classes.

2. **Repository Abstraction**:
   - Data access occurs strictly through `SubscriptionRepository` (`apps/mobile/src/features/subscriptions/subscription-repository.ts`).
   - Screens and components must not make direct HTTP requests.
   - Frontend session scoping (`${userId}:${sessionId}`) is an isolation mechanism, not server authorization.

3. **Development Data Mode**:
   - Active only when `__DEV__ === true` AND `EXPO_PUBLIC_DATA_MODE === "development"`.
   - Never activate in production/release builds.
   - Transient in-memory storage only; never persist dev records to AsyncStorage or disk.
   - Resets automatically upon sign-out or session switch.
   - When inactive, the app displays "Backend not connected".

4. **Analytics Discipline**:
   - PostHog is optional and must not fail the app when absent.
   - All PostHog events are suppressed when development data mode is active to prevent project contamination.

5. **Expo SDK 57 Requirements**:
   - Verify APIs against Expo SDK 57 documentation (React Native 0.86, Expo Router 57).
   - Use `SafeAreaView` from `react-native-safe-area-context`.
   - Styling uses NativeWind 5 (Tailwind v4) configured via `global.css`.
