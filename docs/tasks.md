# Tasks — v1

## Phase 1 — Foundation
- [x] Create shared/domain folder structure
- [x] Create shared/application folder structure
- [x] Create app/adapters folder structure
- [x] Add leakRules config file

## Phase 2 — Domain entities
- [x] Define GameRecord
- [x] Define MistakeRecord
- [x] Define Leak
- [x] Define UserPuzzle
- [x] Define AnalysisRun

## Phase 3 — Value objects
- [x] Define GameResult
- [x] Define LeakType
- [x] Define Phase
- [x] Define TerminationType

## Phase 4 — Ports
- [x] Define IPgnParserPort
- [x] Define IEnginePort
- [x] Define IPuzzleSourcePort
- [x] Define IAnalysisRepositoryPort

## Phase 5 — Domain services
- [x] Implement AnalyzeGames service
- [x] Implement DetectMistakes service
- [x] Implement ScoreLeaks service
- [x] Implement BuildPuzzles service

## Phase 6 — Adapters
- [x] Implement ChessJsPgnParserAdapter
- [x] Implement StockfishWasmAdapter
- [x] Implement SupabaseAnalysisRepositoryAdapter
- [x] Implement LocalPuzzleSourceAdapter

## Phase 7 — UI
- [x] Build analyze page
- [x] Build PGN upload component
- [x] Build analysis summary component
- [x] Build leak card component
- [x] Build puzzle board component
- [x] Build puzzle list component

## Phase 8 — UI Polish
- [x] Add CSS foundation (main.css with Tailwind v4 + Nuxt UI imports)
- [x] Add root route redirect (/ → /analyze)
- [x] Add navigation layout (default.vue with header nav)

## Phase 8.5 — Spec Alignment (updated_context.md)
- [x] Remove IPuzzleSourcePort and LocalPuzzleSourceAdapter
- [x] Add clockPerMove[] to GameRecord
- [x] Replace LeakType with FLAG_RISK | PRE_FLAG_BLUNDER | TACTICAL_MISS | EARLY_RESIGNATION
- [x] Add isPartial and trendReport to AnalysisRun
- [x] Add ComputeTrend domain service
- [x] Rewrite DetectMistakes — clock and material heuristics, no engine calls
- [x] Update leakRules config with new thresholds
- [x] Update ScoreLeaks to rank leaks using TrendReport

## Phase 8.6 — Analysis Speed & UX
- [x] Tiered engine depths per leak type + reduce MAX_EVALS cap
- [x] Drop serial eval chunking — let worker pool queue manage concurrency
- [x] Auto-detect player username from PGN headers in PgnUploadCard
- [x] Add backgroundRunning state + progress to useAnalysis
- [x] Background analysis indicator and puzzle count on analyze page
- [x] Align AI instructions and documentation with refined project guidelines

## Phase 9 — Persistence
- [ ] Set up Supabase Auth (required before AC6)
- [ ] Apply Supabase schema
- [ ] Create repository implementation
- [ ] Build "My Analyses" page
