# Glossary

## GameRecord
A single analyzed game with metadata, result, opening, time control, and
summary flags. Normalized form of a raw PGN game entry.

## MistakeRecord
A specific move or position where the player likely made a meaningful mistake,
captured with the position (FEN), played move, best move, and eval swing.

## Leak
A repeated weakness pattern derived from many MistakeRecords or GameRecords.
Includes a severity score, title, description, and evidence game IDs.

## UserPuzzle
A training item assigned to a user, ideally derived from their own games.
May also be sourced externally when own-game positions are insufficient.

## AnalysisRun
One complete execution of the analysis pipeline on one uploaded PGN or
imported game set. Tracks source type, game count, and creation time.

## Phase
The stage of the game where an issue occurred:
- opening
- middlegame
- endgame

## Termination
How a game ended:
- time
- mate
- resign
- draw
- other

## LeakType
The category of weakness detected:
- time
- tactics
- opening
- structure
- endgame

## Port
An interface in `shared/domain/ports` that defines a contract for an
external dependency. Adapters implement ports; domain services depend on ports.

## Adapter
A concrete implementation of a port in `app/adapters/`. May use external
libraries (chess.js, Stockfish, Supabase). Never imported by domain code.
