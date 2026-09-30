# KAGUM ONE — current system architecture

Master product rules remain in `PROMPT_SYSTEM.md`. This file describes the **implemented** system as of 30 September 2026.

## Shape

```text
One repository
One Next.js App Router application
One SQLite database (local file or Turso)
One Vercel deployment
Modular monolith
```

Stack: Next.js 15, TypeScript, Tailwind, Drizzle ORM, libSQL/Turso, Better Auth, Zod. Email, object storage, and Groq are adapters with local fallbacks.

Do not add microservices, Redis, brokers, or a separate API service unless a demonstrated requirement exists.

## Request path

Every consequential write follows:

```text
Session (Better Auth)
  → Person + roles + permissions (database)
  → Permission check (capability key, never role name)
  → Zod validation
  → Business rule
  → Mutation
  → recordActivity / recordAudit / notify
```

UI hiding is not authorization. Server actions in `lib/actions` enforce permissions.

Identity (`user` / session) is separate from organization (`people`).

Chat and notification writes live in `lib/actions/chats.ts` and `lib/actions/notifications.ts`. They check the session, validate ids with Zod, apply the business rule, then write activity or audit where the change is shared or destructive. A personal chat pin or star is an audit trace. A sent message and a pinned message are activity lines, without the message text.

## Information architecture

```text
AUTHENTICATION
  /login  /forgot-password  /reset-password  /activate  /first-password

WORKSPACE
  /dashboard
  /tasks  /tasks/:id  /my-tasks  /kanban  /calendar
  /projects  /projects/:id
  /content  /content/:id  /content/:id/qc
  /publishing  /files
  /notices  /chats  /equipment  /equipment/:id

PERFORMANCE
  /kpi  /reports  /workload

PEOPLE
  /team  /team/:id
  /skills  /skills/:id

MANAGEMENT
  /approvals  /activity  /handover  /admin

ACCOUNT
  /notifications  /ai  /profile  /settings  /knowledge

OTHER
  /more
```

There is no `/time-tracking` page. Planned work is recorded on the calendar. `time_entries` still exists and is what Workload reads for planned and actual minutes. The app no longer inserts those rows.

Sidebar groups in `lib/nav.ts`:

```text
Home          Dashboard
Task          All Tasks, My Tasks, Kanban, Calendar
Project       Projects, Content, Publishing, Files
Workplace     Notices, Chats, Equipment
Performance   KPI, Reports, Workload
People        Team, Skills
Management    Approvals, Activity / History, Handover, Administration
Account       Notifications, AI Assistant, My Profile, Settings, Knowledge Base
```

Nav items with a capability check: KPI (`kpi:view`), Reports and Workload (`reports:view`), Team (`team:view`), Administration (`administration:manage`). Chats and Skills stay available to every signed-in person. Approvals shows every record to someone who can decide extensions, and only that person’s own requests otherwise. Activity is the readable story for every signed-in person. The audit trace on that page requires `administration:manage`.

Phone bar: Dashboard, Tasks (`/my-tasks`), Calendar, Chats, Notifications. The menu button opens the full sidebar. `/more` still lists those groups and is not on the bar.

A red count appears when something is waiting. My Tasks counts assigned work that is pending acknowledgement or past the official deadline. Calendar counts assigned work whose deadline is today in Asia/Kuala_Lumpur. Chats counts unread messages. Notifications counts unread notices. Approvals counts pending decisions for someone who can decide them. Equipment counts this person’s overdue loans. A collapsed sidebar group shows the total of its items. The menu button shows that total for items that are not already on the phone bar.

The header **New** menu shows only actions the person may perform: Create Task, New Project, Add Content, Post Notice, Borrow Equipment.

## Session

One Better Auth cookie and one database session. No second session store. No `localStorage`.

| Remember me | Idle limit | Cookie | Absolute cap |
| --- | --- | --- | --- |
| Off | 30 minutes, sliding on each request | Session cookie (gone when the browser closes) | — |
| On | 8 hours, sliding; refresh checked about every 5 minutes | Persistent | 14 days from `session.createdAt` |

Cookie is httpOnly, SameSite=Lax, and Secure on https. Password reset, sign-out, and account deletion end the session immediately. An expired session sends the next visit to `/login?ended=1`. Middleware only sees whether the cookie is present. The expiry check is in `getAuthContext`.

## Authorization

Runtime authority is `role_permissions` in the database. `SEED_ROLE_PERMISSIONS` in `lib/permissions.ts` is seed/sync only (`scripts/sync-permissions.ts`).

Added capability keys (beyond the original catalog):

| Permission | Purpose |
| --- | --- |
| `knowledge:manage` | Publish/edit SOPs in Knowledge Base |
| `announcement:create` | Post team notices (not SOPs, not approvals) |
| `administration:manage` | Edit departments, role labels, settings, invitations, and another person’s profile |
| `team:delete` | Deactivate or delete an account |

Seeded operating rules currently in use (reviewable in Administration; not frozen law):

| Action | Staff / intern | Executive / management |
| --- | --- | --- |
| Create task for self | yes (`task:create`) | yes |
| Assign task to others | no (needs `task:assign`) | yes |
| Register equipment | no | yes (`equipment:register`) |
| Publish SOP | no | yes (`knowledge:manage`) |
| Decide approvals | view status only | yes (`task:approve_extension` and related content perms) |
| Set KPI targets | view own (`kpi:view`) | yes (`kpi:edit` / `kpi:create`) |
| Invite users | no | yes (`user:invite`) |
| Post event / participation notice | yes (`announcement:create`) | yes |

Public signup does not exist. Accounts are invited. Sign-in accepts email or username (`^[A-Za-z0-9_.]+$`, 3–30 characters). Pending invitation emails of the form `{uuid}@pending.kagum.local` are hidden from the sign-in display.

Deleting a person sets `organizationalStatus` to `deleted`, removes the login, and hides them from the directory. The name stays on historical records. Deactivate is separate from delete.

Departments in use: Management (`MGMT`), Marketing Technologist / MarTech (`MARTECH`), Admin (`ADMIN`). A seeded Operations (`OPS`) department may still be active. Do not retire it automatically.

## Domain modules

```text
Auth / people / roles / departments
  → Projects
  → Tasks (lifecycle, acknowledgement, completion, extensions)
  → Calendar / planned work
  → Content (plan → QC → publish)
  → Notices (carousel on dashboard)
  → Chats (team room, private, groups)
  → Equipment loans
  → Knowledge (published SOP)
  → Skills (inferred evidence)
  → KPI (targets set by authorized roles)
  → Approvals / activity / handover
  → Files / reports / workload
  → Notifications
  → AI retrieval assistant
```

### Tasks

Official deadline, planned work, and actual completion timestamps are separate facts. Submitting a completion record is not automatic approval to `completed`. Staff/intern create tasks assigned to themselves; assigning others requires `task:assign`.

### Notices vs SOP vs approval

| Record | Who writes | Who reads |
| --- | --- | --- |
| Knowledge article (SOP) | `knowledge:manage` | everyone (published) |
| Approval decision | extension/content approve perms | everyone can see status |
| Notice / event / participation | `announcement:create` | dashboard carousel + `/notices` |

### Chats

Any signed-in person who is not deleted can open Chats. Sending requires `organizationalStatus` `active`.

| Kind | Who sees it | Close |
| --- | --- | --- |
| Team | One shared room (`pairKey` `team`) | Cannot be deleted |
| Direct | The two people | Delete hides it for the person who deletes it |
| Group | Members who have not left. The open chat lists each member by name. The creator can add a teammate from that list. | Creator deletes it for everyone; others leave |

Links in a message become anchors. A file up to 8 MB can be attached. Pin chat is per person. One message can be pinned in a conversation. Stars are personal (`/chats?view=starred`). Deleting a message is a soft delete for everyone and shows “Message deleted”.

A new message notifies the other active people in that conversation (`kind` `chat`, link `/chats?c={id}`), unless that person has turned Chats off in Settings. The team room uses the same kind, so one setting covers team, private, and group messages.

### Notifications

Rows live in `notifications`. The header bell shows a red dot when `readAt` is empty. Opening the bell lists the latest items, with **Read all**, a confirm-then-clear action, and **See more** to `/notifications`. The Notifications page has the same Read all and Clear all actions. Opening an item sets `readAt` and `handledAt`.

Settings stores a row in `notification_preferences` when a person turns a kind off. No row means that kind is on. Password reset is always sent.

### Skills

The skill directory is not a separate invented catalog. Names come from existing task categories and content workflow stages. Evidence is attached from completed/submitted tasks (including completion write-ups), collaborators on those tasks, and content/QC actions. Inferred level 1–5 is observed work-record count, **not** a KPI and **not** verified.

### KPI

Staff/intern cannot create or edit targets. Executive/management set targets (including executive own KPI). Changes write history and notify the person.

## Data

`TURSO_DATABASE_URL` selects the database. When it is unset, the app uses `file:./data/kagum.db`. The current `.env` points at Turso, including local `next dev`.

Schema lives in `lib/db/schema.ts`. `npm run db:migrate` runs Drizzle migrations, then `scripts/ensure-schema.ts`, then `scripts/sync-permissions.ts`. `npm run db:ensure` runs the last two only.

`ensure-schema.ts` is idempotent and adds the chat group columns when they are missing. `0005_chat_groups.sql` only creates `chat_stars` with `IF NOT EXISTS`. This SQLite build rejects `ADD COLUMN IF NOT EXISTS`, so the migration does not repeat those column adds.

Conceptual tables include people/roles/departments, projects/phases/members, tasks and completion/collaborator/deliverable records, planned work, contents and QC/publication, equipment and loans, skill categories/skills/person_skills/skill_evidence, KPI periods/targets/history, announcements, knowledge articles, approvals, handovers, files, chat conversations/participants/messages/stars, notifications, activity and audit logs, AI threads.

Do not add tables that duplicate an existing write path.

## Shared services

| Area | Location |
| --- | --- |
| Permissions catalog | `lib/permissions.ts` |
| Auth context | `lib/auth/context.ts` |
| Session limits | `lib/auth/session-policy.ts` |
| Domain mutations | `lib/actions/core.ts` |
| Chat mutations | `lib/actions/chats.ts`, `lib/services/chats.ts` |
| Notification mutations | `lib/actions/notifications.ts` |
| Reads | `lib/queries.ts` |
| Activity / audit / notify | `lib/services/records.ts` |
| Skill inference | `lib/services/skills.ts` |
| Org rules | `lib/services/org.ts` |
| Shell and bell | `components/app-shell.tsx`, `components/notification-bell.tsx` |

## Operations

- Invite-only Better Auth; trusted origins include local 3000/3001.
- Display timezone Asia/Kuala_Lumpur; store timestamps in UTC.
- Demo personas are labeled `isDemo` and must not be treated as real people. Real accounts do not see demo people as direct-chat partners.
- Cron reminders: `app/api/cron/reminders`.
- CSV export: `app/api/export/[resource]`.
- File bytes: `lib/integrations/storage.ts`. The Files library omits chat attachments. `GET /api/files/[id]` returns a work file the signed-in person may see in that library, or a chat file only when that person can open the conversation.

## Workload

Workload lists active and overdue assigned tasks for people who can view reports. It does not show planned or actual minutes. Calendar blocks stay on the calendar.

## Known gaps

The 30 September 2026 audit items are addressed in the code above. Do not recreate a time-tracking page to fill Workload minutes.
