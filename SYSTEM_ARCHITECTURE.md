# KAGUM ONE — current system architecture

Master product rules remain in `PROMPT_SYSTEM.md`. This file describes the **implemented** system as of 25 September 2026.

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

## Information architecture

```text
AUTHENTICATION
  /login  /forgot-password  /reset-password  /activate

WORKSPACE
  /dashboard
  /projects  /projects/:id
  /tasks  /tasks/:id
  /my-tasks  /kanban  /calendar
  /content  /content/:id  /content/:id/qc
  /publishing
  /notices
  /equipment  /equipment/:id
  /files

PERFORMANCE
  /kpi  /reports  /time-tracking  /workload

PEOPLE
  /team  /team/:id
  /skills  /skills/:id

MANAGEMENT
  /approvals  /activity  /handover  /admin

SYSTEM
  /notifications  /ai  /profile  /settings  /knowledge
```

Mobile shell uses Home, Tasks, Calendar, Alerts, More. Navigation visibility may hide items; the server still decides writes.

## Authorization

Runtime authority is `role_permissions` in the database. `SEED_ROLE_PERMISSIONS` in `lib/permissions.ts` is seed/sync only (`scripts/sync-permissions.ts`).

Added capability keys (beyond the original catalog):

| Permission | Purpose |
| --- | --- |
| `knowledge:manage` | Publish/edit SOPs in Knowledge Base |
| `announcement:create` | Post team notices (not SOPs, not approvals) |

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

Public signup does not exist. Accounts are invited.

## Domain modules

```text
Auth / people / roles
  → Projects
  → Tasks (lifecycle, acknowledgement, completion, extensions)
  → Calendar / planned work
  → Content (plan → QC → publish)
  → Notices (carousel on dashboard)
  → Equipment loans
  → Knowledge (published SOP)
  → Skills (inferred evidence)
  → KPI (targets set by authorized roles)
  → Approvals / activity / handover
  → Files / reports / time / workload
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

### Skills

The skill directory is not a separate invented catalog. Names come from existing task categories and content workflow stages. Evidence is attached from completed/submitted tasks (including completion write-ups), collaborators on those tasks, and content/QC actions. Inferred level 1–5 is observed work-record count, **not** a KPI and **not** verified.

### KPI

Staff/intern cannot create or edit targets. Executive/management set targets (including executive own KPI). Changes write history and notify the person.

## Data

Primary database: `file:./data/kagum.db` in development, Turso in production.

Schema lives in `lib/db/schema.ts`. Live databases also run `scripts/ensure-schema.ts` (columns/tables that migrations missed) and `scripts/sync-permissions.ts`.

Conceptual tables that exist in this codebase include people/roles, projects/phases/members, tasks and completion/collaborator/deliverable records, planned work, contents and QC/publication, equipment and loans, skill categories/skills/person_skills/skill_evidence, KPI periods/targets/history, announcements, knowledge articles, approvals, handovers, files, notifications, activity and audit logs, AI threads.

Do not add tables that duplicate an existing write path.

## Shared services

| Area | Location |
| --- | --- |
| Permissions catalog | `lib/permissions.ts` |
| Auth context | `lib/auth/context.ts` |
| Mutations | `lib/actions/core.ts` |
| Reads | `lib/queries.ts` |
| Activity / audit / notify | `lib/services/records.ts` |
| Skill inference | `lib/services/skills.ts` |
| Org rules | `lib/services/org.ts` |

## Operations

- Invite-only Better Auth; trusted origins include local 3000/3001.
- Display timezone Asia/Kuala_Lumpur; store timestamps in UTC.
- Demo personas are labeled `isDemo` and must not be treated as real people.
- Cron reminders: `app/api/cron/reminders`.
- CSV export: `app/api/export/[resource]`.
