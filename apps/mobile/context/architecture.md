# Architecture Context

## Stack

| Layer      | Technology                                | Role                                                               |
| ---------- | ----------------------------------------- | ------------------------------------------------------------------ |
| Framework  | Expo SDK 57 + React Native 0.86           | Cross-platform mobile runtime (iOS, Android, Web)                  |
| Language   | TypeScript 6.0 (strict)                   | Type-safe application code throughout                              |
| Routing    | Expo Router 57 (file-based)               | Navigation — tabs, stack, dynamic routes                           |
| Styling    | NativeWind 5 (Tailwind CSS v4)            | Utility-first styling with design token system in `global.css`     |
| State      | React Context + external-store controller | Session-scoped subscription state; no external state manager       |
| Data Layer | In-memory dev repository / Backend hook   | In-memory repository in development mode; future backend adapter   |
| Auth       | Clerk Expo                                | Authentication and session authority                              |
| Icons      | @expo/vector-icons (Ionicons) + local PNG | Tab bar, system, and subscription icons                            |
| Navigation | @react-navigation/bottom-tabs             | Tab navigator rendered by Expo Router                              |

## System Boundaries

- `app/(app)/(tabs)/` — Authenticated tab screens consume subscription state from `SubscriptionProvider`; Settings remains accessible even when no backend is connected.
- `app/(app)/subscriptions/[id].tsx` — Authenticated subscription detail route, outside the tab navigator.
- `app/(auth)/` — Auth screens: sign-in, sign-up, reset-password, session-task. Rendered inside a Stack navigator.
- `app/_layout.tsx` — Root Stack layout with ClerkProvider and optional PostHogProvider; `(app)/_layout.tsx` owns the authenticated app stack without a development data banner; individual screens handle safe-area spacing.
- `src/components/`, `src/features/`, `src/providers/`, `src/adapters/`, and `src/config/` — Mobile application code by responsibility.
- `context/` — AI context documentation only. Provider source lives in `src/providers/`.
- `global.css` — Design token definitions (colors, spacing, font families). All Tailwind/NativeWind classes are defined here under `@theme` and `@layer components`.
- `assets/` — Images, icons, and fonts. Read-only during normal development.

## Subscription Domain and Repository

- `src/features/subscriptions/subscription-model.ts` owns frontend subscription types (`SubscriptionRecord`, `CreateSubscriptionInput`, `UpdateSubscriptionInput`), product choice constants (currencies, frequencies, categories, statuses), and recurrence calculations.
- `src/features/subscriptions/subscription-repository.ts` defines the app-owned repository interface (`list`, `get`, `create`, `update`, `cancel`, `delete`).
- `src/features/subscriptions/in-memory-subscription-repository.ts` provides an in-memory repository used exclusively during development when `EXPO_PUBLIC_DATA_MODE=development` and `__DEV__ === true`.
- Future backend adapters implement `SubscriptionRepository`; repository selection in the session hook and the controller's development-only gate must also be updated and tested. Screen components remain interface consumers.
- Frontend session scoping is not server authorization: the future backend must authenticate requests and enforce ownership independently.

## Storage and Session Model

- **Development Data Mode**: In-memory subscription storage when `__DEV__ === true` and `EXPO_PUBLIC_DATA_MODE=development`. Resets on session switch, sign-out, or app reload. No AsyncStorage or file persistence.
- **Production Mode**: Shows a clear "Backend not connected" state for subscription features.
- **Clerk secure token cache**: Persists the active authentication session; credentials are not copied into application state or local storage.
- **React Context (session-scoped)**: `src/providers/SubscriptionContext.tsx` exposes session-scoped subscription state keyed by `${userId}:${sessionId}`. Its React-only `useSubscriptionSession` hook creates a fresh controller on every effect setup (including Strict Mode replay), disposes it on cleanup, and synchronously hides holders whose auth/mode scope no longer matches. Disposed controllers clear state and cannot be reactivated or accept actions.

## Invariants

1. **No hardcoded hex values in component files.** All colors must use NativeWind classes that map to tokens defined in `global.css` (`@theme`).
2. **Global CSS component classes must be used for repeated UI patterns.** The `@layer components` block in `global.css` defines semantic class names (e.g. `auth-button`, `auth-input`).
3. **Expo Router file-based routing must not be bypassed.** Navigation must use `<Link>`, `router.push()`, or `router.replace()` from `expo-router`.
4. **Context is the only source of truth for subscription data at runtime.** Components must not maintain their own independent copies of subscription lists.
5. **Authenticated work is session-generation scoped.** Sign-out, account changes, and same-user session replacement invalidate pending work and clear prior user-scoped subscriptions and errors.
6. **TypeScript strict mode is enforced.** No `any` types, no `// @ts-ignore`, no implicit `any` in function signatures.
