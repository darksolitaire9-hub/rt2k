# UI Todo List — rt2kv2
# Updated: 2026-04-30 after Phase 8 + spec-compliance pass

## Spec compliance

- [x] Opening breakdown card — collapsible UCard below leak cards on /analyze; table of top openings with name, games, win rate; worst row highlighted red
- [x] leakType badge on PuzzleListItem — UBadge with LEAK_LABELS
- [x] "Train this" → filter puzzles by leak type — passes ?type=<leakType> to /puzzles; index filters on arrival; "Clear filter" button to reset
- [x] Rating range + win rate % in AnalysisSummaryCard — both props computed in useAnalysis and displayed
- [x] Severity text label alongside UBadge score on LeakCard ("Minor/Moderate/Major leak")
- [ ] Evidence bullets on LeakCard — Leak.evidenceGameIds is a list of game IDs, not human-readable text; generating plain-language lines (e.g. "60% of losses are on time") requires domain-level evidence fields not yet present in the Leak entity — needs a domain change before UI can render them

## Polish

- [x] Text alongside numbers in summary — "You lost N games on time"
- [x] Semantic color tokens in AnalysisSummaryCard — replaced raw Tailwind with text-success, text-error, text-muted
- [x] Solved/unsolved tracking — solved?: boolean prop on PuzzleListItem; shows "Solved" badge + "Review" button label
- [ ] Puzzle source context — opponent name and date not in UserPuzzle; requires adding sourceOpponent and sourceDate to UserPuzzle entity (domain change) and threading from GameRecord through AnalyzePgnUseCase
- [ ] Active nav link styling — verify UButton ghost shows active route visually in the browser

## Accessibility

- [x] aria-live="polite" on PuzzleBoard feedback paragraph
- [x] role="button" + aria-label on file drop zone div in PgnUploadCard
- [x] Severity text label alongside UBadge on LeakCard

## Desktop layout (low priority, deferred)

- [ ] Two-column analyze page at md: breakpoint — upload left, stats right
- [ ] Side-by-side puzzle view at md: breakpoint — board left, controls + move list right

## Phase 9 — Persistence (not started)

- [ ] Set up Supabase Auth (required before AC6 can be satisfied)
- [ ] Apply Supabase schema
- [ ] Wire up SupabaseAnalysisRepositoryAdapter
- [ ] Build "My Analyses" page

## Deferred domain changes (needed before remaining UI items above)

- [ ] Add sourceOpponent: string and sourceDate: string to UserPuzzle entity + thread from GameRecord in BuildPuzzles
- [ ] Add evidence: string[] to Leak entity + generate plain-language lines in ScoreLeaks
