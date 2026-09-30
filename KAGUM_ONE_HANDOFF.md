# KAGUM ONE handoff

Current architecture: `SYSTEM_ARCHITECTURE.md`. Product rules: `PROMPT_SYSTEM.md`. Decisions: `KAGUM_ONE_DECISIONS.md`. Next work: `NEXT_STEP.md`.

## What exists

- Modular monolith: Next.js App Router, Drizzle/libSQL (local file or Turso), Better Auth (invite-only)
- Sign-in by email or username. Remember me off ends the session after 30 idle minutes. Remember me on uses an 8-hour idle limit and a 14-day cap.
- Organization, departments, projects, tasks (lifecycle, acknowledgement, completion, extensions), content QC/publishing
- Notices carousel, equipment loans, KPI (authorized setters only), inferred skills from completed work
- Knowledge SOPs (`knowledge:manage`), approvals (decide vs status), team invite (`user:invite`)
- Chats: one team room, private chats, and groups, with files, links, pins, stars, and chat notifications
- Notification bell with a red dot, a short list, Read all, clear, and a full Notifications page
- CSV export, file adapter, reminder cron, retrieval AI assistant
- Demo seed labeled `isDemo`. Real accounts do not see demo people as direct-chat partners.

## Run

`npm run db:setup` on an empty database, or `npm run db:ensure` when the database already exists. Then `npm run dev`. If `.env` sets `TURSO_DATABASE_URL`, that is the database, including on this machine.

## Not production-ready until

- Real Turso credentials and `BETTER_AUTH_SECRET` on the deployment you intend to ship
- Resend/Blob keys if you need live email and object storage
- Review of the assumed role-permission seed matrix in Administration
