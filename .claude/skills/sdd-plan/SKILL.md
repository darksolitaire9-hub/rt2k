---
name: sdd-plan
description: >
  Use when the user asks to plan, add, or design a new feature, phase,
  or capability for rt2k. Activates the SDD planning loop.
---

# SDD Planning Flow

When this skill activates, follow these steps in order.
Do NOT write any implementation code until all steps are approved.

## Step 1 — Requirement
Draft a requirement block containing:
- User story: "As a <user>, I want <action>, so that <outcome>."
- Acceptance criteria (AC1, AC2, ...) in WHEN/THEN format.

Present to user and wait for approval before continuing.

## Step 2 — Decision (if needed)
If the feature requires:
- A new library or external service
- A change to the hexagonal boundary
- A new adapter or port
- A change to v1 scope

Then draft a new D-00X entry for docs/decisions.md with:
- Status: Proposed
- Reasoning
- Implications

Present to user and wait for approval before continuing.

## Step 3 — Tasks
Break the feature into atomic tasks.
Each task must:
- Be completable in one focused coding session
- Map to one branch (feat/<description>)
- Have a clear done condition

Add tasks to docs/tasks.md under a new phase heading.
Present the full task list to user and wait for approval.

## Step 4 — Implementation
Only after Steps 1–3 are approved:
- Identify the first unchecked task
- Propose the branch name
- Begin implementation following CLAUDE.md rules
