# SubHog Mobile Context

This directory contains application-specific development documentation, not source providers or generic example projects.

Read in the order specified by `AGENTS.md`:
1. `project-overview.md`: product and baseline scope.
2. `architecture.md`: frontend-owned model/repository, session lifecycle, and analytics boundaries.
3. `ui-context.md`: preserved visual design and component conventions.
4. `code-standards.md`: implementation and validation rules.
5. `ai-workflow-rules.md`: incremental workflow and safety.
6. `progress-tracker.md`: current implementation and verification status.

Providers live in `../src/providers`; routes live in `../app`.
This is a subscription-tracking app using Clerk, not a language-learning example.
There is no onboarding, legacy subscription API, or subscription persistence.
The future backend will implement `SubscriptionRepository` and independently enforce authentication/ownership.

See the repository root `docs/extraction-checklist.md` and `docs/verification-report.md` for evidence and verification limitations. No existing user data was migrated or deleted.
