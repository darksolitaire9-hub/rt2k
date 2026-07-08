# Implementation Plan: Phase 9 (Persistence & History)

## Overview
rt2k's core analysis engine works beautifully, but the app suffers from amnesia. Puzzles and past runs are correctly stored in IndexedDB (`rt2k-puzzles`), but the UI only reads puzzles from the *currently active* analysis run. This implementation plan outlines how we will connect the UI to the global persistence layer, allowing the user to view their puzzle backlog across sessions, review past analyses on a "My Analyses" page, and clear their data via a Settings page.

## Architecture Decisions
- **Repository Pattern:** We will continue using `IndexedDbAnalysisRepositoryAdapter` as the sole source of truth for persistence. We will extend it with `getAllPuzzles()` and `clearAllData()`.
- **Global Puzzle Store:** `usePuzzles.ts` will be updated to fetch its state from the global puzzle store asynchronously, falling back to the live `result.value` if the store hasn't hydrated yet.
- **Stateless History:** The "My Analyses" page will read directly from the repository via `listByUser()`, keeping the in-memory state light.

## Task List

### Phase 1: Foundation (Ports & Adapters)
- [x] Task 1: Extend `IAnalysisRepositoryPort` with `getAllPuzzles()` and `clearAllData()`.
- [x] Task 2: Implement `getAllPuzzles()` and `clearAllData()` in `IndexedDbAnalysisRepositoryAdapter.ts`.

### Checkpoint: Foundation
- [x] `vitest run` passes.
- [x] No type errors in adapters.

### Phase 2: Core State (Composables)
- [x] Task 3: Update `usePuzzles.ts` to use `hydratePuzzles()`
- [x] Task 4: Update `useAnalysis.ts` to trigger puzzle hydration
- [x] Task 5: Implement `clearData()` in `useAnalysis.ts` triggers a puzzle hydration whenever an analysis completes or a puzzle is solved.
- [x] Task 5: Add a `clearData()` method to `useRepository.ts` or `useAnalysis.ts` that safely deletes IndexedDB and resets the UI state.

### Checkpoint: Core Features
- [ ] Running a second analysis does not wipe out the unsolved puzzles from the first analysis.

### Phase 3: UI & Pages
- [x] Task 6: Create `app/pages/analyses/index.vue` to list past analysis runs, showing the date, games analyzed, and top leaks.
- [x] Task 7: Create `app/pages/settings.vue` with a "Clear Local Data" danger zone button.
- [x] Task 8: Add navigation links in `app.vue` (or `layouts/default.vue`) to reach the new Analyses and Settings pages.

### Checkpoint: Complete
- [ ] End-to-end flow works: Upload PGN -> Generate Puzzles -> View Puzzles -> Upload another PGN -> View combined Puzzles.
- [ ] "My Analyses" page correctly lists both runs.
- [ ] "Clear Data" successfully resets the app to a pristine state.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Reactivity loss in `usePuzzles.ts` | High | We must ensure `allPuzzles` remains a Vue `Ref` or `Computed` that correctly updates when the IndexedDB store changes. |
| Memory bloat with too many global puzzles | Low | The max puzzle cap per run is currently 100. IndexedDB can easily handle thousands. |

## Open Questions
- Should the "My Analyses" page allow clicking into a past run to make it the "active" run again, or just display high-level stats? (We will start with just high-level stats for now to keep scope tight).
