# SubHog — Project Overview

## Overview

SubHog is a mobile subscription tracker application built with Expo (React Native) that helps users monitor, manage, and understand their recurring subscriptions. Users sign up with Clerk authentication, manage their subscriptions with billing details, and get a clear view of their active subscriptions, upcoming renewals, and spending insights grouped by currency and frequency — all from a clean mobile UI.

## Goals

1. A signed-in user can add, view, edit, cancel tracking for, and delete subscriptions with immediate visual feedback.
2. The dashboard shows active subscription totals and upcoming renewals at a glance.
3. The insights screen breaks recurring amounts down by currency and billing frequency without mixing different currencies.
4. The frontend runs as an extracted baseline: development builds support explicit in-memory data mode, while release builds indicate when no backend is connected.
5. Session management and authentication remain fully protected and isolated through Clerk.

## User Flow

1. User opens the app and is routed to Sign In or Sign Up if not authenticated.
2. User authenticates via Clerk (email/password or social auth) and completes any required verification or MFA steps.
3. Authenticated user enters the main application tabs: Home, Subscriptions, Insights, Settings.
4. In explicit development mode, user adds subscriptions via the "Add" button and bottom-sheet modal (name, price, frequency, category, payment method). New records use ZAR; edits preserve the existing currency. Currency grouping supports USD, GBP, and ZAR; the preserved form has no currency picker.
5. Subscriptions appear on Home and Subscriptions tabs.
6. User can navigate to the full detail view `/subscriptions/[id]` to edit fields, cancel tracking, or delete the subscription.
7. User navigates to Insights to view recurring totals grouped by currency and frequency.
8. User navigates to Settings to manage sessions, sign out, or view account security status. Account deletion is disabled in every build of this frontend baseline pending backend implementation.

## Data Baseline and Safety

- No user data was migrated or deleted during the extraction of this application.
- Development data is purely in-memory: it resets upon reload, sign-out, or user switch.
- Production/release builds show a "Backend not connected" state until the replacement backend adapter is introduced.
