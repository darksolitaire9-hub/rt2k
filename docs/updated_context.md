# rt2k — Core Spec for Claude Code

## What This Product Does

A player uploads their PGN export from Lichess.
The app analyzes their own games, detects where they repeatedly leak points,
and serves them puzzles built from those exact positions.

No external puzzle DB. No hardcoded player assumptions.
Everything is derived from the uploaded file.

---

## Core Product Principle

**Puzzles must come exclusively from the player's own game history.**

A `UserPuzzle` is always a real position the player reached in one of their
own games. The puzzle board replays that exact FEN.
The player's patterns are discovered fresh on every upload — nothing is
assumed in advance.

---

## Pipeline (v1)

```

PGN upload
→ IPgnParserPort         (chess.js) → GameRecord[]
→ ComputeTrend           → TrendReport (rating delta, win rate, flag rate)
→ DetectMistakes         (heuristics only, no engine) → CandidatePosition[]
→ IEnginePort            (Stockfish WASM, per-FEN on-demand) → confirmed solution
→ BuildPuzzles           → UserPuzzle[]
→ ScoreLeaks             → Leak[] (grouped patterns across games)
→ UI                     leak report + puzzle board

```

---

## Trend Detection (no engine)

Before detecting mistakes, compute the player's recent trend from the
GameRecord[] to understand context:

```ts
interface TrendReport {
  recentRatingDelta: number     // last 50 games: final elo - starting elo
  recentWinRate: number         // last 50 games win %
  flagRate: number              // % of all games lost on time
  dominantTermination: 'Time forfeit' | 'Normal' | 'mixed'
}
```

`TrendReport` feeds into `ScoreLeaks` to weight leak severity.
A player with high `flagRate` gets `FLAG_RISK` leaks ranked first.
A player with low `flagRate` gets tactical/positional leaks ranked first.
The ranking adapts to whoever uploaded.

---

## Candidate Detection (no engine)

Heuristics to flag mistake positions cheaply before any engine call.
Applied to every game in the upload:

1. **Clock heuristic** — `[%clk]` is present on every Lichess PGN move.
Flag positions where clock < `minClockFlagThresholdSeconds` AND game
ended as Time forfeit.
2. **Pre-flag position** — extract the position `preFlagLookbackMoves`
moves before time ran out in a losing Time forfeit game.
3. **Material swing** — compare piece counts between move N and N+2 via
FEN parsing. Flag if material delta ≥ `materialSwingPawnUnits`.
4. **Sudden resignation** — game ended Normal with fewer than
`earlyResignationMaxMoves` moves. Flag the last position.

Engine is called **only** on flagged candidates (max `maxCandidatesPerGame`
per game). Never sweep the full game with the engine.

---

## Domain Entities

- `GameRecord` — one parsed game: `gameId`, `pgn`, `result`, `color`,
`timeControl`, `termination`, `clockPerMove[]`, `opening`, `eco`
- `MistakeRecord` — flagged candidate: `fen`, `moveNumber`,
`clockAtMoment`, `heuristicReason`, `engineEval?`
- `UserPuzzle` — confirmed puzzle: `fen`, `solution`, `sourceGameId`,
`moveNumber`, `clockAtMoment`, `leakType`
- `Leak` — grouped pattern: `leakType`, `frequency`, `exampleGameIds[]`
- `AnalysisRun` — one run: `gameCount`, `mistakeCount`, `puzzles[]`,
`leaks[]`, `isPartial`, `trendReport`

---

## LeakType (value object)

```ts
type LeakType =
  | 'FLAG_RISK'           // lost on time, clock heuristic triggered
  | 'PRE_FLAG_BLUNDER'    // material lost in final moves before flagging
  | 'TACTICAL_MISS'       // material swing mid-game
  | 'EARLY_RESIGNATION'   // resigned early, possible missed defense
```

New leak types can be added in `leakRules` without touching domain logic.

---

## Ports

```ts
// IPgnParserPort     — parses PGN, exposes clockPerMove[] from [%clk]
// IEnginePort        — evaluates a single FEN, returns bestMove + eval
// IAnalysisRepositoryPort — persists AnalysisRun, UserPuzzle[], Leak[] via IndexedDB
```


---

## leakRules Config (single file, all thresholds live here)

```ts
export const leakRules = {
  minClockFlagThresholdSeconds: 10,
  preFlagLookbackMoves: 7,
  materialSwingPawnUnits: 1.5,
  earlyResignationMaxMoves: 30,
  maxCandidatesPerGame: 15,
  maxGamesPerAnalysisRun: 100,   // scale guard — excess games deferred
  minGamesForLeakPattern: 5,     // min occurrences to surface as a Leak
  trendWindowGames: 50,          // window for TrendReport calculation
}
```

All values are tunable. No threshold lives anywhere else.

---

## Architecture Constraints

- Stockfish WASM **must** run inside a Web Worker. The adapter owns the
worker lifecycle. The UI thread must never block.
- `clockPerMove[]` is required — not optional. If absent from the PGN,
clock-based heuristics are skipped and `isPartial: true` is set.
- PGN move comments (e.g. `{ B01 Scandinavian Defense }`) must be stripped
by the parser before FEN extraction.
- `AnalysisRun.isPartial = true` if games exceed `maxGamesPerAnalysisRun`
or if clock data is missing. Always surface this in the UI.
- Domain code stays framework-agnostic: no Vue, no browser repository
imports, no DOM in domain services.
- Data never leaves the browser. Persistence is entirely local.

---

## What Was Removed from v1

| Removed | Reason |
| :-- | :-- |
| `LocalPuzzleSourceAdapter` | No external puzzle DB needed |
| `IPuzzleSourcePort` | Puzzles sourced from player's own games |
| Full-game Stockfish sweep | Replaced by heuristic pre-filter |
| ECO-based puzzle filtering | Replaced by position-level sourcing |
| Hardcoded player assumptions | Everything derived from the upload |
| Supabase Integration | Pivoted to local-only for v1 |


---

## Pending Work (Phase 9 onwards)

1. Remove `IPuzzleSourcePort` and `LocalPuzzleSourceAdapter` (DONE)
2. Add `clockPerMove[]` to `GameRecord` (DONE)
3. Add `FLAG_RISK`, `PRE_FLAG_BLUNDER` to `LeakType` (DONE)
4. Add `isPartial` and `trendReport` to `AnalysisRun` (DONE)
5. Add `ComputeTrend` domain service (DONE)
6. Update `DetectMistakes` to use clock + material heuristics (DONE)
7. Update `leakRules` config with thresholds above (DONE)
8. Update `ScoreLeaks` to rank leaks using `TrendReport` (DONE)

Phase 9:

- [x] Implement IndexedDB repository
- [ ] Build "My Analyses" page
- [ ] Finalize local storage for puzzles
- [ ] Clear local data button in settings

---

## SDD Workflow Reminder

Spec (this doc) → confirm with human → code.
One task at a time. No scope creep.
