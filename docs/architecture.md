# Architecture Specification — SubHog Next

## 1. System Context & Overview

SubHog Next represents a clean decoupling of the client application from the legacy backend monorepo. It isolates the presentation, interaction, authentication, and state management layers of the Expo mobile app into a self-contained workspace.

```
┌────────────────────────────────────────────────────────┐
│                      SubHog Mobile                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │     Expo Router (app/(auth), app/(app)/(tabs))   │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │                            │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │              SubscriptionContext                 │  │
│  │   (Session-isolated by `${userId}:${sessionId}`) │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │                            │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │             SubscriptionController               │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │                            │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │        SubscriptionRepository Interface          │  │
│  └────────────┬─────────────────────────┬───────────┘  │
└───────────────┼─────────────────────────┼──────────────┘
                │                         │
     __DEV__ && │                         │ Future Backend
     dev mode   ▼                         ▼ Adapter
  ┌──────────────────┐           ┌──────────────────┐
  │   InMemoryRepo   │           │   Future API     │
  │   (Development)  │           │   (apps/api)     │
  └──────────────────┘           └──────────────────┘
```

## 2. Layer Definitions

### 2.1 Navigation & Presentation (`apps/mobile/app/`, `apps/mobile/src/components/`)
- Uses Expo Router 57 file-based routing.
- The root layout (`app/_layout.tsx`) initializes Clerk and conditionally renders `PostHogProvider` if analytics is active.
- Authenticated layout (`app/(app)/_layout.tsx`) wraps the authenticated stack with `SubscriptionProvider` keyed by `${userId}:${sessionId}`.
- The authenticated stack has no development data banner or additional top safe-area wrapper; individual screens handle safe-area spacing. Development storage and reset behavior are unchanged.
- If no backend is connected (e.g. production build without backend), subscription views render `SubscriptionStateView` showing `"Backend not connected"`.

### 2.2 Domain & Model Layer (`apps/mobile/src/features/subscriptions/subscription-model.ts`)
- Pure TypeScript interfaces and types:
  - `SubscriptionRecord`: Opaque `id`, `name`, `price`, `currency`, `frequency`, `category`, `paymentMethod`, `status`, `startDate`, `renewalDate`.
  - `CreateSubscriptionInput` and `UpdateSubscriptionInput`.
  - Product choices: `SUBSCRIPTION_CURRENCIES` (`USD`, `GBP`, `ZAR`), `SUBSCRIPTION_FREQUENCIES` (`daily`, `weekly`, `monthly`, `yearly`), `SUBSCRIPTION_CATEGORIES`, `SUBSCRIPTION_STATUSES`.
- Pure business logic:
  - Currency-separated recurrence grouping (`groupRecurringAmounts`).
  - Upcoming renewal sorting (`getUpcomingRenewals`).
  - Calendar-based recurrence incrementation (`calculateNextRenewalDate`).
  - Money predicates (`isNonNegativeMoneyAmount`, `isPositiveMoneyAmount`).
  - Validation guards.

### 2.3 Repository Contract (`apps/mobile/src/features/subscriptions/subscription-repository.ts`)
- App-owned repository interface:
  ```ts
  export interface SubscriptionRepository {
    list(): Promise<SubscriptionRecord[]>;
    get(id: string): Promise<SubscriptionRecord>;
    create(input: CreateSubscriptionInput): Promise<SubscriptionRecord>;
    update(id: string, input: UpdateSubscriptionInput): Promise<SubscriptionRecord>;
    cancel(id: string): Promise<SubscriptionRecord>;
    delete(id: string): Promise<void>;
    reset?(): void;
  }
  ```
- Errors are normalized as typed `SubscriptionRepositoryError` with codes `NOT_FOUND`, `VALIDATION_ERROR`, or `OPERATION_FAILED`.

### 2.4 In-Memory Development Repository (`apps/mobile/src/features/subscriptions/in-memory-subscription-repository.ts`)
- Transient in-memory Map of records.
- Generates non-MongoDB opaque IDs (`sub_<timestamp>_<sequence>_<random>`).
- Implements full CRUD, cancel tracking, and reset.
- Validates inputs strictly against domain rules.

### 2.5 State & Controller (`apps/mobile/src/features/subscriptions/subscription-controller.ts`)
- Session-scoped state machine:
  - Tracks auth readiness, loading, ready, error, and backend-not-connected states.
  - Action lifecycle: `idle` -> `pending` -> `success` / `validation-error` / `not-found` / `error`.
  - Generational numbering and action/list sequencing discard stale successes and rejections from switched sessions, disposed instances, or superseded list loads; this is result invalidation, not transport-level request cancellation.
  - Duplicate-submission prevention blocks concurrent mutations; rejected duplicates and pending-action dismissal cannot replace pending state or release its lock.

### 2.6 Authentication & Session Isolation
- Clerk Expo manages session tokens, user identity, and secure storage in `expo-secure-store`.
- The authenticated layout keys `SubscriptionProvider` by `${userId}:${sessionId}`. The provider delegates lifecycle to the React-only `useSubscriptionSession` hook, which also hides mismatched auth/mode scopes synchronously before effects run.
- Each effect setup creates a fresh controller and repository; cleanup permanently disposes that instance. This handles React Strict Mode effect replay without reviving disposed controllers.
- Disposed controllers clear visible subscription/action state, reset development records, invalidate pending results, and reject new actions.
- Form edit inputs omit dates when frequency is unchanged, preserving null/absent renewal dates and the original start-date string.
- Tests exercise the actual provider/form/Settings/analytics wiring with Node-only native and Clerk mocks; they do not substitute for authenticated device/browser smoke tests.

### 2.7 Analytics Boundary (`apps/mobile/src/adapters/posthog.ts`)
- Centralized configuration: when `EXPO_PUBLIC_DATA_MODE=development` is active in development, `posthog` is initialized to `null`.
- All analytics hooks and event emissions are suppressed in development data mode, preventing pollution of live projects.
