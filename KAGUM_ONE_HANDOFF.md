# KAGUM ONE handoff

Current architecture: `SYSTEM_ARCHITECTURE.md`. Product rules: `PROMPT_SYSTEM.md`. Decisions: `KAGUM_ONE_DECISIONS.md`.

## What exists

- Modular monolith: Next.js App Router, Drizzle/libSQL, Better Auth (invite-only)
- Organization, projects, tasks (lifecycle, acknowledgement, completion, extensions), content QC/publishing
- Notices carousel, equipment loans, KPI (authorized setters only), inferred skills from completed work
- Knowledge SOPs (`knowledge:manage`), approvals (decide vs status), team invite (`user:invite`)
- CSV export, file adapter, reminder cron, retrieval AI assistant
- Demo seed labeled `isDemo`

## Run

`npm run db:setup` then `npm run dev`. Existing databases: `npm run db:ensure` (schema patches + permission sync). Login with a demo persona or an invited account.

## Not production-ready until

- Real Turso credentials and `BETTER_AUTH_SECRET`
- Resend/Blob keys if you need live email and object storage
- Review of the assumed role-permission seed matrix in Administration
