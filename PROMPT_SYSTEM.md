Below is a complete `PROMPT_SYSTEM.md` you can save directly. It is written as the **master prompt/instruction layer for Claude/Cursor/other coding agents working on KAGUM ONE**, and reconciles the existing specification with the newer wireframe inventory.

````markdown
# KAGUM ONE — PROMPT SYSTEM

> Master instruction and reasoning framework for AI agents working on the KAGUM ONE system.
>
> **Core principle:** If work happens, it should leave a record.
>
> **Core identity:** One system. One source of truth. One operational memory.

---

# 1. PURPOSE

KAGUM ONE is a centralized internal web-based operational management system for KAGUM Advance Group.

The system is intended to connect:

- People
- Organizational structure
- Reporting relationships
- Projects
- Tasks
- Content
- Calendar and planning
- Equipment
- KPI and performance
- Files and evidence
- Approvals
- Notifications
- Activity and audit history
- Handover
- Organizational knowledge
- Assistive AI

The system exists to solve an operational problem, not simply to provide a collection of dashboards.

The central objective is:

> Make operational work structured, traceable, accountable, measurable, and recoverable.

KAGUM ONE should become the organization's operational memory.

---

# 2. CORE PRODUCT PRINCIPLES

All implementation decisions must follow these principles.

## 2.1 One Source of Truth

Important operational information should have one authoritative record.

Do not create multiple independent records representing the same underlying fact unless there is a clear historical or versioning requirement.

Examples:

- A task has one authoritative status.
- A content item has one lifecycle record.
- An equipment item has one current state.
- A KPI has one authoritative target for a defined period.
- A project has one authoritative owner.
- A person's reporting relationship is stored explicitly.

---

## 2.2 If Work Happens, It Should Leave a Record

Important work should produce structured evidence.

Examples:

- Task assignment → activity record
- Task acknowledgement → timestamp
- Task completion → completion record
- Content QC → QC record
- Approval → approval record
- Equipment borrowing → loan record
- Equipment return → return/condition record
- KPI change → history record
- Reporting change → organizational history
- Project change → activity/history
- Handover → handover record

Do not rely on UI state alone for important operational events.

---

## 2.3 Human Accountability

KAGUM ONE supports people; it does not replace management.

The system may:

- summarize
- recommend
- remind
- organize
- calculate
- surface risks
- search historical information
- draft content
- suggest actions

The system must not silently make consequential organizational decisions.

Especially for AI:

> AI suggestion → Human confirmation → Authorized action → Audit record

---

## 2.4 Permission Before Convenience

Never implement:

> "This user is an Executive, therefore they can do everything."

Permissions must be explicit.

A user's ability to perform an action must be based on the authorization model.

Job title, role name, and hierarchy are not interchangeable with permissions.

---

## 2.5 Preserve Organizational Context

A record should retain enough context to answer:

- Who?
- What?
- Why?
- When?
- Where?
- For which project?
- For which task?
- Who assigned it?
- Who reviewed it?
- What changed?
- What evidence exists?
- What happened afterwards?

---

## 2.6 Do Not Digitize for the Sake of Digitizing

Every feature must have a clear operational purpose.

Before implementing a feature ask:

> What real user decision or action does this support, and what record does that action create or change?

If there is no clear answer, question whether the feature belongs in KAGUM ONE.

---

# 3. PRODUCT REASONING MODEL

Use the following reasoning chain when planning or implementing features:

```text
Desired Outcome
      ↓
Required Capability
      ↓
Workflow
      ↓
Data
      ↓
People / Roles
      ↓
Permissions
      ↓
System Features
      ↓
Implementation
      ↓
Verification
````

Do not begin with UI components and work backwards without understanding the underlying workflow.

---

# 4. PCR FRAMEWORK

KAGUM ONE follows the:

> Pain → Comfortable → Revamp

framework.

## 4.1 PAIN

Current operational work is fragmented across:

* WhatsApp
* meetings
* spreadsheets
* documents
* personal notes
* files
* verbal instructions
* follow-ups
* separate content workflows
* separate equipment records
* manual reporting

This creates difficulty with:

* traceability
* accountability
* progress monitoring
* historical retrieval
* handover
* KPI measurement
* workload visibility
* management oversight

---

## 4.2 COMFORTABLE

Do not unnecessarily replace processes that already work.

Preserve:

* existing organizational hierarchy
* existing reporting relationships
* human review
* existing content responsibilities
* existing management decisions
* existing communication habits where practical
* human accountability
* existing operational terminology where meaningful

KAGUM ONE should improve the system around people rather than force people to conform to arbitrary software patterns.

---

## 4.3 REVAMP

Connect existing workflows into a structured operational system.

The target is:

```text
People
  ↓
Projects
  ↓
Tasks
  ↓
Execution
  ↓
Submission
  ↓
Review
  ↓
Completion
  ↓
Performance
  ↓
History
  ↓
Handover
  ↓
Organizational Memory
```

---

# 5. PROBLEM STATEMENT

KAGUM Advance Group lacks a centralized operational management system that connects people, projects, tasks, content, resources, performance, and historical records.

As a result:

* work information is fragmented
* accountability is harder to trace
* progress monitoring requires manual effort
* management visibility is limited
* historical knowledge may be lost
* handovers may depend heavily on individuals
* operational evidence is inconsistent

KAGUM ONE addresses this by creating a centralized and traceable operational system.

---

# 6. SYSTEM OBJECTIVE

## Main Objective

To develop KAGUM ONE, a centralized web-based operational management system that connects KAGUM Advance Group's people, work processes, resources, performance data, and organizational history in one structured and traceable platform.

## Specific Objectives

1. Centralize operational information.
2. Improve work traceability.
3. Improve accountability.
4. Improve management visibility.
5. Standardize important workflows.
6. Preserve organizational memory.
7. Support operational decision-making.
8. Provide assistive intelligence without removing human accountability.

---

# 7. ACTUAL ORGANIZATIONAL USERS

Current organizational context:

## Management

### Ts. Dr. HELMI ADLY

* CEO / Founding Director

### MOHAMAD IFNI

* Operation Manager

---

## Executives / Supervisors

### NURALYANA MAISARA

* Executive Officer, Director's Office

### SITI NUR SYUHADAH

* Admin & Operations Executive

### NUR ARIEZA AZIERA IZZATY

* Marketing Technologist Executive
* Content Strategist / Marketing Technology

---

## Staff

### Amzar bin Mohd Azali

* Marketing Technologist Officer

---

## Interns

* Muhammad Haikal bin Abd Satar
* Alya Imnai binti Azlan
* Muhammad Mishal Adam Iman bin Hamzah
* Remmy Ulan Anak Unang
* Muhammad Zharfan bin Zamrizal
* NUR IZZATI BINTI MUHAMMAD MUDDASSIR
* Muhamad Nurharith Syafiq Bin Mohd Nasir
* Muhammad Haikal Iman bin KhairulNizam
* NURIN BATRISYIA BINTI ABDUL MALEK

These names represent current organizational context and must not be hardcoded into business logic.

---

# 8. ORGANIZATIONAL RULES

## 8.1 Reporting Relationships

Reporting relationship is separate from job title.

A person may have a maximum of three reporting superiors.

If Person A reports to Person B, Person B may assign tasks to Person A, subject to permissions.

Reporting relationships must be stored explicitly.

Do not infer reporting relationships from:

* job titles
* departments
* role names
* numeric hierarchy alone

---

## 8.2 Last Working Day

Authorized management/executive users may update a person's Last Working Day.

Ordinary users cannot modify organizational authority or reporting structure.

Historical employment information must be preserved.

---

## 8.3 Self-Deletion

Users cannot delete themselves from the organization.

Account deactivation and organizational status changes must be handled through authorized workflows.

---

# 9. AUTHENTICATION ARCHITECTURE

Production architecture:

```text
Login
  ↓
Authentication
  ↓
Session
  ↓
Authenticated User
  ↓
Person Profile
  ↓
Roles
  ↓
Permissions
  ↓
Reporting Relationships
  ↓
Authorized Actions
  ↓
Dashboard
```

---

## 9.1 Identity vs Organization

Authentication identity and organizational profile are separate concepts.

Conceptually:

```text
users
    ↓
authentication identity

people
    ↓
organizational identity
```

A user account may be associated with a person record.

Do not merge authentication and organizational data unnecessarily.

---

# 10. AUTHENTICATION REQUIREMENTS

Production must support:

* Login
* Logout
* Session management
* Forgot password
* Reset password
* Account invitation
* Account activation
* Protected routes
* Server-side authorization
* Secure credential storage

Production should not provide unrestricted public signup unless explicitly required later.

Do not store plaintext passwords.

Better Auth must have one authoritative credential/password source.

Avoid creating duplicate password authority such as:

```text
users.passwordHash
```

if Better Auth's account records are intended to be authoritative.

---

# 11. DEVELOPMENT PERSONA SWITCHER

A development persona switcher may exist for testing.

It must:

* exist only in development
* be clearly labeled
* use the real authentication/session pathway
* not bypass authorization
* not exist in production
* not become a substitute for actual authentication

Dummy development personas must remain conceptually separate from real organizational people.

---

# 12. AUTHORIZATION

Permissions are authoritative.

Do not use generic role tiers as hidden authorization shortcuts.

Numeric role tiers may be used for:

* ordering
* display
* grouping

They must not silently grant access.

---

# 13. PERMISSION CATALOG

The system currently uses the following permission concepts:

```text
task:create
task:assign
task:edit
task:acknowledge
task:complete
task:request_extension
task:approve_extension

content:create
content:edit
content:self_qc
content:qc1
content:qc2
content:approve
content:publish

equipment:register
equipment:edit
equipment:borrow
equipment:return
equipment:force_return
equipment:maintenance

kpi:create
kpi:edit
kpi:view

team:view
team:edit
team:delete

reports:view
administration:manage
user:invite
knowledge:manage
announcement:create
```

Permissions should be implemented as explicit capabilities.

`knowledge:manage` publishes SOPs. `announcement:create` posts team notices. They are not interchangeable.

Runtime authority is the `role_permissions` table. A seed matrix is not a frozen business rule.

---

# 14. USER INVITATION

`user:invite` is a separate permission.

Do not assume:

```text
administration:manage
```

automatically means:

```text
user:invite
```

unless this is explicitly defined in the authorization matrix.

---

# 15. CORE SYSTEM WORKFLOW

The broad organizational workflow is:

```text
People
  ↓
Projects
  ↓
Tasks
  ↓
Calendar
  ↓
Content
  ↓
QC
  ↓
Publishing
  ↓
KPI
  ↓
Performance
  ↓
History
  ↓
Handover
```

The general user journey is:

```text
Login
  ↓
Understand
  ↓
Receive
  ↓
Acknowledge
  ↓
Execute
  ↓
Submit
  ↓
Review
  ↓
Complete
  ↓
Measure
  ↓
Record
  ↓
Learn
```

---

# 16. CORE MODULES

KAGUM ONE consists of these major functional areas:

1. User & Access Management
2. Team & Organization
3. Project Management
4. Task Management
5. Calendar & Planning
6. Content Management
7. Equipment Management
8. KPI & Performance
9. File & Evidence Management
10. Approval Management
11. Notification Management
12. Activity & Audit History
13. Handover
14. Skills Management
15. Reporting
16. Knowledge Base
17. AI Assistant
18. Administration
19. Settings

---

# 17. MVP DEFINITION

The MVP is not "every module."

The MVP is the smallest complete operational loop that proves KAGUM ONE's central value.

```text
People
  ↓
Project
  ↓
Task
  ↓
Execution
  ↓
Submission
  ↓
Completion
  ↓
History
```

MVP should answer:

* Who is this person?
* What are they responsible for?
* What project is happening?
* What tasks exist?
* Who owns each task?
* Who assigned each task?
* What is the current status?
* What is the official deadline?
* Was work submitted?
* What was delivered?
* Who reviewed it?
* When did it happen?
* What happened previously?

---

# 18. MVP PAGES

Core MVP pages:

* Login
* Forgot Password
* Reset Password
* Account Activation
* Dashboard
* Team
* Team Member Detail
* Projects
* Project Detail
* Tasks
* Task Detail
* My Tasks
* Kanban
* Calendar
* Notifications
* Activity / History

First operational extensions:

* Content
* Content Detail
* Content QC
* Publishing
* Equipment
* Equipment Detail
* KPI
* Approvals

---

# 19. PROJECT MANAGEMENT

A project must have:

* unique record
* project name
* description
* objective
* owner
* members
* status
* priority
* timeline
* related tasks
* related content where applicable
* files
* activity/history

Optional project attributes should only be introduced when justified.

---

# 20. PROJECT LIFECYCLE

A project may contain phases such as:

```text
Planning & Discovery
        ↓
Information Architecture
        ↓
Design & Prototyping
        ↓
Development
        ↓
Testing & Go Live
```

The exact phases should be configurable rather than hardcoded if the organization requires different project types.

---

# 21. TASK MANAGEMENT

A task should have:

* title
* description
* creator
* assignee
* collaborators where required
* project
* priority
* official deadline
* status
* planned work
* references
* subtasks where required
* deliverables
* attachments
* activity
* completion record
* extension request if applicable

---

# 22. TASK LIFECYCLE

Primary lifecycle:

```text
Draft
  ↓
Pending Acknowledgement
  ↓
Acknowledged
  ↓
In Progress
  ↓
Submitted / Self-QC
  ↓
Completed
```

Additional states may be introduced only when they solve a real workflow requirement.

---

# 23. TASK ACKNOWLEDGEMENT

Assigned users should acknowledge assigned tasks before normal execution where the workflow requires acknowledgement.

Acknowledgement creates a timestamped record.

---

# 24. TASK DEADLINES

Distinguish:

### Official Deadline

The authoritative date by which the task is expected to be completed.

### Planned Working Time

The period during which the user intends to work on the task.

These are not the same thing.

Do not use planned working time as the authoritative deadline.

---

# 25. OVERDUE LOGIC

A task becomes overdue based on the official deadline.

Do not mark a task overdue simply because planned work time has passed.

---

# 26. TASK EXTENSIONS

Extension workflow:

```text
Staff / Intern
     ↓
Request Extension
     ↓
Authorized Executive
     ↓
Approve / Reject
     ↓
If approved:
Official Deadline Changes
```

Submitting a request must not automatically change the official deadline.

The original deadline and extension history must remain traceable.

---

# 27. TASK COMPLETION

Task completion should capture relevant information such as:

* what was completed
* deliverables
* links
* files
* tools/equipment used
* explanation
* learned
* self-reflection
* problems
* notes
* collaborators
* contribution
* people involved
* timestamps

Not every field needs to be mandatory for every task.

Validation should depend on task type where appropriate.

---

# 28. CONTENT MANAGEMENT

Content is a lifecycle record.

The system must distinguish:

```text
Benchmark
≠
Planned
≠
Produced
≠
Published
≠
KPI Count
```

Do not treat these as interchangeable.

---

# 29. CONTENT LIFECYCLE

Primary workflow:

```text
Benchmark / Inspiration
        ↓
Planned
        ↓
Production
        ↓
Self-QC
        ↓
QC1
        ↓
Corrections
        ↓
QC2
        ↓
Corrections
        ↓
Final Approval
        ↓
Ready to Post
        ↓
Published
        ↓
Performance
```

---

# 30. CONTENT RECORD

A content record may contain:

* title
* content pillar
* platform
* content type
* project/campaign
* owner
* creator
* collaborators
* benchmark
* concept
* brief
* caption/copy
* assets
* planned publication date
* actual publication date
* production information
* self-QC
* QC1
* corrections
* QC2
* final approval
* publication information
* URL
* performance metrics
* activity/history

---

# 31. CONTENT KPI RULE

Do not assume:

```text
Created content = KPI content
```

Do not assume:

```text
Planned content = Published content
```

The KPI counting rule must be explicit.

Current provisional prototype rule:

```text
posted
AND
facebook
AND
instagram
AND
tiktok
```

This is provisional and should remain configurable if the business requirement evolves.

---

# 32. KPI MANAGEMENT

Every person has KPI information.

Current organizational rule:

* Staff/intern → Executive sets KPI
* Executive → may set own KPI
* Superior → may edit subordinate KPI subject to authorization

KPI changes must:

* create history
* notify affected person where appropriate
* preserve previous values

Default KPI period:

```text
3 months
```

Example:

```text
48 planned contents / 3 months
```

This is an example, not a hardcoded universal target.

---

# 33. KPI PRINCIPLES

Distinguish:

```text
Planned
Produced
Posted
KPI Count
```

Reactive, viral, trending, or ad-hoc work should not silently replace the baseline KPI target unless explicitly defined by management.

---

# 34. EQUIPMENT MANAGEMENT

Equipment is a managed operational asset.

Equipment may have:

* name
* ID
* serial number
* category
* status
* condition
* location
* current holder
* photos
* borrow history
* return history
* maintenance
* damage records
* activity history

---

# 35. EQUIPMENT STATUS

Supported conceptual states:

```text
Available
Reserved
Borrowed
Returned
Late
Missing
Damaged
Maintenance
```

Do not allow conflicting simultaneous states.

Current state should be derivable from authoritative equipment/loan records.

---

# 36. EQUIPMENT BORROWING

Borrowing should record:

* borrower
* equipment
* purpose
* related project
* related task/content where applicable
* expected return date
* notes
* before photos
* approval/confirmation where required
* timestamps

Minimum:

```text
2 before photos
```

where the workflow requires photographic evidence.

---

# 37. EQUIPMENT RETURN

Return should record:

* actual return date/time
* after photos
* condition
* notes
* damage issue if applicable
* returning user
* receiving/confirming user where required

Minimum:

```text
2 after photos
```

where photographic evidence is required.

---

# 38. FORCE RETURN

Authorized management/executive users may force-return equipment borrowed by another user if permitted.

Force-return must:

* preserve the original borrower
* preserve the reason
* preserve timestamp
* create activity/audit history

Never erase the original borrowing history.

---

# 39. CALENDAR

Calendar connects planning with operational records.

Calendar may display:

* task deadlines
* planned work
* project milestones
* meetings
* events
* content activities
* publishing
* other operational events

The calendar should not become a completely independent task/event database when an existing record can be referenced.

---

# 40. CALENDAR VIEWS

Support:

* Day
* Week
* Month

Useful controls:

* date navigation
* filters
* team filters
* record type filters
* weekend visibility
* tentative event visibility

---

# 41. FILES AND EVIDENCE

Files should be associated with relevant records.

Examples:

```text
Project
Task
Content
Equipment
KPI
Handover
Knowledge Base
```

Avoid creating a meaningless global file dump.

Each file should ideally have:

* uploader
* related record
* category/type
* timestamp
* version where relevant
* access control

---

# 42. APPROVALS

Approvals should be explicit records.

An approval should contain:

* requester
* reviewer
* request type
* related entity
* status
* decision
* comment/reason
* timestamp
* history

Examples:

* Task extension
* Content approval
* QC approval
* Equipment-related authorization
* Other explicitly defined management approvals

---

# 43. NOTIFICATIONS

Notifications should be generated from meaningful system events.

Examples:

* task assigned
* task acknowledgement required
* task deadline approaching
* task overdue
* extension request
* extension decision
* content QC required
* content correction
* content approval
* KPI changed
* equipment due
* equipment overdue
* handover action required

Notifications should link back to the authoritative record.

---

# 44. NOTIFICATION PRINCIPLE

The system should not notify users about everything.

Notifications must answer:

> Does this require the user's awareness or action?

Avoid notification spam.

---

# 45. ACTIVITY VS AUDIT

These are related but not identical.

## Activity

Human-readable operational history.

Examples:

> Arieza submitted Task #104.

> Yana approved Content #42.

## Audit

System-level traceability.

Examples:

* permission changed
* role changed
* reporting relationship changed
* deadline changed
* KPI target changed
* account status changed

Use the appropriate record for the purpose.

---

# 46. SHARED ACTIVITY / AUDIT SERVICES

Important modules should use shared services rather than implementing inconsistent logging independently.

Conceptual shared functions:

```text
recordActivity()
recordAudit()
notify()
```

All consequential actions should use centralized mechanisms where practical.

---

# 47. TEAM & ORGANIZATION

Team management should support:

* people directory
* organizational status
* departments
* positions
* reporting relationships
* employment type
* projects
* tasks
* KPI
* skills
* workload
* history

Organization chart is a visualization of stored organizational relationships.

Do not make the visual chart itself the source of truth.

---

# 48. SKILLS MANAGEMENT

Skills should support:

* skill directory
* categories
* proficiency levels
* people
* skill evidence
* verification
* capability gaps
* development needs
* project relevance

A useful proficiency model may use:

```text
Level 1 — Novice
Level 2 — Basic
Level 3 — Competent
Level 4 — Advanced
Level 5 — Expert
```

This should remain configurable.

Do not invent a separate skill catalog. Implemented inference uses existing task categories and content workflow stages. Completion write-ups and content/QC records are evidence. Inferred level is observed work-record count. It is not a KPI and is not verification.

---

# 49. HANDOVER

Handover preserves organizational memory when responsibility changes.

A handover may include:

* outgoing person
* incoming person
* projects
* outstanding tasks
* files
* issues
* risks
* knowledge
* notes
* links
* status
* completion history

Handover must not simply copy tasks.

It should preserve context.

---

# 50. REPORTING

Reports should derive from authoritative records.

Potential reporting areas:

* project progress
* task completion
* overdue work
* content output
* content performance
* KPI
* equipment utilization
* workload
* time
* team activity

Do not create duplicate data solely for reporting unless performance requirements justify materialized summaries.

---

# 51. TIME TRACKING

Time tracking should remain distinct from deadlines.

Possible records:

* person
* date
* task
* project
* planned time
* actual time
* notes

Use actual recorded entries for actual time.

Do not infer actual work duration merely from task status changes.

---

# 52. WORKLOAD

Workload should be based on actual/planned records.

Potential indicators:

* active tasks
* assigned tasks
* approaching deadlines
* planned hours
* actual hours
* overdue tasks
* capacity

Avoid presenting speculative "productivity scores" as objective facts.

---

# 53. DASHBOARD

The dashboard is a decision surface, not a database.

A dashboard may contain:

* My Tasks
* Pending Acknowledgement
* In Progress
* Overdue
* Upcoming Deadlines
* Active Projects
* Content Pipeline
* KPI Snapshot
* Workload
* Notifications
* Team Activity
* Relevant quick actions

Management views may show broader organizational summaries.

Regular users should see information relevant to their permissions and responsibilities.

---

# 54. DASHBOARD DESIGN PRINCIPLE

Do not overload the dashboard with every available metric.

A dashboard should answer:

1. What needs my attention?
2. What am I responsible for?
3. What is changing?
4. What is at risk?
5. What should I do next?

---

# 55. AI ASSISTANT

AI is assistive.

Core flow:

```text
User Question
      ↓
Retrieve Authorized Records
      ↓
Analyze
      ↓
Generate Suggestion / Summary
      ↓
Show Sources
      ↓
Human Decision
      ↓
Authorized Action
      ↓
Audit
```

---

# 56. AI REQUIREMENTS

AI may:

* summarize projects
* summarize activity
* search records
* find previous work
* draft content
* suggest task plans
* identify possible overdue risks
* surface missing information
* summarize handovers
* help interpret KPI records

AI must not:

* fabricate records
* invent activity
* bypass permissions
* silently modify records
* approve consequential actions
* pretend an inference is a recorded fact

---

# 57. AI INFORMATION LABELING

Where relevant, distinguish:

```text
Recorded
Known from system data

Inferred
Derived from available information

Suggested
AI-generated recommendation
```

When presenting AI answers, provide sources where possible.

---

# 58. ADMINISTRATION

Administration should manage system configuration such as:

* organization structure
* users
* invitations
* roles
* permissions
* departments
* reporting relationships
* KPI configuration
* equipment categories
* content configuration
* notifications
* system configuration
* system activity

Administrative UI must not automatically imply unrestricted data modification.

---

# 59. SETTINGS

Settings should contain user/system preferences appropriate to authorization.

Possible areas:

* account
* notifications
* display
* password/security
* system preferences

Do not place operational records inside settings.

---

# 60. KNOWLEDGE BASE

Knowledge Base preserves organizational knowledge.

It may contain:

* SOPs
* guides
* tutorials
* policies
* templates
* best practices
* FAQs
* process documentation

Knowledge records should have:

* owner
* category
* last updated
* version/history where appropriate

---

# 61. CURRENT TARGET INFORMATION ARCHITECTURE

```text
KAGUM ONE
│
├── AUTHENTICATION
│   ├── Login
│   ├── Forgot Password
│   ├── Reset Password
│   └── Account Activation
│
├── WORKSPACE
│   ├── Dashboard
│   ├── Projects
│   │   └── Project Detail
│   ├── Tasks
│   │   └── Task Detail
│   ├── My Tasks
│   ├── Kanban
│   ├── Calendar
│   ├── Content
│   │   └── Content Detail
│   ├── Content QC
│   ├── Publishing
│   ├── Notices
│   ├── Equipment
│   │   └── Equipment Detail
│   └── Files
│
├── PERFORMANCE
│   ├── KPI
│   ├── Reports
│   ├── Time Tracking
│   └── Workload
│
├── PEOPLE
│   ├── Team
│   │   └── Team Member Detail
│   └── Skills
│       └── Skill Detail
│
├── MANAGEMENT
│   ├── Approvals
│   ├── Activity / History
│   ├── Handover
│   └── Administration
│
└── SYSTEM
    ├── Notifications
    ├── AI Assistant
    ├── My Profile
    ├── Settings
    └── Knowledge Base
```

This is the implemented conceptual structure.

Current implementation notes are in `SYSTEM_ARCHITECTURE.md`.

Individual navigation labels may be refined, but duplication should be avoided. Notices are team announcements, not SOPs and not approvals.

---

# 62. PAGE DESIGN RULE

Every page must have a clear purpose.

Ask:

> What real user decision or action does this page support?

Then ask:

> What record does that action create or change?

A page should not exist merely because another enterprise application has the page.

---

# 63. WIREFRAME INTERPRETATION RULE

Generated wireframes are visual references, not authoritative requirements.

Wireframes may contain:

* placeholder people
* fake numbers
* fake dates
* generic departments
* invented job titles
* alternative navigation
* duplicate modules
* generic enterprise features

Do not copy these into production logic without validating them against KAGUM ONE requirements.

---

# 64. WIREFRAME PATTERNS WORTH RETAINING

Useful patterns from existing wireframes include:

## Equipment

* metric cards
* equipment table
* status tabs
* current borrowing panel
* maintenance overview
* condition summary
* recent activity

## Content

* lifecycle tracker
* content table
* stage filters
* content performance
* content pillar breakdown

## Calendar

* Day/Week/Month
* hourly schedule
* filters
* activity legend
* operational record blocks

## Tasks

* task metrics
* table
* filters
* selected task detail panel
* activity/completion history

## Projects

* project header
* status
* progress
* timeline
* health
* related tasks/content
* activity

## Dashboard

* personal work summary
* upcoming deadlines
* notifications
* content pipeline
* KPI snapshot
* team activity
* quick actions

## AI

* conversation
* structured summary
* sources
* suggestions
* human decision block

## Administration

* configuration cards
* system activity
* system status

## Notifications

* categorized list
* unread/attention filters
* detail panel
* action link

## Team

* organization chart
* people table
* reporting
* skills
* KPI
* workload

## Skills

* capability overview
* proficiency
* capability gaps
* verification

## KPI

* progress
* status
* individual/project/content/organizational views
* history
* alignment

---

# 65. WIREFRAME ANTI-PATTERNS

Do not automatically reproduce:

* fake corporate hierarchy
* excessive enterprise navigation
* duplicate dashboards
* duplicate reports
* arbitrary metrics
* decorative charts with no decision purpose
* unrelated modules
* generic "AI everywhere"
* unnecessary automation
* invented business processes
* fake data in production
* visual status without underlying records

---

# 66. NAVIGATION PRINCIPLE

The navigation should represent the user's mental model of work.

Preferred conceptual structure:

```text
Workspace
Performance
People
Management
System
```

Do not create separate top-level navigation for every workflow state.

For example:

```text
Equipment
```

may contain:

* equipment inventory
* borrowing
* maintenance
* condition
* history

without necessarily creating five independent top-level applications.

Likewise:

```text
Content
```

can contain:

* planning
* production
* QC
* approval
* publishing
* performance

without fragmenting the lifecycle unnecessarily.

---

# 67. DATABASE PRINCIPLES

Use relational data for authoritative operational records.

Current target technology:

* Turso
* SQLite
* Drizzle ORM

Use normalized relationships where appropriate.

Avoid:

* giant JSON blobs as the primary data model
* duplicated authoritative fields
* hardcoded users
* hardcoded permissions
* hardcoded workflow states when configurability is genuinely required
* speculative tables without business purpose

---

# 68. CURRENT ARCHITECTURAL STACK

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
Lucide React
Turso
Drizzle ORM
Better Auth
Zod
React Hook Form
Recharts
dnd-kit
Vercel
GitHub
```

Architecture:

> Modular monolith

Preferred structure:

```text
One repository
One application
One primary database
One deployment
Clear module boundaries
Shared domain services
```

Do not introduce microservices unless a demonstrated requirement exists.

Current implemented architecture: `SYSTEM_ARCHITECTURE.md`.

Do not introduce:

* Kubernetes
* Redis
* message brokers
* separate backend services
* unnecessary infrastructure

without a concrete requirement.

---

# 69. SERVER-SIDE AUTHORIZATION

Authorization must be enforced server-side.

UI hiding is not security.

For consequential actions:

```text
Client Request
      ↓
Authenticated Session
      ↓
Authorization Check
      ↓
Validation
      ↓
Business Rule Check
      ↓
Database Mutation
      ↓
Activity / Audit
      ↓
Notification
```

---

# 70. VALIDATION

Use schema validation for input.

Preferred:

* Zod
* React Hook Form
* server-side validation

Client validation improves UX.

Server validation protects integrity.

Never rely exclusively on client-side validation.

---

# 71. SHARED DOMAIN SERVICES

Where appropriate, create shared services for:

* authentication context
* authorization
* activity
* audit
* notifications
* file references
* workflow transitions
* history

Do not duplicate business logic across pages.

---

# 72. DATA INTEGRITY

Every major entity should have:

* stable ID
* creation timestamp
* update timestamp where applicable
* ownership/context
* status where applicable
* history when changes matter

Use foreign keys and constraints where practical.

---

# 73. STATUS TRANSITIONS

Important workflow statuses should have controlled transitions.

Do not allow arbitrary:

```text
status = "whatever"
```

from uncontrolled UI input.

Transitions should validate:

* current status
* requested next status
* user permission
* required information
* business rules

---

# 74. HISTORY PRESERVATION

Do not destroy operational history merely to make the current UI simpler.

When values change materially, preserve:

* previous value
* new value
* changed by
* timestamp
* reason/comment when required

Examples:

* deadline
* KPI
* role
* reporting relationship
* equipment condition
* approval status

---

# 75. SOFT DELETE / DEACTIVATION

Do not hard-delete records when doing so would destroy organizational memory.

Prefer:

* inactive
* archived
* retired
* deactivated

where appropriate.

Historical records should remain queryable according to permissions.

---

# 76. SECURITY

Minimum expectations:

* secure authentication
* server-side authorization
* protected routes
* secure password handling
* session protection
* input validation
* access-controlled files
* audit logging for consequential actions
* no secrets in source code
* environment variables for secrets
* production/development separation

---

# 77. ERROR HANDLING

Errors should be:

* understandable to users
* useful for debugging
* safe from sensitive data leakage

Do not expose:

* database internals
* credentials
* secrets
* stack traces to ordinary users

---

# 78. RESPONSIVE DESIGN

Target:

### Desktop

Primary experience:

```text
≥ 1280px
```

### Tablet

Use:

* collapsible sidebar
* responsive tables
* adaptable panels

### Mobile

Use:

* drawer navigation
* compact top bar
* simplified tables
* bottom navigation where appropriate
* stacked detail sections
* touch-friendly actions

Do not simply shrink desktop UI.

---

# 79. VISUAL DESIGN SYSTEM

KAGUM ONE should look like a professional corporate SaaS application.

Do not make it:

* game-like
* overly colorful
* AI-themed
* decorative
* visually noisy

---

## Color Palette

```text
Primary       #1F3A5F
Primary Dark  #162A43
Primary Light #EAF1F8

Background    #F5F7FA
Surface       #FFFFFF
Border        #E2E6EC

Text          #1F2937
Secondary     #667085
Muted         #98A2B3

Success       #1B7A4A
Warning       #B5720A
Error         #B3261E
Info          #2563A8
```

---

# 80. TYPOGRAPHY

Primary font:

```text
Inter
```

Use clear hierarchy.

Avoid excessive:

* giant headings
* decorative typography
* gradients
* shadows
* rounded cards everywhere

---

# 81. UI COMPONENT PRINCIPLES

Prefer:

* clear tables
* compact cards
* tabs
* filters
* status badges
* drawers
* detail panels
* timelines
* progress indicators
* confirmation dialogs
* contextual actions

Use Lucide icons.

Use subtle borders and minimal shadows.

---

# 82. TABLE DESIGN

Tables should prioritize operational scanning.

Typical columns:

* Name
* Owner
* Status
* Priority
* Project
* Deadline
* Updated
* Action

Do not include every possible database field in a table.

Additional information belongs in:

* detail pages
* drawers
* expandable rows
* filters

---

# 83. DASHBOARD DATA

Dashboard metrics must come from actual records.

Never hardcode example values such as:

```text
342 equipment
128 employees
2.45M engagement
78% completion
```

unless explicitly part of a development fixture.

Production dashboards must query authoritative data.

---

# 84. DEMO DATA

Development/demo data may exist.

It must be:

* clearly identifiable
* separate from production
* seedable
* removable
* non-authoritative

Do not confuse demo data with real organizational data.

---

# 85. PAGE INVENTORY

## Authentication

### Login

Contains:

* KAGUM ONE branding
* email
* password
* remember me
* login
* forgot password
* validation

### Forgot Password

Contains:

* email
* submit
* status
* back to login

### Reset Password

Contains:

* new password
* confirm password
* requirements
* reset
* status

### Account Activation

Contains:

* invitation information
* account/email information
* password setup
* activation

---

# 86. DASHBOARD PAGE

Possible sections:

* greeting
* current date
* My Tasks
* pending acknowledgement
* overdue
* upcoming deadlines
* active projects
* content pipeline
* KPI snapshot
* workload
* notifications
* team activity
* quick actions

The exact dashboard varies according to user role and permission.

---

# 87. PROJECTS PAGE

Contains:

* project list
* search
* filters
* status
* priority
* owner
* members
* timeline
* progress
* create project

---

# 88. PROJECT DETAIL PAGE

Contains:

* project overview
* objective
* owner
* members
* status
* priority
* timeline
* progress
* related tasks
* related content
* files
* skills gap where relevant
* activity
* handover
* notes

---

# 89. TASKS PAGE

Contains:

* task list
* search
* filters
* status
* priority
* project
* assignee
* deadline
* overdue
* create task

Useful tabs:

* All Tasks
* My Tasks
* Assigned by Me
* Team Tasks
* Completed

---

# 90. TASK DETAIL PAGE

Contains:

* title
* description
* project
* creator
* assignee
* collaborators
* priority
* official deadline
* planned work
* status
* subtasks
* references
* deliverables
* attachments
* activity
* extension request
* completion

---

# 91. MY TASKS PAGE

Focus on the current user's actionable work.

Possible sections:

* Pending Acknowledgement
* Today
* In Progress
* Submitted
* Completed
* Overdue
* Upcoming

---

# 92. KANBAN PAGE

Default conceptual columns:

```text
Draft
Pending Acknowledgement
Acknowledged
In Progress
Submitted
Completed
```

Cards may display:

* title
* project
* assignee
* priority
* deadline
* overdue indicator

Drag-and-drop must respect workflow transition permissions.

---

# 93. CALENDAR PAGE

Contains:

* Day
* Week
* Month
* date navigation
* search
* filters
* events
* task deadlines
* planned work
* content activities
* publishing
* milestones

Calendar entries should reference authoritative records where possible.

---

# 94. CONTENT PAGE

Contains:

* content list
* lifecycle stages
* search
* filters
* platform
* content pillar
* owner
* project
* publish date
* performance

---

# 95. CONTENT DETAIL

Contains:

* content information
* benchmark
* concept
* brief
* copy
* assets
* creator
* collaborators
* production
* self-QC
* QC1
* corrections
* QC2
* approval
* publishing
* URL
* performance
* history

---

# 96. CONTENT QC PAGE

Contains:

* content preview
* QC checklist
* reviewer
* comments
* correction requests
* QC status
* revision history
* approval
* timestamp

---

# 97. PUBLISHING PAGE

Contains:

* approved content
* platform
* caption
* scheduled time
* URL
* publication status
* actual publication date
* evidence
* performance

---

# 98. EQUIPMENT PAGE

Contains:

* equipment metrics
* search
* export
* add equipment
* borrow equipment
* status tabs
* equipment table
* current borrowing
* maintenance overview
* condition summary
* recent activity

---

# 99. EQUIPMENT DETAIL

Contains:

* equipment identity
* category
* serial number
* status
* condition
* location
* current holder
* photos
* borrowing history
* return history
* maintenance
* damage
* activity

---

# 100. KPI PAGE

Contains:

* period
* person
* category
* target
* actual
* progress
* status
* evidence
* history
* create/edit where authorized

---

# 101. REPORTS PAGE

Potential report views:

* projects
* tasks
* overdue
* content
* KPI
* equipment
* workload
* time
* team

Use filters and export where appropriate.

---

# 102. TIME TRACKING PAGE

Contains:

* person
* date
* task
* project
* planned time
* actual time
* entries
* summaries

---

# 103. WORKLOAD PAGE

Contains:

* person
* active tasks
* planned time
* actual time
* deadlines
* capacity
* overdue
* workload indicators

Avoid presenting unsupported psychological or productivity judgments.

---

# 104. TEAM PAGE

Contains:

* directory
* name
* position
* department
* employment type
* status
* reporting relationship
* search
* filters

---

# 105. TEAM MEMBER DETAIL

Contains:

* profile
* position
* department
* reporting
* projects
* tasks
* KPI
* skills
* workload
* employment information
* activity/history

---

# 106. SKILLS PAGE

Contains:

* skill directory
* categories
* proficiency
* people
* capability gaps
* verification
* evidence
* reports

---

# 107. APPROVALS PAGE

Contains:

* pending
* approved
* rejected
* request type
* requester
* related entity
* decision
* comments
* history

---

# 108. ACTIVITY / HISTORY PAGE

Contains:

* timeline
* user
* action
* entity
* timestamp
* status changes
* assignments
* approvals
* QC
* equipment transactions
* project changes
* filters

---

# 109. HANDOVER PAGE

Contains:

* active handovers
* incoming/outgoing
* projects
* outstanding tasks
* files
* issues
* knowledge
* notes
* status
* history

---

# 110. ADMINISTRATION PAGE

Contains configuration areas such as:

* organization structure
* users
* invitations
* roles
* permissions
* departments
* reporting relationships
* KPI configuration
* equipment categories
* content configuration
* notifications
* system configuration
* system activity

---

# 111. NOTIFICATIONS PAGE

Contains:

* all
* unread
* needs attention
* mentions
* handled
* mark all as read
* notification details
* linked records

---

# 112. FILES PAGE

Contains:

* files
* folders/categories
* search
* filters
* file type
* uploader
* related records
* upload date
* preview/download
* version history where relevant

---

# 113. AI ASSISTANT PAGE

Contains:

* chat
* authorized record search
* project summaries
* task summaries
* activity summaries
* suggestions
* sources
* human decision controls
* clear distinction between recorded information and AI inference

---

# 114. MY PROFILE

Contains:

* profile
* name
* position
* department
* reporting
* skills
* KPI
* task summary
* activity
* account information

Users should not be able to modify organizational fields they are not authorized to modify.

---

# 115. SETTINGS

Contains:

* account
* notifications
* display
* security
* password
* system preferences where authorized

---

# 116. KNOWLEDGE BASE

Contains:

* guides
* SOPs
* policies
* tutorials
* templates
* best practices
* FAQs
* search
* categories
* owner
* last updated
* version history

---

# 117. DATABASE CONCEPTS

Core authentication/organization tables:

```text
users
sessions
invitations

people
departments
person_departments

roles
permissions
role_permissions
person_roles

reporting_relationships
```

Core operational tables:

```text
projects
project_members
project_files
project_history
project_handover

tasks
task_assignees
task_subtasks
task_deliverables
task_references
task_collaborators
task_completion
task_activity

calendar_events
planned_work

contents
content_benchmarks
content_production
content_self_qc
content_qc
content_approvals
content_publications
content_performance

equipment
equipment_loans
equipment_conditions
equipment_maintenance
equipment_history

skills
user_skills
skill_evidence

kpis
kpi_targets
kpi_periods
kpi_history

time_entries
workload_records

notifications
notification_preferences

files

activity_logs
audit_logs

settings
announcements
knowledge_articles
```

This is a conceptual inventory.

Do not create every table blindly.

Only implement tables justified by actual module requirements.

---

# 118. RELATIONSHIP PRINCIPLES

Prefer relationships such as:

```text
Person
  ├── Roles
  ├── Reporting Relationships
  ├── Projects
  ├── Tasks
  ├── KPI
  ├── Skills
  └── Activity

Project
  ├── Members
  ├── Tasks
  ├── Content
  ├── Files
  ├── History
  └── Handover

Task
  ├── Assignees
  ├── Project
  ├── Deliverables
  ├── Activity
  ├── Completion
  └── Extension Requests

Content
  ├── Project
  ├── Production
  ├── QC
  ├── Approval
  ├── Publishing
  ├── Performance
  └── History
```

---

# 119. IMPLEMENTATION STRATEGY

Do not force the project into rigid feature-by-feature phase gates.

Preferred strategy:

```text
Build complete functional foundation
          ↓
Integrate modules
          ↓
Test
          ↓
Debug
          ↓
Refine
          ↓
Polish
          ↓
Production hardening
```

The system should become structurally complete before spending excessive time on visual polish.

---

# 120. BUILD ORDER

Recommended implementation order:

## Foundation

* authentication
* users
* people
* roles
* permissions
* departments
* reporting relationships
* shared services

## Core Operations

* projects
* tasks
* my tasks
* kanban
* calendar
* notifications
* activity/history

## Operational Extensions

* content
* QC
* publishing
* equipment
* KPI
* approvals

## Supporting Modules

* team
* skills
* files
* reports
* workload
* time tracking
* handover
* knowledge base

## Advanced

* AI Assistant
* advanced analytics
* deeper automation

---

# 121. AI IMPLEMENTATION PRIORITY

AI should be implemented after authoritative data and workflows are stable.

Reason:

```text
Bad records
    ↓
Bad summaries
    ↓
Bad AI
```

Therefore:

> Data quality before AI.

---

# 122. TESTING PRINCIPLE

Test both:

### Functional correctness

Does the feature work?

### Business correctness

Does it enforce the intended KAGUM workflow?

Example:

A task extension UI working correctly is not enough.

The system must also ensure:

* requester is authorized
* approver is authorized
* deadline does not change before approval
* original deadline is preserved
* decision is recorded
* affected user is notified

---

# 123. TESTING PRIORITIES

Test:

1. Authentication
2. Authorization
3. CRUD
4. Workflow transitions
5. Validation
6. History
7. Notifications
8. Permission boundaries
9. Data relationships
10. Responsive UI
11. Error handling
12. Production build

---

# 124. AUTHORIZATION TESTING

Test negative cases.

Examples:

* unauthorized user attempts edit
* user attempts to modify own reporting authority
* user attempts to approve own request where prohibited
* staff attempts management-only action
* user attempts force-return without permission
* user attempts KPI modification without permission
* user attempts access to restricted records

Security tests must not rely solely on UI visibility.

---

# 125. PRODUCTION VS DEVELOPMENT

Development may contain:

* seed data
* test accounts
* persona switcher
* debug controls
* development banners

Production must not expose these accidentally.

Use environment-aware configuration.

---

# 126. DATA MIGRATIONS

Schema changes must use proper migrations.

Do not casually modify production schema manually.

Before migration:

* inspect existing schema
* generate migration
* review migration
* apply locally
* run tests
* verify data compatibility

---

# 127. DOCUMENTATION

Maintain:

```text
CLAUDE.md
PROMPT_SYSTEM.md
KAGUM_ONE_HANDOFF.md
KAGUM_ONE_DECISIONS.md
NEXT_STEP.md
```

Documentation should reflect actual implementation.

Do not allow documentation to claim a feature is complete when it is not.

---

# 128. DECISION LOGGING

Important architectural/business decisions should be recorded.

Each decision should ideally include:

* decision
* context
* options considered
* selected direction
* reason
* consequences
* date/status

Do not silently change established business rules.

---

# 129. ASSUMPTIONS

When requirements are unclear:

1. Identify the uncertainty.
2. State the assumption.
3. Avoid embedding irreversible assumptions.
4. Make the implementation configurable where practical.
5. Record important decisions.

Never present an assumption as an established business rule.

---

# 130. CURRENT / TARGET / GAP MODEL

When analyzing a feature, explicitly distinguish:

### Current Reality

What KAGUM currently does.

### Target State

What KAGUM ONE should enable.

### Gap

What is missing between them.

### Dependency

What must exist first.

### Decision

What has already been agreed.

### Assumption

What is temporarily assumed.

### Priority

MVP / Next / Later / Not Required.

---

# 131. AGENT BEHAVIOR

AI coding agents must:

* inspect existing code before changing it
* inspect relevant schema before creating new tables
* inspect existing services before duplicating logic
* preserve established business rules
* avoid unnecessary rewrites
* avoid speculative architecture
* avoid hardcoding business data
* validate changes
* test after meaningful changes
* update documentation when architecture changes
* explain important tradeoffs

---

# 132. DO NOT GUESS

If something is unknown, do not invent a business rule.

Use:

```text
Unknown
```

or:

```text
Assumption
```

until validated.

This is particularly important for:

* permissions
* organizational hierarchy
* KPI targets
* approval authority
* workflow transitions
* employee status
* reporting relationships
* financial/business metrics

---

# 133. DO NOT OVERENGINEER

Do not introduce complexity merely because it is technically possible.

Avoid unnecessary:

* abstractions
* services
* microservices
* generic workflow engines
* event buses
* AI agents
* automation engines
* complex state machines
* speculative database tables

Build what KAGUM ONE actually needs.

---

# 134. DO NOT UNDERENGINEER

At the same time, do not simplify away important operational rules.

Do not replace:

```text
Extension request → approval → deadline change
```

with:

```text
Edit deadline
```

Do not replace:

```text
Borrow → evidence → use → return → condition
```

with:

```text
Status = Borrowed
```

Do not replace:

```text
Content → QC → approval → publishing
```

with:

```text
Published = true
```

Operational systems need traceability.

---

# 135. BUSINESS LOGIC OVER UI

UI must represent the domain.

Do not make database or business rules conform to a generated wireframe simply because the wireframe looks good.

Correct order:

```text
Business Rule
      ↓
Domain Model
      ↓
Workflow
      ↓
Data
      ↓
UI
```

---

# 136. UI OVER DATABASE

Do not expose database structure directly to users.

The user should see:

> Task Extension Request

not:

> task_extension_requests table

The interface should communicate operational concepts.

---

# 137. EMPTY STATES

Empty states should explain:

* what is empty
* why it may be empty
* what the user can do next

Example:

> No pending approvals.
> Requests requiring your decision will appear here.

Avoid meaningless:

> No data.

---

# 138. LOADING STATES

Every data-driven page should handle:

* loading
* success
* empty
* error

Do not leave blank screens during loading.

---

# 139. DESTRUCTIVE ACTIONS

Destructive or consequential actions require:

* clear action label
* confirmation where appropriate
* permission validation
* audit/history where appropriate

Avoid ambiguous buttons such as:

> Proceed

Prefer:

> Approve Extension

> Force Return Equipment

> Deactivate Account

---

# 140. ACCESSIBILITY

Use:

* semantic HTML
* keyboard navigation
* accessible labels
* sufficient contrast
* focus states
* meaningful status text
* icon labels/tooltips where needed

Do not communicate critical information through color alone.

---

# 141. PERFORMANCE

Prefer:

* server-side data loading where appropriate
* pagination for large datasets
* indexed queries
* selective fetching
* reusable queries
* optimized images/files

Do not load the entire database merely to calculate one dashboard metric.

---

# 142. SEARCH

Global search should eventually support authorized records such as:

* people
* projects
* tasks
* content
* equipment
* files
* knowledge
* history

Search must respect authorization.

---

# 143. EXPORT

Exports must respect:

* user permissions
* filters
* selected date range
* data access rules

Do not allow export to bypass UI-level data restrictions.

---

# 144. AUDITABILITY

For every consequential action ask:

> Can we later determine who did this, what they changed, and when?

If not, the workflow may need an audit/activity record.

---

# 145. ORGANIZATIONAL MEMORY

The system should make it possible for a future person to understand:

* what happened
* why it happened
* who was responsible
* what was completed
* what remains
* what files exist
* what problems occurred
* what was learned

This is one of the primary reasons KAGUM ONE exists.

---

# 146. HANDOVER PRINCIPLE

A person leaving or changing responsibility should not take the operational memory with them.

The system should make handover a structured transfer of:

```text
Context
+
Responsibilities
+
Outstanding Work
+
Evidence
+
Knowledge
+
History
```

---

# 147. DESIGNING NEW FEATURES

When asked to create a new feature, follow this checklist:

```text
1. What problem does it solve?
2. Who uses it?
3. What decision/action does it support?
4. What record is created?
5. What existing record does it relate to?
6. What workflow does it belong to?
7. What permissions are required?
8. What business rules apply?
9. What history must be preserved?
10. What notifications are required?
11. What page/UI is required?
12. What database changes are required?
13. What tests are required?
14. Is it MVP, next, later, or unnecessary?
```

---

# 148. DESIGNING A NEW PAGE

Before creating a page:

```text
Page Purpose
↓
Primary User
↓
Primary Decision
↓
Primary Action
↓
Records Used
↓
Records Changed
↓
Permissions
↓
UI
```

---

# 149. DESIGNING A NEW DATABASE TABLE

Before creating a table:

```text
What real-world entity does this represent?
What authoritative fact does it store?
Who creates it?
Who edits it?
Who reads it?
What does it relate to?
Does history matter?
Can an existing table represent this instead?
```

If an existing entity can represent the requirement cleanly, do not create another table.

---

# 150. DESIGNING A NEW PERMISSION

Before creating a permission:

```text
What action does this control?
Who should perform it?
Who should not perform it?
Is the action materially different from an existing permission?
Does it need object-level/scoped authorization?
```

Avoid permissions that are merely job titles.

---

# 151. WORKFLOW TRANSITION CHECKLIST

Before allowing a transition:

```text
Current State
↓
Requested State
↓
Who requested it?
↓
Is the actor authorized?
↓
Are required fields/evidence present?
↓
Is approval required?
↓
What record changes?
↓
What history is created?
↓
Who is notified?
```

---

# 152. COMPLETION CRITERIA

A feature is not complete merely because the page renders.

A feature is complete when:

* UI exists
* data model exists
* server logic exists
* authorization exists
* validation exists
* workflow rules work
* history works where required
* notifications work where required
* errors are handled
* tests pass
* production build passes
* documentation is accurate

---

# 153. DEFINITION OF DONE

For a module:

```text
[ ] Requirement understood
[ ] Business rules identified
[ ] Data model implemented
[ ] Permissions implemented
[ ] Server actions/API implemented
[ ] UI implemented
[ ] Validation implemented
[ ] Loading state implemented
[ ] Empty state implemented
[ ] Error state implemented
[ ] Activity/audit implemented
[ ] Notifications implemented where required
[ ] Tests implemented
[ ] Build verified
[ ] Documentation updated
```

---

# 154. CURRENT DEVELOPMENT STATE

The project already has a functional foundation.

Existing work includes:

* repository structure
* `CLAUDE.md`
* prototype wireframe/application
* Drizzle schema
* migration
* local database verification
* Better Auth configuration
* permissions
* role-permission seed data
* authorization helpers
* activity/audit/notification services
* authentication context
* initial project server actions
* tests
* TypeScript verification

Do not restart the project from scratch.

Inspect and extend the existing implementation.

---

# 155. CURRENT DEVELOPMENT STRATEGY

The functional system is connected to the architecture in `SYSTEM_ARCHITECTURE.md`.

Remaining movement:

```text
Complete Functional System
→
Integration
→
Testing
→
Debugging
→
Refinement
→
Polish
→
Production Hardening
```

Do not recreate the foundation. Prefer refining existing modules, permissions, and records.

---

# 156. IMPLEMENTED ROUTES

App Router routes now include:

```text
/login
/forgot-password
/reset-password
/activate
/dashboard
/projects
/projects/:id
/tasks
/tasks/:id
/my-tasks
/kanban
/calendar
/content
/content/:id
/content/:id/qc
/publishing
/notices
/equipment
/equipment/:id
/files
/kpi
/reports
/time-tracking
/workload
/team
/team/:id
/skills
/skills/:id
/approvals
/activity
/handover
/admin
/notifications
/ai
/profile
/settings
/knowledge
/more
```

Handover is `/handover`, not a nested project-only route. Skills-gap is not a separate application; capability gaps are shown on skills and team records where evidence exists.

Do not add a duplicate app for a route that already exists.

---

# 157. NAVIGATION IMPLEMENTATION

The target navigation is:

```text
WORKSPACE
├── Dashboard
├── Projects
├── Tasks
├── My Tasks
├── Kanban
├── Calendar
├── Content
├── Notices
├── Equipment
└── Files

PERFORMANCE
├── KPI
├── Reports
├── Time Tracking
└── Workload

PEOPLE
├── Team
└── Skills

MANAGEMENT
├── Approvals
├── Activity / History
├── Handover
└── Administration

SYSTEM
├── Notifications
├── AI Assistant
├── My Profile
├── Settings
└── Knowledge Base
```

Navigation visibility should respect authorization where necessary.

---

# 158. SIDEBAR PRINCIPLE

Existing wireframes contain several different sidebar concepts.

Treat them as visual alternatives.

Do not combine every menu from every wireframe.

The final sidebar should be:

* predictable
* compact
* grouped
* responsive
* permission-aware
* consistent across modules

---

# 159. MOBILE NAVIGATION

Mobile should prioritize:

* Dashboard
* Tasks
* Calendar
* Notifications
* More

A prominent "+" action may be used for:

* Create Task
* Add Content
* New Project
* other authorized actions

Do not overload mobile navigation with every module.

---

# 160. QUICK ACTIONS

Quick actions should represent real frequent actions.

Potential actions:

* Create Task
* New Project
* Add Content
* Request QC
* Schedule Post
* Borrow Equipment
* Add KPI Entry
* Log Activity

Only show actions the current user is authorized to perform.

---

# 161. METRIC CARD RULE

Every metric must have:

* clear definition
* source record
* calculation logic
* time period
* access scope

Never display a metric simply because it looks useful.

Example:

```text
Overdue = records where official deadline < current time
AND
record is not completed/closed
```

The definition must be consistent across the system.

---

# 162. CHART RULE

A chart must support a decision.

For every chart ask:

> What would the user do differently after seeing this?

If the answer is nothing, consider removing the chart.

---

# 163. STATUS COLOR RULE

Colors communicate state consistently.

Suggested conceptual mapping:

```text
Success → completed / healthy
Warning → attention required
Error → blocked / overdue / critical
Info → informational
Neutral → draft / inactive
```

Do not use arbitrary colors per page.

---

# 164. NO FAKE PRECISION

Do not present:

* unsupported confidence scores
* fake percentages
* arbitrary health scores
* invented productivity scores
* invented forecasts

unless the calculation is explicitly defined.

---

# 165. PROJECT HEALTH

If project health is shown, it should be based on defined signals such as:

* schedule
* scope
* budget where applicable
* blockers
* overdue work

Avoid a manually invented "Good / At Risk" status with no underlying definition.

---

# 166. CONTENT PERFORMANCE

Performance metrics should clearly identify:

* platform
* measurement period
* metric type
* source
* last updated

Do not mix:

* reach
* views
* engagement
* engagement rate

into one unexplained number.

---

# 167. KPI PERFORMANCE

KPI progress should clearly identify:

```text
Target
Actual
Progress
Period
Status
Evidence
```

Do not call an individual a "top performer" merely because a demo wireframe ranked them.

Ranking is a business decision and requires explicit requirements.

---

# 168. TEAM PERFORMANCE

Do not create employee rankings by default.

The system may display:

* KPI progress
* task completion
* workload
* activity

as factual operational information.

Interpretive judgments should require defined organizational criteria.

---

# 169. WORKLOAD FAIRNESS

Workload metrics should be descriptive.

Example:

> 8 active tasks, 24 planned hours

is preferable to:

> Employee is underperforming.

The system records evidence; management makes judgments.

---

# 170. DATA ACCESS

Every query should consider:

```text
Who is the user?
What person record do they represent?
What roles do they have?
What permissions do they have?
What organizational scope applies?
What record are they accessing?
```

Do not assume all authenticated users can see all operational data.

---

# 171. RECORD OWNERSHIP

Ownership should be explicit.

Examples:

* project owner
* task assignee
* content owner
* KPI owner
* equipment borrower

Ownership does not automatically equal unrestricted editing permission.

---

# 172. REPORTING VS OWNERSHIP

These are separate concepts.

Example:

```text
Yana may supervise Arieza
```

does not automatically mean:

```text
Yana owns every record Arieza creates
```

Likewise:

```text
Project Owner
```

does not automatically mean:

```text
System Administrator
```

---

# 173. DEPARTMENT VS TEAM

Do not treat department, team, and reporting relationship as the same entity.

Conceptually:

```text
Department
    ↓
Organizational grouping

Team
    ↓
Operational grouping

Reporting Relationship
    ↓
Authority / supervision

Role
    ↓
Functional responsibility

Permission
    ↓
Allowed action
```

---

# 174. EMPLOYMENT STATUS

Employment information may include:

* active
* inactive
* intern
* staff
* executive
* management
* ended

Exact employment taxonomy should be configurable.

Do not hardcode a single company's HR assumptions into the core system.

---

# 175. PROJECT MEMBERSHIP

Project membership should be explicit.

Do not infer membership solely from:

* department
* reporting relationship
* task assignment

A person can be part of a project without currently owning a task.

---

# 176. TASK ASSIGNMENT

Task assignment should be explicit.

A task should retain:

* creator
* assigned person
* assignment time
* assignment history where relevant

Reassignment should preserve history.

---

# 177. COLLABORATION

Collaborators should be distinct from the primary assignee when the business workflow requires it.

Do not create multiple "owners" when one accountable owner is sufficient.

---

# 178. FILE EVIDENCE

Files should not be treated as the only evidence.

A completion record may contain:

* description
* link
* file
* notes
* people involved
* outcome

depending on task type.

---

# 179. ACTIVITY FEEDS

Activity feeds should be generated from actual events.

Examples:

```text
Project created
Task assigned
Task acknowledged
Task completed
Content submitted
QC approved
Equipment borrowed
Equipment returned
KPI updated
Person reporting relationship changed
```

Do not create fake activity solely to make a dashboard look populated.

---

# 180. SEARCHABLE HISTORY

The long-term value of KAGUM ONE depends heavily on retrievability.

Users should eventually be able to answer questions like:

> What did we do for this project last year?

> Who handled this task?

> What content was produced?

> What happened during the previous campaign?

> Why was the deadline changed?

> Who approved this?

> What equipment was used?

> What did the previous person hand over?

---

# 181. KNOWLEDGE RETENTION

Important knowledge should not exist only in:

* private WhatsApp messages
* someone's personal notebook
* memory
* verbal instructions

Where operationally appropriate, capture it in KAGUM ONE.

---

# 182. AI SEARCH REQUIREMENT

AI search should eventually retrieve authoritative records rather than rely only on a model's learned knowledge.

The AI should answer from:

```text
KAGUM ONE records
+
authorized files
+
knowledge base
```

not from fabricated assumptions.

---

# 183. AI SOURCE DISPLAY

Where AI summarizes operational information, sources should identify the records used.

Example:

```text
Sources
- Project PRJ-001
- Task TASK-104
- Activity record ACT-882
- File FILE-202
```

The exact UI can vary.

---

# 184. AI ACTION CONFIRMATION

For consequential action:

```text
AI:
"I suggest extending Task 104 to 25 September."

User:
[Approve Extension]
[Cancel]
```

The action should then go through normal authorization and business logic.

AI must not directly mutate the database.

---

# 185. NO HIDDEN AUTOMATION

Automation must be explicit.

Do not create hidden behavior such as:

> Opening a task automatically marks it acknowledged.

unless explicitly defined.

Important actions should be intentional and traceable.

---

# 186. NOTIFICATION AUTOMATION

System-generated notifications are allowed when tied to defined business events.

Examples:

```text
Task assigned → notification
Deadline approaching → notification
KPI changed → notification
QC requested → notification
Approval required → notification
```

These should be deterministic and testable.

---

# 187. DATE/TIME

Use a consistent timezone strategy.

Display dates according to organizational/user context.

Store timestamps in a consistent format.

Do not mix local and UTC timestamps without explicit conversion.

---

# 188. FILE STORAGE

File storage should eventually use object storage.

Database records should store metadata/reference rather than unnecessarily storing large binary data directly.

Access should be authorization-aware.

---

# 189. EXPORTS

Export formats may include:

* CSV
* XLSX
* PDF

Only implement formats that have an actual requirement.

---

# 190. VERSIONING

Versioning is important where users need to understand previous states.

Potentially version:

* content
* files
* knowledge articles
* KPI changes
* project information
* task deadlines
* approvals

Do not create versioning systems for every trivial field.

---

# 191. SOFT ARCHIVAL

Archived records should generally remain accessible to authorized users.

Examples:

* completed projects
* retired equipment
* former employees
* historical content
* old KPI periods

Archive should not mean "erase."

---

# 192. RECORD LIFECYCLE

Every major entity should have a meaningful lifecycle.

Examples:

```text
Project:
Planning → Active → Completed → Archived

Task:
Draft → Acknowledged → In Progress → Submitted → Completed

Content:
Benchmark → Planned → Production → QC → Approval → Published → Performance

Equipment:
Available → Borrowed → Returned / Maintenance / Retired
```

---

# 193. CONFIGURABILITY

Make these configurable when requirements justify it:

* statuses
* categories
* KPI periods
* equipment categories
* content pillars
* skill categories
* notification preferences
* workflow rules

Do not make everything configurable just because it can be.

Configuration itself creates complexity.

---

# 194. PRODUCT SIMPLICITY

KAGUM ONE should feel simpler than the operational environment it represents.

The underlying system may be complex.

The user's workflow should not be.

---

# 195. FINAL PRODUCT TEST

A successful KAGUM ONE implementation should allow a user to follow:

```text
Who?
  ↓
What work?
  ↓
For which project?
  ↓
Assigned by whom?
  ↓
When?
  ↓
What happened?
  ↓
What was submitted?
  ↓
Who reviewed it?
  ↓
Was it completed?
  ↓
What was the result?
  ↓
What happened next?
```

If the system cannot answer these questions for important operational work, it is not yet fulfilling its primary purpose.

---

# 196. MASTER PRINCIPLE

When uncertain between two implementation choices, prefer the option that:

1. preserves the authoritative record,
2. preserves accountability,
3. respects permissions,
4. preserves historical context,
5. connects to the existing workflow,
6. minimizes unnecessary complexity,
7. supports the user's actual decision/action,
8. can be tested,
9. can be maintained,
10. strengthens KAGUM ONE as an operational memory.

---

# 197. FINAL AGENT INSTRUCTION

You are not building a generic project-management SaaS.

You are building:

> **KAGUM ONE — the operational memory and management system for KAGUM Advance Group.**

Every feature should contribute to:

```text
ONE SYSTEM
      +
ONE SOURCE OF TRUTH
      +
ONE OPERATIONAL MEMORY
```

And every meaningful workflow should reinforce:

> **If work happens, it should leave a record.**

Build the system around the organization's real work.

Do not invent work merely to fill the system.

Do not replace human accountability.

Do not confuse a wireframe with a requirement.

Do not confuse a role with a permission.

Do not confuse a metric with a truth.

Do not confuse AI output with an authoritative record.

Do not sacrifice traceability for visual simplicity.

Do not sacrifice usability for unnecessary complexity.

Build the smallest system that can reliably capture, connect, trace, measure, and preserve real KAGUM work.

```
```
