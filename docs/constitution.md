# Constitution — rt2k

## Mission
Help chess players improve by analyzing their games, detecting repeated leaks,
and prescribing personalized puzzles grounded in their own mistakes.

## Project principles
- Free-first: no paid infrastructure until the product has traction.
- Data-driven: all recommendations must be traceable to measurable game data.
- Explainable: each reported leak must include evidence from real games.
- Browser-first: heavy compute runs in the browser when feasible.
- Architecture-first: preserve domain purity using DDD and Hexagonal Architecture.
- Spec-first: implementation follows written specs, plans, and task lists.

## AI tooling
- Claude Code is the primary AI coding assistant.
- All Claude interactions follow the SDD workflow: spec confirmed before code written.
- One task per branch. Claude works only on the current unchecked task in docs/tasks.md.

## SDD workflow order
1. Constitution → defines mission, principles, constraints
2. Requirements → defines user stories and acceptance criteria
3. Plan → defines phases and code organization
4. Tasks → defines atomic work items per phase
5. Code → only after the above are in place

## Architecture
- Frontend: Nuxt 4 with app/ directory.
- Persistence/Auth: Supabase.
- PGN/FEN parsing: chess.js.
- Board UI: chessground.
- Engine: Stockfish WASM for targeted, on-demand evaluation only.
- Optional explanation layer: Gemini Flash, never as a substitute for engine analysis.

## Domain boundaries
Domain code must stay framework-agnostic:
- No Vue imports in domain.
- No Supabase imports in domain.
- No DOM/browser APIs in domain services.
- Domain owns the language and the contracts (ports).

## Ubiquitous language
- GameRecord
- MistakeRecord
- Leak
- UserPuzzle
- AnalysisRun

## Hexagonal boundaries
Primary adapters:
- Nuxt pages/components/composables

Secondary adapters:
- chess.js PGN parser
- Stockfish WASM engine
- Supabase repository
- Lichess import adapter (later)

Ports live in shared/domain/ports.
Adapters implement ports in app/adapters.

## Quality rules
- All thresholds must live in one config file.
- Partial analysis must be surfaced explicitly when evals or clocks are missing.
- One task at a time. No scope creep.
- Types before logic.
- Ports before adapters.
- Keep v1 narrow: upload PGN → leak report → puzzles.

## Out of scope for v1
- No Lichess OAuth.
- No server-side engine.
- No deep full-history engine analysis for every user upload.
- No "coach chat" as a core feature.
