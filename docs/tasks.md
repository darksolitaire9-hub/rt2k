# Tasks — v1

## Phase 1 — Foundation
- [x] Create shared/domain folder structure
- [x] Create shared/application folder structure
- [x] Create app/adapters folder structure
- [x] Add leakRules config file

## Phase 2 — Domain entities
- [x] Define GameRecord
- [x] Define MistakeRecord
- [ ] Define Leak
- [ ] Define UserPuzzle
- [ ] Define AnalysisRun

## Phase 3 — Value objects
- [ ] Define GameResult
- [ ] Define LeakType
- [ ] Define Phase
- [ ] Define TerminationType

## Phase 4 — Ports
- [ ] Define IPgnParserPort
- [ ] Define IEnginePort
- [ ] Define IPuzzleSourcePort
- [ ] Define IAnalysisRepositoryPort

## Phase 5 — Domain services
- [ ] Implement AnalyzeGames service
- [ ] Implement DetectMistakes service
- [ ] Implement ScoreLeaks service
- [ ] Implement BuildPuzzles service

## Phase 6 — Adapters
- [ ] Implement ChessJsPgnParserAdapter
- [ ] Implement StockfishWasmAdapter
- [ ] Implement SupabaseAnalysisRepositoryAdapter
- [ ] Implement LocalPuzzleSourceAdapter

## Phase 7 — UI
- [ ] Build analyze page
- [ ] Build PGN upload component
- [ ] Build analysis summary component
- [ ] Build leak card component
- [ ] Build puzzle board component
- [ ] Build puzzle list component

## Phase 8 — Persistence
- [ ] Apply Supabase schema
- [ ] Create repository implementation
- [ ] Build "My Analyses" page
