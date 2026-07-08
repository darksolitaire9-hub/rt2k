## Task 1: Extend IAnalysisRepositoryPort

**Description:** Add methods to retrieve all puzzles and clear the database in the port interface so the adapters must implement them.

**Acceptance criteria:**
- [x] `getAllPuzzles(): Promise<UserPuzzle[]>` added to `IAnalysisRepositoryPort.ts`
- [x] `clearAllData(): Promise<void>` added to `IAnalysisRepositoryPort.ts`

**Verification:**
- [x] Type check passes once implemented in adapter

**Dependencies:** None

**Files likely touched:**
- `shared/domain/ports/IAnalysisRepositoryPort.ts`

**Estimated scope:** XS

---

## Task 2: Implement IndexedDB Adapter extensions

**Description:** Implement the new port methods using `idb-keyval` to fetch from `PUZZLES_KEY` and clear the DB.

**Acceptance criteria:**
- [x] `getAllPuzzles()` returns all puzzles from `rt2k-puzzles` as an array
- [x] `clearAllData()` calls `clear()` from `idb-keyval`

**Verification:**
- [x] `vitest run` passes for repository tests

**Dependencies:** Task 1

**Files likely touched:**
- `app/adapters/repository/IndexedDbAnalysisRepositoryAdapter.ts`
- `app/adapters/repository/IndexedDbAnalysisRepositoryAdapter.test.ts`

**Estimated scope:** S

---

## Task 3: Update usePuzzles.ts for global state

**Description:** Refactor `usePuzzles.ts` to manage a reactive array of all historical puzzles instead of relying strictly on the active analysis `result.value`.

**Acceptance criteria:**
- [x] `allPuzzles` is a `ref<UserPuzzle[]>`
- [x] `hydratePuzzles()` method fetches from repository and updates `allPuzzles`
- [x] `unsolvedPuzzles` and `activePuzzles` correctly derive from the new `allPuzzles` ref

**Verification:**
- [ ] UI Puzzles tab renders correctly without active analysis

**Dependencies:** Task 2

**Files likely touched:**
- `app/composables/usePuzzles.ts`

**Estimated scope:** M

---

## Task 4: Connect useAnalysis to Puzzles Hydration

**Description:** Ensure that when a new analysis completes, or the app initializes, the global puzzle list is hydrated.

**Acceptance criteria:**
- [ ] `useAnalysis.ts` calls `hydratePuzzles()` (or repository save triggers it) when `result` is saved
- [ ] `app.vue` or layout calls `hydratePuzzles()` on mount

**Verification:**
- [ ] New puzzles appear in the UI after a successful analysis

**Dependencies:** Task 3

**Files likely touched:**
- `app/composables/useAnalysis.ts`
- `app/composables/usePuzzles.ts`
- `app/app.vue`

**Estimated scope:** S

---

## Task 5: Implement Settings and Data Clearing

**Description:** Build the UI for settings and wire up the `clearAllData` method.

**Acceptance criteria:**
- [ ] `app/pages/settings.vue` exists with a "Clear Local Data" button
- [ ] Clicking the button calls `repo.clearAllData()` and resets `useAnalysis` and `usePuzzles` state
- [ ] Navigation link exists to reach Settings

**Verification:**
- [ ] Clicking clear removes all IndexedDB data and empties UI

**Dependencies:** Task 2

**Files likely touched:**
- `app/pages/settings.vue`
- `app/layouts/default.vue` (or wherever nav is)

**Estimated scope:** M

---

### Phase 3: Presentation & Navigation

#### Task 6: "My Analyses" Page
**Description:** Build the UI to display historical runs.

**Acceptance criteria:**
- [x] `app/pages/analyses/index.vue` created
- [x] Fetches `listByUser('local')` and displays list ordered by date descending

**Dependencies:** Task 2

#### Task 7: "Settings" Page
**Description:** Build the UI to expose the `clearData()` functionality.

**Acceptance criteria:**
- [x] `app/pages/settings.vue` created
- [x] Calls `useAnalysis().clearData()` and shows a confirmation toast

**Dependencies:** Task 5

#### Task 8: Header Navigation
**Description:** Update `app/layouts/default.vue`.

**Acceptance criteria:**
- [x] Link to `/analyses` added
- [x] Link to `/settings` added
