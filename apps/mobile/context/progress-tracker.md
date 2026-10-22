# Progress Tracker

## Current Phase

- MOBILE-EXTRACT-01: Extraction of SubHog Expo application into independent workspace baseline

## Current Goal

- Provide a clean, operational frontend baseline with all legacy API coupling removed, frontend-owned subscription models and repository, explicit development-only in-memory data mode, and full verification.

## Completed Work

- Extracted mobile application to `subhog-next` repository with minimal npm workspaces root.
- Removed legacy monorepo dependencies: `@subhog/api-client`, `@subhog/contracts`, `@subhog/domain`.
- Removed legacy lifecycle pre-build hooks and API client generation scripts.
- Removed legacy configuration modules: `src/config/api-config.ts` and `src/config/clerk-token.ts`.
- Removed legacy environment variables: `EXPO_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_CLERK_TOKEN_TEMPLATE`.
- Removed legacy JWT diagnostic code and owner-checking logic from SubscriptionContext.
- Implemented frontend-owned models and validation in `src/features/subscriptions/subscription-model.ts`.
- Preserved currency-separated and frequency-separated totals and calendar recurrence calculations from domain logic.
- Implemented app-owned `SubscriptionRepository` interface in `src/features/subscriptions/subscription-repository.ts`.
- Implemented `InMemorySubscriptionRepository` in `src/features/subscriptions/in-memory-subscription-repository.ts` for development.
- Implemented explicit development data mode gate (`EXPO_PUBLIC_DATA_MODE=development` AND `__DEV__ === true`) in `src/features/subscriptions/data-mode.ts`.
- Implemented "Backend not connected" state in `SubscriptionStateView` when development mode is inactive.
- Added persistent, accessible development banner ("Development data — resets on reload") across all authenticated screens including detail views.
- Maintained session isolation keyed by `${userId}:${sessionId}`, ensuring in-memory resets on account switch or sign-out.
- Removed legacy 2-20 character name limit on sign-up; preserved nonblank trimming validation.
- Retained Settings account deletion section in disabled state with clear development notice.
- Centralized PostHog analytics suppression during development subscription data mode.
- Created unit tests covering models, in-memory repository, data mode selection, production refusal, session isolation, duplicate submission prevention, and disabled account deletion.

## Audit Remediation — 2026-10-22

- Fixed controller duplicate locking, pending-action dismissal, disposal state clearing, and superseded list results.
- Added a React-only session hook with effect-owned controller instances, external-store notifications, and synchronous auth/mode visibility guards; lifecycle and actual UI regression tests pass.
- Form edit payloads now omit dates unless frequency changes; synchronous submit locking and rejection handling protect the form.
- Invalid/empty dates and nonpositive edit prices now return typed validation failures.
- User approved test renderer dev dependencies and only Expo 57.0.31 / Router 57.0.29 patch updates.
- Removed obsolete Android edge-to-edge flag after SDK 57 config documentation/schema review.
- Downloaded pinned Node 24.11.1 / npm 11.6.2 into the approved temporary tools directory without changing global tooling.
- Actual React/provider/form/Settings/analytics tests pass (62/62); lint and application/test typechecks pass. Test declarations cover app types, assets, Expo, and NativeWind without weakening compiler settings.
- Web static export passed with locally configured Clerk key and analytics disabled through process-local overrides.
- Removed obsolete `newArchEnabled` as well as `android.edgeToEdgeEnabled`; neither is accepted by SDK 57 schema, and architecture/edge-to-edge are mandatory.
- CM Browser tab creation failed: connection closed/unavailable. Authenticated browser/network checks remain blocked; no alternate browser or auth bypass was used.
- Android SDK/adb unavailable; iOS cannot run on Windows.
- Expo Doctor passes 21/21 checks; public configuration resolves without displaying values.
- All 46 source assets are byte-identical; all 15 route/layout file paths are retained. Source remains clean at `20729d10a667658b1458926366fc2af749569501`.
- Saved npm audit reports 43 vulnerable dependency entries (15 moderate, 27 high, 1 critical), including transitive `shell-quote@1.10.0`; no broad automatic fixes applied.
- Isolated fresh `npm ci` attempts timed out at 300 and 600 seconds. Registry/cache operations were slow in diagnostic tails; installation success and the root cause remain unverified.
- Updated README, architecture/context documentation, and acceptance checklist; added `docs/verification-report.md` with evidence, exact limits, security findings, and dependency differences (including transitive `xcode` 3.0.1 → 4.0.0).
- Full extraction acceptance is blocked by clean-install and authenticated runtime/network verification. Requested local delivery commit is deferred; no commit or push performed. Review-panel presentation timed out.

## Resumed Acceptance Verification — 2026-10-22

- Retried clean installation in a new temporary copy: bounded-network attempt timed out at 360 seconds; offline attempt timed out at 180 seconds. Neither has a completion result.
- Found inherited missing lockfile metadata: 890 of 1055 destination package entries lack download URLs and integrity hashes. An offline exact-version metadata probe timed out; no metadata or dependency versions were changed.
- Restored npm 11.6.2 from the existing temporary archive after the original extracted npm directory was found missing; global tooling remains unchanged.
- Reconfirmed destination and temporary-copy lockfiles are unchanged and identical after the retries; original repository remains clean at its recorded commit.
- Reran application/test typechecks successfully (exit 0) and separately reran all 62 tests successfully (exit 0, no failures/cancelled/skipped/todo) against existing dependencies.
- Lint rerun timed out within the combined 180-second verification command after Expo loaded configuration; the earlier passing lint result is not a pass for this attempt.
- Expo web server bundled and started the application at port 8083 with analytics disabled. CM Browser eventually reported `/sign-in` but no content or controls; panel presentation timed out and screenshot returned no usable result. No real authentication, runtime parity, or endpoint-specific network verification was established.
- Updated `docs/verification-report.md` and the extraction checklist with these limits. Full acceptance and the local delivery commit remain deferred; no commit, push, backend, or broad dependency fix performed.

## Next Up — Acceptance Gates

- Complete pinned-tooling clean installation and rerun checks in that clean environment.
- Restore visible CM Browser access and perform authenticated smoke/session/network checks with user-controlled credential entry.
- Configure Android SDK/device or emulator; obtain an iOS-capable environment for applicable native verification.
- Review final changes and create the requested local delivery commit only after acceptance; do not push.

## Future Work — Outside Extraction Scope

- Connect a replacement backend implementing `SubscriptionRepository`, updating session-hook selection and controller availability gates.
- Implement the full account deletion workflow before public release.
- Resolve security findings through separately reviewed and authorized targeted dependency changes.
