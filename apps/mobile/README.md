# SubHog Mobile Application

Expo mobile application for SubHog subscription tracking.

## Getting Started

1. Install dependencies from the repository root:

   ```bash
   npm install
   ```

2. Configure environment variables in `apps/mobile/.env` (or copy from `.env.example`):

   ```env
   # Required for Clerk authentication
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

   # Optional: Set to 'development' during local dev (__DEV__) to enable in-memory subscription data
   EXPO_PUBLIC_DATA_MODE=development

   # Optional: PostHog analytics (suppressed when EXPO_PUBLIC_DATA_MODE=development)
   EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN=
   EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   ```

3. Run the development server:

   ```bash
   npm run start --workspace=@subhog/mobile
   ```

## Development Data Mode

When `__DEV__ === true` and `EXPO_PUBLIC_DATA_MODE=development`:
- An in-memory repository is used for subscription create, read, update, cancel tracking, and delete.
- Changes are held in memory and reset upon reload, user switch, or sign-out.
- No development data banner is displayed; the in-memory lifetime remains unchanged.
- Analytics events are suppressed to prevent test data pollution.

When development data mode is disabled or in release builds:
- The app displays `"Backend not connected"` for subscription screens.
- Settings and authentication remain fully functional.

## Running Checks

```bash
# Typecheck
npm run typecheck --workspace=@subhog/mobile

# Lint
npm run lint --workspace=@subhog/mobile

# Unit tests
npm run test --workspace=@subhog/mobile

# Web export build
npm run build --workspace=@subhog/mobile
```
