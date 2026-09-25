# KAGUM ONE — agent notes

This is the operational system for KAGUM Advance Group. Master product rules are in `PROMPT_SYSTEM.md`. Implemented architecture is in `SYSTEM_ARCHITECTURE.md`.

Inspect schema, services, and existing pages before adding tables or duplicating logic.

Shared write path: session → permission → Zod → business rule → mutation → `recordActivity` / `recordAudit` / `notify`.

Do not hardcode organizational people. Do not treat role name as permission. Do not invent metrics.
