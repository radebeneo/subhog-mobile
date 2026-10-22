# Code Standards

## General
- Keep implementation focused, simple, and teachable. Reuse the existing UI and assets.
- Fix root causes; do not hide errors with no-op successes or weaker TypeScript settings.
- Use strict TypeScript. No `any`, `@ts-ignore`, or implicit untyped parameters.
- Subscription types live in `src/features/subscriptions/subscription-model.ts`; image types belong to presentation.

## Routing and Authentication
- Expo Router layouts own navigators. Use `Link`, `router.push`, and `router.replace`.
- Authenticated `app/(app)/_layout.tsx` checks Clerk readiness, user ID, and session ID.
- Unauthenticated users are redirected to `(auth)/sign-in`; there is no onboarding route.
- Clerk hooks are the authority for authentication. Do not create a custom `AuthContext`.
- Preserve Clerk's secure token cache. Never expose private service credentials.

## State and Data
- Screens consume `useSubscriptions()` from `src/providers/SubscriptionContext.tsx`.
- All subscription access goes through `SubscriptionRepository`; screens never make subscription HTTP requests.
- Development records stay in memory, never AsyncStorage, files, or a database.
- Require both `__DEV__ === true` and exact `EXPO_PUBLIC_DATA_MODE=development`.
- Key authenticated providers by user and session. The session hook also synchronously hides mismatched scopes.
- Each effect setup creates a controller; cleanup disposes it permanently, including Strict Mode replay.
- Pending mutations stay locked until settlement. Duplicate attempts and UI dismissal cannot release that lock.
- Stale successes and rejections must not change current state. Disposal clears records and action state.
- Edit payloads omit dates unless schedule changes are intentional. Null/absent renewal dates are valid.
- Form and repository validation require nonblank names/payment methods and positive finite prices.
- Frontend session isolation is not server authorization; a future backend must enforce ownership independently.

## Styling
- Use the installed NativeWind 5 patterns and theme/component classes in `global.css`.
- Preserve spacing, typography, colors, radii, and layout; do not redesign during extraction fixes.
- Safe areas come from `react-native-safe-area-context`.
- Retained styled wrappers are supported by the installed NativeWind version. Use inline/StyleSheet only for unsupported or dynamic native props.
- Keep images/icons centralized in `src/config/images.ts` and `src/config/icons.ts`. Do not replace real assets.

## Organization
- `app/`: routes and layouts.
- `src/components/`: reusable presentation.
- `src/features/`: models, calculations, validation, controller, session hook.
- `src/providers/`: React Context.
- `src/adapters/`: optional analytics and external service boundaries.
- `context/`: documentation only, not providers.
- `test-support/`: Node-only test loader and native/Clerk mocks; never import from application code.

## Validation and Delivery
- Run root lint, application/test typechecks, unit/React tests, Expo diagnostics, and web export.
- Tests use the actual controller, provider, form, Settings, and analytics adapter with test-only boundary mocks.
- Native mocks do not establish real Clerk authentication or native-runtime verification.
- Report passed, failed, blocked, and not-run checks separately.
- Never publish, deploy, mutate external services, or change frameworks without applicable authorization.
