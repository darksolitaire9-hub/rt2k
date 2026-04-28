# Plan — v1

## Goal
Ship a browser-first PGN analysis flow in Nuxt 4 that produces:
- summary stats,
- top leaks,
- a small puzzle set.

## Architecture plan
Use:
- Spec-Driven Development for workflow
- Domain-Driven Design for language/modeling
- Hexagonal Architecture for boundaries

## Code organization

### Domain
shared/domain/
- entities
- value-objects
- ports
- services
- config

### Application
shared/application/
- use-cases
- dto

### Adapters
app/adapters/
- pgn
- engine
- repository
- puzzles

### UI
app/pages/
app/components/
app/composables/

## Milestone 1 — Foundation
- Create domain entities and value objects.
- Create domain ports.
- Create centralized leak rules config.
- Establish docs and architectural vocabulary.

## Milestone 2 — PGN analysis
- Implement PGN parsing adapter with chess.js.
- Build GameRecord and MistakeRecord generation.
- Implement leak scoring.
- Render a report page.

## Milestone 3 — Puzzle generation
- Integrate Stockfish WASM via plugin and adapter.
- Generate puzzles from MistakeRecords.
- Build puzzle UI and validation flow.

## Milestone 4 — Persistence
- Add Supabase schema and repository adapter.
- Save/load analyses and puzzles.
- Build “My Analyses” page.

## Validation strategy
- First validate with a known PGN file and expected game counts.
- Validate that top leak output is deterministic for the same PGN.
- Validate puzzle extraction on a small sample before bulk use.
