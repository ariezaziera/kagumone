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
| 2026-09-30 | Session | Idle people stayed signed in | Remember me off: 30-minute sliding idle, session cookie. Remember me on: 8-hour sliding idle and a 14-day cap from session creation | One Better Auth cookie and database session. No second store |
| 2026-09-30 | Departments | Free-form org units | Management, Marketing Technologist (MarTech), and Admin are the working set | Do not auto-retire a seeded Operations department |
| 2026-09-30 | Accounts | Email-only sign-in was too narrow | Email or username. `administration:manage` edits a profile. `team:delete` deactivates or deletes | Delete hides the person and keeps the name on history |
| 2026-09-30 | Chats | Team members had no shared thread | Team room, private chats, and groups. Files, links, pin, star, delete message, and chat notifications | Any non-deleted signed-in person can read. Sending requires an active person |
| 2026-09-30 | Time tracking page | A separate time page was removed | No `/time-tracking` route. Calendar holds planned work. Workload must not invent minutes from task status | `time_entries` may still hold old rows |
| 2026-09-30 | Notification bell | The inbox page did not surface new items | Red dot on the bell, a short panel, Read all, clear, and See more into `/notifications` | Opening a notice sets `readAt` and `handledAt` |
| 2026-09-30 | Audit follow-up | The 30 September review listed gaps in writes, files, QC, and navigation | Idempotent chat migration, chat files kept out of the library, QC stage permissions, notification preferences, workload without invented minutes, shared read/clear actions, More on the phone bar | Personal chat pin and star are audit traces. Message text is not copied into activity |
