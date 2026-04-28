# Requirements — v1

## Feature
Analyze uploaded PGN and generate a leak report with personalized puzzles.

## User story
As a chess player,
I want to upload a PGN containing my games,
so that I can understand my biggest weaknesses and train them with targeted puzzles.

## Inputs
- One PGN file containing one or more games.
- Optional username to identify which side belongs to the player.
- Optional target rating for puzzle difficulty calibration.

## Outputs
- Parsed game summary.
- Top 2–3 leaks.
- Evidence for each leak.
- 3–10 personalized puzzles where available.
- “Partial analysis” notice if evals/clocks are missing.

## Acceptance criteria

### AC1 — Upload and parse
- WHEN the user uploads a valid PGN file
- THEN the app parses games involving the selected player
- AND reports total games parsed and games skipped.

### AC2 — Summary statistics
- WHEN parsing completes
- THEN the app shows:
  - total games
  - win / loss / draw counts
  - time loss count when clock data exists
  - top openings and win rates

### AC3 — Leak detection
- WHEN analysis completes
- THEN the app identifies up to 3 leaks from:
  - time
  - tactics
  - opening
  - structure
  - endgame
- AND each leak includes a severity score and evidence.

### AC4 — Personalized puzzles
- GIVEN tactical mistakes are detected
- WHEN puzzle generation runs
- THEN the app creates puzzles from the player’s own positions when possible
- AND supplements with external puzzles only when needed.

### AC5 — Puzzle interaction
- WHEN a user attempts a puzzle
- THEN the app validates the move using a known solution or on-demand engine evaluation
- AND gives immediate feedback.

### AC6 — Persistence
- GIVEN the user is authenticated
- WHEN analysis completes
- THEN analysis results and puzzles are saved
- AND can be loaded again later.

## Non-functional requirements
- Must work on a modern desktop browser.
- Must not require a custom server for core v1 analysis.
- Must degrade gracefully when evals or move times are unavailable.
