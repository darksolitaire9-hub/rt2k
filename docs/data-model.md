# Data Model

## GameRecord
Represents one game in normalized form.

Core fields:
- gameId
- date
- color
- result
- termination
- openingName
- eco
- myElo
- oppElo
- timeControl
- moveCount
- timeLoss
- openingFail
- conversionFail

## MistakeRecord
Represents one candidate mistake or turning point.

Core fields:
- gameId
- moveNumber
- fen
- leakType
- clockAtMoment
- heuristicReason
- engineEval
- bestMove

## Leak
Represents an aggregated weakness pattern.

Core fields:
- type
- score
- title
- description
- evidenceGameIds

## UserPuzzle
Represents a puzzle assigned to a user.

Core fields:
- id
- sourceGameId
- sourceMoveNumber
- fen
- solution
- clockAtMoment
- leakType

## AnalysisRun
Represents one complete analysis execution.

Core fields:
- id
- sourceType
- gamesCount
- createdAt
- isPartial
- trendReport
