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
