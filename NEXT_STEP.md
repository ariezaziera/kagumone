# Next step

The functional system is in place. See `SYSTEM_ARCHITECTURE.md`.

1. Run `npm run db:setup` (or `npm run db:ensure` on an existing DB) and `npm run dev`.
2. Sign in as staff and confirm: self-only tasks, notices carousel, no KPI edit, no invite, no SOP publish, no equipment register, inferred skills after completion.
3. Add Turso + Vercel env vars for production.
4. Replace the assumed permission matrix after management review.
5. Capture real (non-demo) people through invitations only.
