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
- phase
- leakType
- fenBefore
- playedMove
- bestMove
- evalBefore
- evalAfter
- evalSwing
- timeRemainingSeconds
- theme

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
- bestMove
- playedMove
- theme
- ratingHint

## AnalysisRun
Represents one complete analysis execution.

Core fields:
- id
- sourceType
- gamesCount
- createdAt
