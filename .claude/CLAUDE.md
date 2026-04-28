# rt2k — Claude Instructions

## On session start
Before doing anything else, read: .claude/rules/context.md
This pulls in all project documentation automatically.

---

## SDD Workflow (mandatory)
Before writing any code, verify all three conditions:
1. A requirement or acceptance criterion exists in docs/requirements.md
2. The task is listed and unchecked in docs/tasks.md
3. Any architecture or stack change has a decision entry in docs/decisions.md

If any condition is missing → write the spec first, then the code.
Never skip to implementation.

---

## Active work rules
- Check docs/tasks.md for the next unchecked task.
- Work one task per branch.
- Branch naming:
  - feat/<short-description>
  - fix/<short-description>
  - chore/<description>
  - docs/<description>
  - refactor/<description>
- Mark the task as done in docs/tasks.md only after implementation is complete and reviewed.
- Never commit directly — present the diff for review first.

---

## Domain language (strict)
Use only the canonical terms from docs/glossary.md:
  GameRecord · MistakeRecord · Leak · UserPuzzle · AnalysisRun

Never invent synonyms, abbreviations, or alternate names.
Full field-level definitions: docs/data-model.md

---

## Architecture boundary (non-negotiable)
Full rules: .claude/rules/architecture.md

Short version:
- shared/domain/ must never import Vue, Supabase, chessground, or any browser API.
- All external systems live behind ports in shared/domain/ports.
- Adapters implement ports. Ports do not know about adapters.

---

## Quality rules
- Types before logic.
- Ports before adapters.
- All scoring thresholds and config values → shared/domain/config/leakRules.ts only.
- Always surface "partial analysis" explicitly when evals or clocks are missing.
- One task at a time. Do not touch files outside the current task scope.
- Keep v1 narrow: upload PGN → leak report → puzzles. No scope creep.

---

## UI rules
- Mobile-first: design for 360–400px wide screens first.
- Use Nuxt UI components (UCard, UButton, UBadge, UAlert, UTabs) wherever possible.
- No hover-only interactions.
- Full rules and screen specs: docs/ui.md

---

## On planning a new feature
Use the sdd-plan skill. Do not write code until:
1. Requirement drafted and confirmed
2. Decision entry added (if architecture changes)
3. Tasks added to docs/tasks.md and confirmed

## Preferred skills for this project
When appropriate:

- Use Superpowers for planning, TDD, and review of non-trivial tasks.
- Use Frontend Design when creating or refactoring UI layouts or components.
- Use web-design-guidelines to audit UI for accessibility and UX issues.
- Use Trail of Bits security skills when touching auth, Supabase, or external APIs.
