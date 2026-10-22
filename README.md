# SubHog Next

A clean, modern extraction of the SubHog Expo mobile application into an independent workspace baseline with all legacy backend API coupling removed.

## Table of Contents

- [Overview](#overview)
- [What Was Extracted](#what-was-extracted)
- [What Is Preserved](#what-is-preserved)
- [What Was Removed](#what-is-removed)
- [Repository Structure](#repository-structure)
- [Prerequisites & Installation](#prerequisites--installation)
- [Environment Configuration](#environment-configuration)
  - [Required Clerk Configuration](#required-clerk-configuration)
  - [Optional Development Data Mode](#optional-development-data-mode)
  - [Optional PostHog Configuration](#optional-posthog-configuration)
- [Development Data Mode](#development-data-mode)
  - [In-Memory Lifetime & Session Reset](#in-memory-lifetime--session-reset)
  - [Release Build Behavior ("Backend Not Connected")](#release-build-behavior-backend-not-connected)
- [Running Verification Checks](#running-verification-checks)
- [Future Backend Integration](#future-backend-integration)
- [Release Blockers](#release-blockers)
- [Data Migration & Safety Notice](#data-migration--safety-notice)

---

## Overview

SubHog is a cross-platform mobile subscription management application built with Expo SDK 57, React Native 0.86, and NativeWind 5 (Tailwind CSS v4). It enables users to track, categorize, and analyze recurring subscriptions with currency-separated spend insights.

This repository (`subhog-next`) extracts the mobile application from the original monorepo, establishing a clean frontend baseline designed around an app-owned domain model and repository pattern.

---

## What Was Extracted

- The complete Expo mobile application located in `apps/mobile/`.
- All routes, layouts, tabs, and dynamic detail screens (`app/`).
- Design system, components, icons, and theme configuration (`global.css`, `src/components/`, `assets/`).
- Clerk authentication and session flows (sign-in, sign-up, email verification, MFA, recovery).
- Pure presentation and financial calculation logic from the legacy domain package.

---

## What Is Preserved

- **UI and Design System**: Warm-toned design tokens, NativeWind component layers, responsive layouts, typography, and card treatments.
- **Expo Router Navigation**: Root layouts, auth stack, main tab navigator (Home, Subscriptions, Insights, Settings), and subscription detail modal/route.
- **Clerk Authentication**: Secure session persistence with `expo-secure-store`, password authentication, email verification code flows, MFA handling, session task prompts, and social login buttons.
- **Subscription Management Logic**: Add/edit subscription modal, calendar recurrence calculations, upcoming renewal sorting, and multi-currency grouping.
- **Optional PostHog Integration**: Optional analytics setup, sanitized event formatting, and graceful degradation when unconfigured.

---

## What Was Removed

- **Legacy Monorepo Dependencies**: `@subhog/api-client`, `@subhog/contracts`, and `@subhog/domain`.
- **Legacy Workspaces**: `apps/api/`, `packages/api-client/`, `packages/contracts/`, and `packages/domain/`.
- **Pre-build Lifecycle Hooks**: Removed `prestart`, `prebuild`, `pretest`, `eas-build-post-install` and related build commands that targeted the legacy API client.
- **Legacy Configuration Modules**: `src/config/api-config.ts` and `src/config/clerk-token.ts`.
- **Legacy Environment Variables**: `EXPO_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_CLERK_TOKEN_TEMPLATE`.
- **Legacy Backend Workflows**:
  - Identity resolution (`getIdentity`) and explicit provisioning (`provisionIdentity`).
  - "Create SubHog profile" and `PROFILE_INCOMPLETE` recovery screens.
  - Legacy 2–20 character combined-name restriction on sign-up (replaced by sensible non-blank trimmed validation).
  - Legacy backend account deletion workflow (disabled in every build of this baseline, with an informative notice).
  - Mongoose ObjectId assumptions and server response envelope parsing.
  - "API backed" label on the Home screen.

---

## Repository Structure

```
subhog-next/
├── package.json
├── package-lock.json
├── .nvmrc
├── .gitignore
├── README.md
├── AGENTS.md
├── docs/
│   ├── architecture.md
│   ├── extraction-checklist.md
│   └── verification-report.md
└── apps/
    └── mobile/
        ├── app/
        ├── assets/
        ├── context/
        ├── src/
        ├── app.config.ts
        ├── app.json
        ├── eas.json
        ├── global.css
        ├── metro.config.js
        ├── package.json
        ├── tsconfig.json
        └── ...
```

Initially, only `apps/mobile` is a configured workspace. The repository is structured to allow future addition of `apps/api` without altering mobile frontend code.

---

## Prerequisites & Installation

- **Node.js**: `24.11.x` (pinned via `.nvmrc`)
- **npm**: `11.6.x`

Install workspace dependencies from the repository root:

```bash
npm ci
```

---

## Environment Configuration

Copy the example environment file in `apps/mobile`:

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

### Required Clerk Configuration

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

Clerk authentication requires a valid publishable key. In CI or preview environments, ensure this variable is set.

### Optional Development Data Mode

```env
EXPO_PUBLIC_DATA_MODE=development
```

When set to `development` during local development (`__DEV__ === true`), in-memory subscription data is activated.

### Optional PostHog Configuration

```env
EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN=
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

PostHog is optional and non-fatal when unconfigured. When development data mode is active, PostHog event emission is automatically suppressed to avoid contaminating project analytics.

---

## Development Data Mode

### In-Memory Lifetime & Session Reset

1. **Transient Storage**: Subscriptions created or edited in development data mode exist solely in memory (`InMemorySubscriptionRepository`). No AsyncStorage, disk, or remote database is modified.
2. **Session Isolation**: Subscription state is strictly scoped to the active Clerk session (`${userId}:${sessionId}`).
3. **Automatic Resets**: Switching users or session IDs, signing out, or reloading resets in-memory data. A token refresh within the same user/session scope does not reset records. Strict Mode cleanup disposes its controller; the next effect setup creates a fresh instance.
4. **Persistent Label**: A persistent, accessible banner is displayed at the top of authenticated screens:
   `Development data — resets on reload`
   This indicator remains visible on detail screens as well as dashboard tabs.

### Release Build Behavior ("Backend Not Connected")

Production and release builds (`__DEV__ === false`) **never** activate the in-memory repository, even if `EXPO_PUBLIC_DATA_MODE` is accidentally set to `development`. In release builds or when the flag is omitted:
- Subscription screens display an accessible **"Backend not connected"** state.
- Settings, session inspection, and sign-out remain fully operational.
- No network requests are made to non-existent backend endpoints.

---

## Running Verification Checks

See [the verification report](docs/verification-report.md) for dated evidence and unresolved blockers. The remediation has passing lint, application/test typechecks, 62 tests, Expo Doctor (21/21), and web export under Node 24.11.1 / npm 11.6.2. Authenticated runtime checks and a completed fresh installation are **not verified**, so this is not an unqualified extraction-completion or production-readiness claim.

The user approved Expo 57.0.31 and Router 57.0.29 patch updates and React test renderer dev dependencies. React, React Native, and NativeWind versions were not upgraded; npm refreshed some transitive dependencies of the approved patches. Obsolete SDK 57 `newArchEnabled` and `android.edgeToEdgeEnabled` config flags were removed.

Run verification suites directly from the repository root:

```bash
# Typecheck mobile application and focused test suites
npm run typecheck

# Lint codebase
npm run lint

# Run unit and actual React-wiring tests (Node-only native/Clerk mocks)
npm run test

# Web export build
npm run build
```

---

## Future Backend Integration

When the replacement backend is implemented, it can be added under `apps/api` or as an external service. To connect the mobile app:
1. Implement the frontend `SubscriptionRepository` interface (`apps/mobile/src/features/subscriptions/subscription-repository.ts`):
   - `list()`
   - `get(id)`
   - `create(input)`
   - `update(id, input)`
   - `cancel(id)`
   - `delete(id)`
2. Wire repository selection through `useSubscriptionSession`; the current `SubscriptionProvider` does not expose a repository-injection prop.
3. Update repository selection in `useSubscriptionSession` and the controller's development-only availability gate for the new adapter. Screens consume the existing interface; production integration, async cancellation, and server authorization still require implementation and tests.

> **Security Note**: Frontend session scoping is not server authorization. The backend must independently authenticate all incoming requests and enforce user data ownership.

---

## Release Blockers

The following items must be resolved before a production release:
1. **Replacement Backend Implementation**: Implementation of a production-ready API and corresponding `SubscriptionRepository` adapter.
2. **Account Deletion Workflow**: Complete backend and identity deletion pipeline to fulfill privacy requirements. Account deletion is currently disabled with an in-app notice.
3. **Production Clerk & EAS Configuration**: Approved production credentials and build configuration.
4. **Security Review**: npm audit reports 43 advisories (15 moderate, 27 high, 1 critical), including transitive `shell-quote` command injection. Broad fixes were not authorized/applied.
5. **Verification**: Completed clean installation and authenticated web/native smoke tests, session transitions, and subscription/analytics network checks.

---

## Data Migration & Safety Notice

This remediation did not migrate data, mutate legacy services, modify the source repository, deploy, or push. The source remains clean at `20729d10a667658b1458926366fc2af749569501`. Existing local public configuration was not displayed or committed; `.env` and generated `dist` are ignored. Earlier external-service activity cannot be independently established from destination files alone. See the verification report for the precise evidence limits.
