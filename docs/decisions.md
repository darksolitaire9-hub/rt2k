# Decisions Log

This file records important architectural and product decisions for rt2k.
Each decision should be stable over time and explain the trade-offs.

---

## D-001 — Use Nuxt 4 instead of Nuxt 3

**Status:** Accepted

**Reasoning:**
- Aligns with current Nuxt roadmap and support window.
- Nuxt 4 `app/` + `shared/` layout maps cleanly to our DDD + Hex structure:
  - `app/` for adapters and UI.
  - `shared/` for domain and application layers.
- Better TypeScript and DX for Windows/Nushell workflow.

---

## D-002 — Use Supabase for persistence and auth

**Status:** Accepted

**Reasoning:**
- Free tier (50k MAU, 500MB DB) is sufficient for early traction without cost.
- First-class Nuxt integration via `@nuxtjs/supabase`.
- Managed Postgres with row-level security fits clean separation between
  domain and infrastructure.

---

## D-003 — Use Stockfish WASM for targeted evaluation only

**Status:** Accepted

**Reasoning:**
- Engine is the primary constraint (CPU, latency, complexity).
- Browser-side WASM is proven for single-position / short-depth evals.
- We avoid building and running a server-side engine cluster in v1.
- We rely on:
  - Existing evals from Lichess exports where available.
  - Targeted WASM calls for a small number of positions per analysis.

**Implications:**
- v1 does not guarantee deep engine analysis for every move of every game.
- Some analyses will be "partial" and must be labeled as such in the UI.

---

## D-004 — Adopt SDD + DDD + Hexagonal Architecture

**Status:** Accepted

**Reasoning:**
- Spec-Driven Development (SDD) provides the workflow:
  - Constitution → Requirements → Plan → Tasks.
- Domain-Driven Design (DDD) provides a shared language:
  - GameRecord, MistakeRecord, Leak, UserPuzzle, AnalysisRun.
- Hexagonal Architecture (Ports & Adapters) keeps the domain isolated from tech:
  - Ports in `shared/domain/ports`.
  - Adapters in `app/adapters/*`.

**Implications:**
- Domain services cannot import Vue, Supabase, or browser APIs.
- All external systems (Supabase, chess.js, Stockfish, Lichess) sit behind ports.

---

## D-005 — Use Nuxt UI and mobile-first responsive design

**Status:** Accepted

**Reasoning:**
- Target users will often open the app on their phone after playing online,
  so mobile usability is a first-class requirement, not an afterthought.
- Nuxt UI provides accessible, composable components aligned with the Nuxt
  ecosystem, reducing design and implementation time for layouts, forms, tables,
  cards, and dialogs.
- A mobile-first layout ensures key flows (upload PGN, view leak report,
  solve puzzles) are usable on small screens.

**Principles:**
- Design from a narrow viewport first (360–400px), then enhance for desktop.
- Critical flows must work on mobile with single-column layout, large tap
  targets, and readable typography.

**Implications:**
- CSS and layout decisions must be tested on both mobile and desktop.
- Any complex visualization must degrade gracefully for small screens.
- Avoid UI patterns that depend on hover-only interactions.

---

## D-006 — Keep v1 browser-only (no custom server)

**Status:** Accepted

**Reasoning:**
- Free-first constraint: no always-on server costs.
- Nuxt 4 + Supabase + WASM is sufficient for PGN parsing, local analysis,
  leak detection, and persistence.
- Nitro server routes are reserved for future features only.

**Implications:**
- All analysis logic for v1 runs client-side.
- Supabase is used only via its client SDK.
- Any future server-side feature requires a new decision entry.

---

## D-007 — Use Claude Code as primary AI coding assistant

**Status:** Accepted

**Reasoning:**
- Claude Code integrates directly into the SDD workflow via CLAUDE.md and
  `.claude/rules/` — allowing architecture rules to be enforced at the
  assistant level, not just in code review.
- Claude Code's Plan Mode forces reasoning before writing, which aligns with
  the spec-first principle.
- Project-level skills (`.claude/skills/sdd-plan/`) enforce the
  Constitution → Requirements → Tasks → Code order automatically.

**Implications:**
- All Claude sessions start in Plan Mode for new features.
- Claude works one task per branch, mirroring the SDD task loop.
- Claude never commits directly — developer reviews diff before every commit.

---

## D-008 — IPgnParserPort returns ParsedGame[] instead of GameRecord[]

**Status:** Accepted

**Reasoning:**
- `DetectMistakes` needs move-level data (FEN, SAN, evals, clock) that `GameRecord` does not carry.
- The PGN is parsed exactly once by chess.js; splitting the return into two calls or two ports would either parse twice or couple two adapters to shared state.
- Functional programming principle "parse, don't validate": cross the external boundary once and surface the richest possible typed structure. Downstream services take what they need from that structure.
- "Make illegal states unrepresentable": `detectMistakes(GameRecord[], engine)` is a type lie — `GameRecord` has no move data. `detectMistakes(ParsedGame[], engine)` is the honest contract.

**What changed:**
- New aggregate `ParsedGame { record: GameRecord, moves: ParsedMove[] }` in `shared/domain/entities/ParsedGame.ts`.
- `IPgnParserPort.parse()` now returns `ParsedGame[]`.
- `analyzeGames` service updated to return `ParsedGame[]`.

**Implications:**
- Adapters implementing `IPgnParserPort` must return both game metadata and move data in one call.
- Services that only need game metadata extract `.record` from each `ParsedGame`.
- `DetectMistakes` receives `ParsedGame[]` and uses `.moves` to detect eval-swing mistakes.

---

## D-009 — IEnginePort.evaluate() returns { score, bestMove } instead of number

**Status:** Accepted

**Reasoning:**
- `MistakeRecord.bestMove` is a required non-nullable string. It must come from somewhere.
- Stockfish computes both the eval score and the principal variation (best move) in a single search. Returning only the score and requiring a second call for the best move would double engine calls per position at no benefit.
- Returning `{ score: number; bestMove: string }` is the honest contract: one call, one result, all data the domain needs.

**What changed:**
- `IEnginePort.evaluate()` now returns `Promise<{ score: number; bestMove: string }>`.
- A named `EngineResult` type is exported alongside the port interface.

**Implications:**
- `DetectMistakes` calls `engine.evaluate(fenBefore, depth)` once per flagged position and reads `.bestMove` directly.
- `StockfishWasmAdapter` must return both fields from its UCI response.
