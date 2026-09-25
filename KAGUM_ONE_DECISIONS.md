# Decisions

| Date | Decision | Context | Direction | Reason |
| --- | --- | --- | --- | --- |
| 2026-09-25 | Timezone | Display consistency | Store UTC, display Asia/Kuala_Lumpur | Organization is Malaysia-based |
| 2026-09-25 | Auth passwords | Avoid dual authority | Better Auth `account.password` only | Spec forbids app-level passwordHash |
| 2026-09-25 | Signup | Internal system | Invite-only | Spec forbids public signup |
| 2026-09-25 | Role matrix | No matrix in spec | Seeded, editable in DB | Assumption, not a frozen business rule |
| 2026-09-25 | Email / files / AI | Keys may be absent | Adapters with console/local/retrieval fallbacks | Dual-mode chosen during planning |
| 2026-09-25 | Export format | Reporting | CSV first | Only implement formats with a real requirement |
| 2026-09-25 | Project create permission | No project:* catalog | Uses `task:create` until a dedicated permission is defined | Assumption |
| 2026-09-25 | SOP / approvals | Staff vs exec | `knowledge:manage` and `task:approve_extension` for executive/management; staff/intern read published SOP and approval status | Product request |
| 2026-09-25 | Notices | Staff need team posts without SOP authority | `announcement:create` + dashboard carousel | Product request; not an approval |
| 2026-09-25 | Task assign | Staff/intern self-work | `task:create` self-only; `task:assign` required to assign others | Product request |
| 2026-09-25 | Equipment register | Inventory control | `equipment:register` executive/management only | Product request |
| 2026-09-25 | KPI / invite | Staff cannot self-set KPI or create users | `kpi:edit`/`kpi:create` and `user:invite` withheld from staff/intern | Matches §32 and invite-only auth |
| 2026-09-25 | Skills | Unknown extra catalog | Infer from existing task categories and content stages + completion write-ups | Do not invent a skill list or treat inferred level as KPI |
