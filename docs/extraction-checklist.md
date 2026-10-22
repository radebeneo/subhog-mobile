# Extraction Checklist — SubHog Next

This checklist tracks the decoupling and extraction of the SubHog Expo mobile application from the legacy monorepo.

## 1. Safety & Repository Invariants
- [x] Confirm source repository path: `C:\Users\NeoRadebe\Downloads\SubHog`
- [x] Confirm clean source working tree and record commit: `20729d10a667658b1458926366fc2af749569501`
- [x] Destination sibling directory `subhog-next` created as a fresh git repository.
- [x] Original repository was not modified, deleted, moved, or rewritten.
- [x] This remediation invoked no legacy database/service operations; earlier service activity is not independently certified by the destination files.
- [x] No private credentials copied during remediation. User-supplied public configuration is local in ignored `.env`, not printed or included in delivery.
- [x] No remote repository created or pushed.

## 2. Legacy Coupling Removal
- [x] Removed `@subhog/api-client` from `package.json`
- [x] Removed `@subhog/contracts` from `package.json`
- [x] Removed `@subhog/domain` from `package.json`
- [x] Removed legacy lifecycle scripts (`prestart`, `preandroid`, `preios`, `preweb`, `pretest`, `prebuild`, `eas-build-post-install`)
- [x] Removed `src/config/api-config.ts` and `src/config/clerk-token.ts`
- [x] Removed `tests/api-config.test.ts` and `tests/clerk-token-config.test.ts`
- [x] Removed `EXPO_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_CLERK_TOKEN_TEMPLATE`
- [x] Removed JWT inspection/debugging effect in `SubscriptionContext.tsx`
- [x] Removed identity resolution and explicit provisioning (`getIdentity`, `provisionIdentity`, `PROFILE_INCOMPLETE`)
- [x] Removed legacy owner comparison checks (`subscription.user !== apiUserId`)
- [x] Removed "API backed" label from Home screen
- [x] Left behind `apps/api/`, `packages/api-client/`, `packages/contracts/`, `packages/domain/`
- [x] Left behind historical PostHog wizard skills and reports

## 3. Frontend-Owned Model & Domain
- [x] Created `src/features/subscriptions/subscription-model.ts`
- [x] Opaque string IDs, no MongoDB ObjectId validation
- [x] No `_id` or `user` fields on core record
- [x] Separated create input, update input, stored record, and display model
- [x] Preserved product choices: currencies, frequencies, categories, statuses
- [x] Moved pure calculations from domain: `groupRecurringAmounts`, `getUpcomingRenewals`, `calculateNextRenewalDate`, money predicates
- [x] Preserved Day.js calendar recurrence calculations

## 4. Repository & Data Modes
- [x] Created `SubscriptionRepository` interface in `src/features/subscriptions/subscription-repository.ts`
- [x] Implemented `InMemorySubscriptionRepository` in `src/features/subscriptions/in-memory-subscription-repository.ts`
- [x] In-memory repository starts empty, supports CRUD, cancel tracking, and reset
- [x] Opaque non-MongoDB ID generator (`sub_<timestamp>_<sequence>_<random>`)
- [x] Implemented explicit gate in `data-mode.ts`: `__DEV__ === true` AND `EXPO_PUBLIC_DATA_MODE === "development"`
- [x] Tested production refusal: release builds never activate in-memory mode
- [x] Implemented "Backend not connected" state in `SubscriptionStateView`
- [x] Development banner was added during extraction, then removed at the user's request on 2026-10-22; development data gating and resets remain unchanged

## 5. Session Isolation & Controller
- [x] Scoped controller and provider by `${userId}:${sessionId}`
- [x] Invalidate pending actions and reset in-memory data on session switch / sign-out
- [x] Prevented duplicate submissions during pending actions
- [x] Discarded stale async resolutions from superseded actions or prior sessions
- [x] Handled action failures gracefully without hanging buttons or spinners

## 6. Authentication & Settings
- [x] Removed legacy 2–20 character combined-name restriction on sign-up
- [x] Preserved non-blank trimmed name validation
- [x] Surfaced Clerk field validation errors
- [x] Retained Delete Account section in Settings but disabled it with the required notice:
      `"Account deletion is unavailable in this development build while the new backend is being prepared."`
- [x] Preserved sign-out and session list management

## 7. PostHog Analytics
- [x] PostHog remains optional and non-fatal when unconfigured
- [x] Suppressed PostHog client and all event emission when development data mode is active
- [x] Centralized decision in `src/adapters/posthog.ts` and `src/adapters/posthog-config.ts`

## 8. Verification & Tooling
- [x] Added `@types/node` directly to `apps/mobile/devDependencies`
- [x] Updated `tsconfig.test.json` with explicit files list
- [x] Pinned Node/npm and lightningcss overrides at workspace root
- [x] Root scripts configure `build`, `lint`, `typecheck`, and `test`
- [x] Generated destination `package-lock.json`
- [x] Application and test TypeScript checks pass.
- [x] Lint passes.
- [x] All 62 unit/actual React-wiring tests pass with Node-only boundary mocks.
- [x] Expo Doctor passes 21/21 checks.
- [x] Expo public configuration resolves; values not included in delivery.
- [x] Web static export succeeds with local Clerk configuration and process-local analytics-disable overrides.
- [x] All 46 assets are byte-identical and all 15 route/layout file paths are retained.
- [x] Documented npm audit findings: 43 vulnerable dependency entries (15 moderate, 27 high, 1 critical); no broad fixes applied.
- [x] Disclosed direct approved patches and transitive lockfile changes, including `xcode` 3.0.1 → 4.0.0.

## 9. Acceptance Gates Still Open

Implementation/test checks above do not establish authenticated runtime behavior. Full extraction acceptance remains blocked; see [verification-report.md](verification-report.md).

- [ ] Completed fresh `npm ci` with pinned Node/npm (attempts timed out at 300/600 seconds, then 360-second bounded-network and 180-second offline retries; lockfiles unchanged).
- [ ] Authenticated browser smoke tests, real Clerk session transitions, and runtime UI parity (intermittent CM Browser access reaches `/sign-in` without exposed content; panel times out and no usable capture was returned).
- [ ] Live network evidence for no legacy subscription requests and analytics suppression (mock tests only; no authenticated trace).
- [ ] Android runtime/build checks (SDK/adb unavailable).
- [ ] iOS runtime/build checks (requires an iOS-capable environment, not Windows).
- [ ] Final acceptance review and requested local delivery commit (deferred; nothing pushed).

Security review is additionally required before production release. No replacement backend or account-deletion service is implemented in this baseline.
