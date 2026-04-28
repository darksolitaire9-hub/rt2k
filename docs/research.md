# Research Notes

## Why this architecture
Spec-Driven Development provides the workflow:
- constitution → requirements → plan → tasks → code

DDD provides the domain language:
- GameRecord, MistakeRecord, Leak, UserPuzzle, AnalysisRun

Hexagonal Architecture keeps domain logic isolated from implementation details:
- ports in shared/domain/ports
- adapters in app/adapters

## AI tooling strategy
- Claude Code is the primary assistant for implementation.
- Gemini Flash is available as an optional explanation layer only —
  never as a substitute for engine analysis (see D-003).
- No AI tool writes a commit directly. Developer reviews every diff.

## Nuxt 4
- Uses the `app/` directory for application code.
- `shared/` is available for code shared between app and server.
- Maps naturally to DDD + Hex: `shared/domain`, `shared/application`,
  `app/adapters`, `app/components`.

## Engine strategy
- Prefer existing evals when present (Lichess PGN exports include eval comments).
- Use Stockfish WASM only for targeted positions where evals are absent.
- Do not design v1 around server-side engine analysis.

## Product strategy
- Diagnose first (leak detection).
- Prescribe second (puzzle generation).
- Puzzles enter the flow after leak detection, not before.
- Keep the core loop narrow: upload PGN → leak report → puzzles.
