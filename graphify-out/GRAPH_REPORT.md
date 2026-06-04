# Graph Report - rt2kv2  (2026-06-04)

## Corpus Check
- 94 files · ~26,165 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 479 nodes · 723 edges · 46 communities (42 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4ee633d8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 30|Community 30]]

## God Nodes (most connected - your core abstractions)
1. `IndexedDbAnalysisRepositoryAdapter` - 17 edges
2. `GameRecord` - 15 edges
3. `LeakType` - 15 edges
4. `rt2k — Core Spec for Claude Code` - 14 edges
5. `AnalysisRun` - 12 edges
6. `UserPuzzle` - 12 edges
7. `Tasks — v1` - 12 edges
8. `analyzePgn()` - 11 edges
9. `Leak` - 11 edges
10. `ParsedGame` - 11 edges

## Surprising Connections (you probably didn't know these)
- `getOrComputeBurst()` --calls--> `analyzePgn()`  [INFERRED]
  app/workers/analysis.worker.ts → shared/application/use-cases/AnalyzePgnUseCase.ts
- `runTier()` --calls--> `analyzePgn()`  [INFERRED]
  app/workers/analysis.worker.ts → shared/application/use-cases/AnalyzePgnUseCase.ts
- `initBoard()` --calls--> `chessground`  [INFERRED]
  app/components/PuzzleBoard.vue → package.json
- `IndexedDbAnalysisRepositoryAdapter` --implements--> `IAnalysisRepositoryPort`  [EXTRACTED]
  app/adapters/repository/IndexedDbAnalysisRepositoryAdapter.ts → shared/domain/ports/IAnalysisRepositoryPort.ts
- `StockfishWasmAdapter` --implements--> `IEnginePort`  [EXTRACTED]
  app/adapters/engine/StockfishWasmAdapter.ts → shared/domain/ports/IEnginePort.ts

## Import Cycles
- None detected.

## Communities (46 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (32): snapshot, LEAK_WEIGHTS, AnalysisRun, GameRecord, Leak, MistakeRecord, TrendReport, UserPuzzle (+24 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (37): initBoard(), reset(), dependencies, chessground, chessops, idb-keyval, nuxt, @nuxt/ui (+29 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (16): ParsedGame, ParsedMove, ChessopsPgnParserAdapter, computeConversionFail(), computeOpeningFail(), mapResult(), mapTermination(), parseClkFromComments() (+8 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (35): addBurstProgressCallback(), analyzeQueue, AnalyzeTask, burstCache, burstProgressCallbacks, cancelledIds, cancelRequest(), engine (+27 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (18): Color and states, Design principles, Desktop layout, Desktop layout, Desktop layout, Libraries, Mobile layout, Mobile layout (+10 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (9): QueueItem, StockfishEngine, StockfishWasmAdapter, makeDefaultEngine(), makeMockEngine(), MessageHandler, EngineResult, EvalOptions (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.16
Nodes (11): EngineEvaluatorPort, EvalRequest, EvalResult, createStockfishPool(), Slot, StockfishPool, StockfishPoolOptions, Task (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.16
Nodes (10): backgroundProgress, backgroundRunning, error, handleMessage(), loading, progress, result, useAnalysis() (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (14): Architecture Constraints, Candidate Detection (no engine), Core Product Principle, Domain Entities, leakRules Config (single file, all thresholds live here), LeakType (value object), Pending Work (Phase 9 onwards), Pipeline (v1) (+6 more)

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (13): Adapters, Application, Architecture plan, Code organization, Domain, Goal, Milestone 1 — Foundation, Milestone 2 — PGN analysis (+5 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (13): AC1 — Upload and parse, AC2 — Summary statistics, AC3 — Leak detection, AC4 — Personalized puzzles, AC5 — Puzzle interaction, AC6 — Persistence, Acceptance criteria, Feature (+5 more)

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (12): Phase 1 — Foundation, Phase 2 — Domain entities, Phase 3 — Value objects, Phase 4 — Ports, Phase 5 — Domain services, Phase 6 — Adapters, Phase 7 — UI, Phase 8.5 — Spec Alignment (updated_context.md) (+4 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (12): compilerOptions, baseUrl, lib, module, moduleResolution, noEmit, paths, skipLibCheck (+4 more)

### Community 14 - "Community 14"
Cohesion: 0.17
Nodes (11): AI tooling, Architecture, Constitution — rt2k, Domain boundaries, Hexagonal boundaries, Mission, Out of scope for v1, Project principles (+3 more)

### Community 15 - "Community 15"
Cohesion: 0.17
Nodes (11): Adapter, AnalysisRun, GameRecord, Glossary, Leak, LeakType, MistakeRecord, Phase (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.17
Nodes (11): AI collaborators, Architecture, Design & Architecture, Getting started (local dev), License, Preview, rt2k, Security & privacy (+3 more)

### Community 17 - "Community 17"
Cohesion: 0.18
Nodes (10): D-001 — Use Nuxt 4 instead of Nuxt 3, D-002 — Use IndexedDB for local-only persistence, D-003 — Use Stockfish WASM for targeted evaluation only, D-004 — Adopt SDD + DDD + Hexagonal Architecture, D-005 — Use Nuxt UI and mobile-first responsive design, D-006 — Keep v1 browser-only (no custom server), D-007 — Use Claude Code as primary AI coding assistant, D-008 — IPgnParserPort returns ParsedGame[] instead of GameRecord[] (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.18
Nodes (10): Branch lifecycle, Branch strategy, Bugfix branches, Chore / docs / refactor branches, Claude Code safety rules, Commit message convention, Feature branches, Git & Branching Conventions — rt2k (+2 more)

### Community 19 - "Community 19"
Cohesion: 0.22
Nodes (8): Accessibility, Deferred domain changes (needed before remaining UI items above), Desktop layout (low priority, deferred), Phase 9 — Persistence (not started), Polish, Spec compliance, UI Todo List — rt2kv2, Updated: 2026-04-30 after Phase 8 + spec-compliance pass

### Community 20 - "Community 20"
Cohesion: 0.25
Nodes (7): Claude Code kickoff, First implementation steps, First validation, Objective, Prerequisites, Quickstart, Setup

### Community 21 - "Community 21"
Cohesion: 0.29
Nodes (6): AnalysisRun, Data Model, GameRecord, Leak, MistakeRecord, UserPuzzle

### Community 22 - "Community 22"
Cohesion: 0.29
Nodes (6): AI tooling strategy, Engine strategy, Nuxt 4, Product strategy, Research Notes, Why this architecture

### Community 23 - "Community 23"
Cohesion: 0.29
Nodes (6): 1. Performance & Stability Improvements (The "Big Part"), 2. "Burst Mode" Logic (Instant Puzzles), 3. UI & UX Refinement, 4. Known Status, 5. Next Steps Proposed, Session Summary — Analysis Optimization & UX Polish

### Community 24 - "Community 24"
Cohesion: 0.48
Nodes (4): c(), f(), i(), l()

### Community 25 - "Community 25"
Cohesion: 0.40
Nodes (3): currentIndex, nextId, prevId

### Community 26 - "Community 26"
Cohesion: 0.40
Nodes (4): compilerOptions, skipLibCheck, exclude, extends

## Knowledge Gaps
- **221 isolated node(s):** `name`, `version`, `license`, `private`, `type` (+216 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `IndexedDbAnalysisRepositoryAdapter` connect `Community 11` to `Community 0`, `Community 7`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `GameRecord` connect `Community 0` to `Community 2`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `analyzePgn()` connect `Community 0` to `Community 2`, `Community 3`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `name`, `version`, `license` to the rest of the system?**
  _221 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08413461538461539 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.12179487179487179 - nodes in this community are weakly interconnected._