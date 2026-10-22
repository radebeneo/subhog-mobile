# Extraction Verification Report

Date: 2026-10-22  
Destination: `C:\Users\NeoRadebe\Downloads\subhog-next`  
Source: `C:\Users\NeoRadebe\Downloads\SubHog`  
Source commit: `20729d10a667658b1458926366fc2af749569501`

## Acceptance Status

**Remediation implemented; full extraction acceptance remains blocked.**

Lint, application/test typechecks, 62 regression tests, Expo Doctor, public configuration resolution, and web static export pass using the existing installed dependencies. A completed clean installation and authenticated browser/native runtime verification have not been established. These results do not justify “executed completely” or production readiness.

The requested local delivery commit is deferred until the acceptance checks are satisfied. No destination commit, remote creation, push, deployment, backend implementation, or broad dependency-security fix was performed during this remediation.

## Verification Results

| Check | Status | Evidence and limits |
| --- | --- | --- |
| `npm run typecheck` | PASS | Both application `tsc --noEmit` and `tsc --noEmit -p tsconfig.test.json` pass, including the resumed run with restored npm. NativeWind, global app, and asset declarations are included. |
| `npm run lint` | EARLIER PASS; RERUN TIMED OUT | Earlier root workspace command completed after remediation. Resumed combined verification timed out during Expo lint; no completed result for that attempt. |
| `npm run test` | PASS | Resumed standalone run exits 0: 62 tests; 62 pass; 0 failures, cancelled, skipped, or todo. Latest captured duration: 9363.9458 ms. |
| `npm exec --yes -- expo-doctor` from `apps/mobile` | PASS | 21/21 checks; no issues detected after removing obsolete SDK 57 config flags. |
| `expo config --type public --json` | PASS | Public configuration resolves. Values were not printed or included in this report. |
| `npm run build` | PASS | `expo export --platform web` exports to ignored `apps/mobile/dist`; 28 generated static route variants. |
| Original assets | PASS | All 46 source and destination assets are byte-identical; no missing or additional assets. |
| Route preservation | PASS | All 15 `.tsx` route/layout file paths match the source. The 28 export variants are not 28 source screens. |
| Legacy executable coupling search | PASS | No legacy subscription packages, identity/provisioning calls, or subscription API client remain in application code. See the Iconify exception below. |
| Source working tree | PASS | Read-only Git inspection shows a clean source tree at the recorded commit. |
| Destination isolation | PASS | Only `apps/mobile` is a workspace. `.env` and generated `dist` are ignored; no remote is configured. |
| Fresh `npm ci` | BLOCKED / UNVERIFIED | Initial attempts timed out at 300 and 600 seconds. On resumed verification, a fresh-copy bounded-network attempt timed out at 360 seconds and an offline attempt at 180 seconds. No successful completion result. |
| Authenticated web runtime | BLOCKED | Browser access returned intermittently on resume. Panel display reported connection closed; navigation to local Expo timed out with uncertain dispatch; subsequent state reads reported another operation running. Server logs confirm web bundling/application startup, not authenticated acceptance. No alternate browser or auth bypass used. |
| Review panel | BLOCKED | `desktop_set_panel` with `view: review` timed out. This does not affect code checks but means native review-panel presentation was not established. |
| Android runtime/build | BLOCKED | `adb` is not available on PATH and Android SDK environment variables are not configured. No emulator/device execution was established. |
| iOS runtime/build | NOT RUN — PLATFORM LIMIT | Windows cannot perform local iOS simulator/Xcode verification. |
| Real Clerk sign-in/session recovery | NOT VERIFIED | Mocked wiring tests and static export do not authenticate a real user or validate the configured key against Clerk. |
| Live subscription/analytics network behavior | NOT VERIFIED | No authenticated runtime trace was obtained. Tests demonstrate local repository behavior and mocked analytics suppression, not observed live traffic. |
| Pixel-level UI/runtime parity | NOT VERIFIED | Asset and route preservation and layout wiring are verified; no device/browser screenshot comparison was performed. |
| `npm audit` security acceptance | FAIL / OPEN FINDINGS | Saved audit reports 43 vulnerable dependency entries: 15 moderate, 27 high, 1 critical. No automatic fixes applied. |

Earlier failing lint/typecheck/Doctor results were resolved and superseded by the passing results above. Installation timeouts and runtime blockers are not superseded.

## Tooling and Reproduction

Verification uses locally downloaded tools, not changes to global Node/npm:

- Node `24.11.1`
- npm `11.6.2`
- Node directory: `C:\Users\NeoRadebe\AppData\Local\Temp\opencode\subhog-verification-tools\node-v24.11.1-win-x64`
- Original npm CLI used for passing checks: `C:\Users\NeoRadebe\AppData\Local\Temp\opencode\subhog-verification-tools\npm-11.6.2\package\bin\npm-cli.js`. This directory was later missing on resumed verification; cause unestablished. npm was re-extracted from the existing archive into `npm-11.6.2-restored\package\bin\npm-cli.js` under the same temporary tools directory and reported version `11.6.2`. Global tooling was not changed.

The pinned Node directory was prepended to the process-local PATH so npm child scripts also use that Node version. Root `package.json` declares Node `24.11.x`, npm `11.6.x`, and `packageManager: npm@11.6.2`; `.nvmrc` pins Node.

With the matching tooling selected, run from the repository root:

```sh
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
```

Run Expo Doctor from `apps/mobile`:

```sh
npm exec --yes -- expo-doctor
```

A valid locally supplied Clerk publishable key is required for export. The successful export used existing ignored local configuration, with `EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN` and `EXPO_PUBLIC_POSTHOG_HOST` set to empty strings through process-local overrides to disable analytics. Do not interpret `npm run build` as an Android/iOS release build or an authenticated smoke test.

### Captured Local Evidence

The approved temporary tools directory contains:

- `test.log`: complete captured passing test run.
- `build.log`: successful web export output.
- `audit.json`: dependency audit findings.
- `expo-public-config.json`: resolved public configuration; excluded from delivery because it may contain project-specific public configuration.

These files are outside the repository. They may not be portable or retained indefinitely. Command outcomes are recorded here without embedding configuration values or credentials.

### Fresh Installation Limitation

The isolated verification copy is:

`C:\Users\NeoRadebe\AppData\Local\Temp\opencode\subhog-verification-tools\clean-install-99cf1907705d46fca7387b0229c15d27`

It excludes `.git`, existing `node_modules`, generated output/cache directories, `.env`, `.env.local`, and logs. It was copied before the last test-declaration correction; update the corresponding source/test files before using it for follow-up checks.

npm diagnostic tails show registry/cache operations taking roughly 18–24 seconds each, but do not establish the root cause of the timeouts. Neither a timeout nor a partial `node_modules` directory proves a valid installation. Do not copy that partial installation over the working workspace. A successful lockfile-driven installation followed by the verification commands remains required.

### Resumed Verification — User Authorized Proceed

- Created a new isolated copy at `C:\Users\NeoRadebe\AppData\Local\Temp\opencode\subhog-verification-tools\clean-install-resume-20261022`, excluding existing dependencies, generated caches/output, Git, and local environment files.
- Attempted pinned `npm ci --no-audit --no-fund --prefer-offline --maxsockets=8 --fetch-retries=1 --fetch-timeout=60000`; timed out at 360 seconds. `ci-resume.log` contains no completed installation result.
- Attempted pinned `npm ci --offline --no-audit --no-fund` using restored npm; timed out at 180 seconds. `ci-offline-resume.log` contains no completed installation result.
- Inspection found 890 of 1055 non-link destination package entries lack both `resolved` and `integrity`. The source lockfile also has missing metadata (1030 of 1181 entries). This is inherited/incomplete metadata, not proof of a malicious lockfile. The observed npm config `omit-lockfile-registry-resolved` is false.
- Before the offline attempt, destination and resumed-copy lockfile SHA-256 matched: `f5b04e8ded5d6a01f20a2d4c3471fd3ad2b63b67ae4cf6552309624c1ccad0aa`.
- An exact-version, offline cached-manifest probe timed out at 60 seconds. Metadata reconstruction was not applied; no versions, dependency graph, or global npm configuration were changed.
- Started Expo web at `http://localhost:8083` from the existing installation with process-local analytics disabled and CI mode (watch reload disabled). Server output confirms SSR/web bundling and application startup, plus Clerk's development-key warning. It does not prove successful sign-in, CRUD, screenshot parity, or endpoint-specific network behavior.
- CM Browser initially listed an accessible blank tab, but panel display failed with connection closed. Navigation returned an uncertain-dispatch timeout and subsequent reads reported another operation running. No additional input, alternate browser, screenshot, or credential entry was used while observation was unavailable.

### Follow-up Results After Restoring npm

- Reconfirmed both destination and resumed-copy lockfile SHA-256 remain `f5b04e8ded5d6a01f20a2d4c3471fd3ad2b63b67ae4cf6552309624c1ccad0aa`, including after the offline attempt. No lockfile metadata reconstruction or dependency changes were applied.
- Reconfirmed the original repository is clean at `20729d10a667658b1458926366fc2af749569501`; destination still has no remote or delivery commit.
- Existing-workspace `npm run typecheck` completed with exit 0 using restored npm and pinned Node, covering application and test TypeScript configurations.
- The combined typecheck/lint/test rerun exceeded its 180-second limit during `expo lint`, after local environment loading. It did not reach the test step. This lint rerun has no successful completion evidence; the earlier passing lint result is historical evidence, not a pass for this attempt.
- A separate existing-workspace `npm run test` completed with exit 0: 62 tests, 62 pass, 0 failures/cancelled/skipped/todo; duration 9363.9458 ms. Expected renderer deprecation and Node module-type warnings remain.
- Browser state reads eventually reported `http://localhost:8083/sign-in`, but no visible text or interactive elements. A new browser-panel presentation attempt timed out, and the screenshot call returned `Tool result missing`; no image was received or inspected. Neither the URL nor a missing capture proves a rendered sign-in screen or successful authentication.
- No credentials were entered, authentication bypassed, framework upgrades made, or external services mutated. No further identical stalled install/browser actions were attempted.

The passing checks remain evidence for the existing installed workspace, not the incomplete temporary installation. Resume requires stable local tool execution, a visible usable CM Browser connection, and a completed installation rather than repeated identical timed-out calls.

## Remediation and Regression Coverage

### Controller and Lifecycle

- Duplicate attempts return an error without replacing the original pending action or releasing its lock.
- Pending action dismissal and list retry cannot allow overlapping mutations.
- Disposal clears subscription/action state, resets transient records, invalidates pending work, and cannot be reversed.
- Stale success/rejection results cannot populate a newer session.
- Overlapping list retries accept only the newest list result.
- `useSubscriptionSession` creates a fresh controller on every effect setup, including Strict Mode replay; cleanup permanently disposes it.
- Mismatched auth/mode scopes hide old records synchronously before effect cleanup/setup.
- Session-store notifications use `useSyncExternalStore`; the hook does not synchronously call React `setState` in its effect.

### Form and Repository

- Unrelated edits omit `startDate` and `renewalDate`, preserving original start strings and null/absent renewal dates.
- An intentional frequency change recalculates renewal using the existing start date.
- The form synchronously locks repeated presses, handles rejected submissions, and ignores UI updates after unmount.
- Model/repository validation rejects invalid or empty dates and nonpositive edit prices with typed failures.
- Repository reads/writes are defensively copied so consumers cannot mutate stored records accidentally.
- Presentation currencies are narrowed against frontend-owned currency choices before constructing a typed input.

### Actual React Wiring

Tests execute the real provider, modal, Settings screen, authenticated layout, and PostHog adapter with test-only native/Clerk boundaries:

- Strict Mode replay and empty state across same-user session replacement, account switch, and sign-out.
- Retained callbacks cannot mutate disposed controllers.
- Actual provider refuses development data when `__DEV__` is false even with the development environment flag.
- Accessible development label sits above the authenticated Stack, covering tabs and detail routes structurally.
- Actual Settings account deletion stays disabled and sign-out calls the Clerk boundary.
- Actual analytics adapter does not initialize/send through its mocked client in development data mode.

`test-support/register.mjs` resolves aliases/assets and transpiles TSX only for Node tests. Application code and Metro do not import it. The tests emit React test renderer deprecation and Node module-type warnings; those warnings are not test failures. Production module configuration was not changed solely to suppress test warnings.

Mocks do not prove real Clerk flows, native rendering, browser hydration, complete session-management UI behavior, or absence of live network traffic.

## Dependency Changes and SDK Configuration

The user approved direct patches `expo@57.0.31` and `expo-router@57.0.29`, plus development dependencies `react-test-renderer@19.2.3` and `@types/react-test-renderer@19.1.0`.

React `19.2.3`, React Native `0.86.3`, and NativeWind `5.0.0-preview.4` remain unchanged. There was no SDK-family, React, React Native, or NativeWind upgrade.

The lockfile install also refreshed transitive dependencies. Comparable source/destination package-path version differences are listed below; this is not a claim that every lockfile entry is identical:

| Package / lockfile location | Source | Destination |
| --- | --- | --- |
| `@expo/config-plugins` | 57.0.10 | 57.0.11 |
| `@expo/ui` | 57.0.25 | 57.0.26 |
| `@radix-ui/primitive` | 1.1.7 | 1.2.0 |
| `@radix-ui/react-context` | 1.2.2 | 1.3.0 |
| `@radix-ui/react-direction` | 1.1.4 | 1.2.0 |
| `@radix-ui/react-slot` | 1.3.3 | 1.5.0 |
| `@radix-ui/react-use-callback-ref` | 1.1.4 | 1.1.5 |
| `@radix-ui/react-use-controllable-state` | 1.2.6 | 1.3.0 |
| `expo` | 57.0.30 | 57.0.31 |
| `expo-modules-core` | 57.0.23 | 57.0.24 |
| `expo-modules-jsi` | 57.1.2 | 57.1.3 |
| `expo-router` | 57.0.28 | 57.0.29 |
| `expo-router/node_modules/@radix-ui/react-collection` | 1.1.15 | 1.2.0 |
| `expo-router/node_modules/@radix-ui/react-presence` | 1.1.10 | 1.1.11 |
| `expo-router/node_modules/@radix-ui/react-primitive` | 2.1.10 | 2.2.0 |
| `expo-router/node_modules/@radix-ui/react-roving-focus` | 1.1.19 | 1.2.1 |
| `expo-router/node_modules/@radix-ui/react-tabs` | 1.1.21 | 1.2.1 |
| `expo/node_modules/@expo/cli` | 57.0.31 | 57.0.32 |
| `expo/node_modules/@expo/cli/node_modules/@expo/router-server` | 57.0.13 | 57.0.14 |
| `react-native-drawer-layout` | 4.2.10 | 4.2.12 |
| `xcode` | 3.0.1 | 4.0.0 |

The transitive `xcode` major-version change is explicitly disclosed; no separate direct `xcode` upgrade was requested or performed.

SDK 57 documentation/schema validation required removing obsolete `newArchEnabled` and `android.edgeToEdgeEnabled` fields from `app.json`. This is configuration compatibility remediation, not an opt-out from required architecture/edge-to-edge behavior.

Reference: https://docs.expo.dev/versions/v57.0.0/config/app/

## Security Findings

The saved npm audit reports **43 vulnerable dependency entries**, not necessarily 43 unique advisories or exploitable runtime paths.

The critical entry is transitive `shell-quote@1.10.0`:

- Advisory: https://github.com/advisories/GHSA-pqg4-j6r4-53mv
- Reported issue: `quote()` command injection through a line terminator in a token following a comment token.
- Advisory affected range: `>=1.8.4 <1.11.0`.
- npm reports a fix available for this entry; no override or broad `npm audit fix` was applied.
- Actual reachability/exploitability in this app and its build tooling has not been established.

Some suggested resolutions require major changes or downgrades; direct Clerk/Expo-related audit paths include findings without available automatic fixes. Review the dependency paths and authorize targeted changes separately. A passing Expo Doctor or web export is not security clearance.

## Network and Safety Boundaries

Subscription data access remains behind `SubscriptionRepository`. Development records are transient and session-isolated; no AsyncStorage/disk persistence or legacy API is used for them. Release builds refuse development data mode.

The retained `subscription-icons.ts` helper fetches public Iconify search/icon resources using the subscription name. This is an external icon lookup, not a legacy subscription-data API. Clerk and optional analytics also remain external integrations. Therefore “legacy subscription coupling removed” must not be read as “the application never makes network requests.” Live runtime/network verification is still open.

Read-only source inspections confirm the original tree remains clean. This remediation did not invoke legacy service mutations or copy private credentials. Ignored user-provided public configuration stays local and was not displayed. Earlier external-service activity cannot be independently reconstructed from destination files; this report does not certify all historical service activity.

## Requirements to Unblock Delivery

1. Complete `npm ci` with pinned tooling in a clean destination copy and rerun checks against the resulting dependencies.
2. Restore an available, visible CM Browser connection; perform real Clerk authentication through user-controlled credential entry.
3. Smoke-test authenticated Home, Subscriptions, Insights, Settings, and detail navigation; create/edit/cancel/delete transient tracking records; verify duplicate/error handling, null dates, reload/sign-out/session resets, and the release/no-backend state.
4. Obtain suitable runtime/network evidence for no legacy subscription requests and analytics suppression, without exposing credentials or contaminating live analytics. Aggregate network counts alone cannot prove endpoint-specific behavior.
5. Configure an Android SDK/device or emulator and obtain iOS-capable tooling for applicable native checks.
6. Review security findings and dependency changes before production release; implement no backend or broad upgrades under this extraction task.
7. Review the final diff and create the requested local delivery commit only when the acceptance gate is satisfied. Do not push.

The backend, production identity/account deletion workflow, and production release configuration remain future work, not part of this extraction remediation.
