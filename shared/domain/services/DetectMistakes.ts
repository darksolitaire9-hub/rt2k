import type { ParsedGame, ParsedMove } from '../entities/ParsedGame'
import type { MistakeRecord } from '../entities/MistakeRecord'
import type { IEnginePort } from '../ports/IEnginePort'
import { LeakType } from '../value-objects/LeakType'
import { Phase } from '../value-objects/Phase'
import {
  INACCURACY_THRESHOLD_CP,
  TIME_LOSS_THRESHOLD_SECONDS,
  OPENING_PHASE_UNTIL_MOVE,
  MIDDLEGAME_PHASE_UNTIL_MOVE,
  ENGINE_SEARCH_DEPTH,
} from '../config/leakRules'

function sideToMove(fen: string): 'white' | 'black' {
  return fen.split(' ')[1] === 'w' ? 'white' : 'black'
}

function classifyPhase(moveNumber: number): Phase {
  if (moveNumber <= OPENING_PHASE_UNTIL_MOVE) return Phase.Opening
  if (moveNumber <= MIDDLEGAME_PHASE_UNTIL_MOVE) return Phase.Middlegame
  return Phase.Endgame
}

function classifyLeakType(timeRemainingSeconds: number | null, phase: Phase): LeakType {
  if (timeRemainingSeconds !== null && timeRemainingSeconds < TIME_LOSS_THRESHOLD_SECONDS) {
    return LeakType.Time
  }
  if (phase === Phase.Opening) return LeakType.Opening
  if (phase === Phase.Endgame) return LeakType.Endgame
  return LeakType.Tactics
}

function evalSwingFor(move: ParsedMove, playerColor: 'white' | 'black'): number | null {
  if (move.evalBefore == null || move.evalAfter == null) return null
  // Positive = eval dropped for the player (bad move)
  return playerColor === 'white'
    ? move.evalBefore - move.evalAfter
    : move.evalAfter - move.evalBefore
}

export async function detectMistakes(
  games: ParsedGame[],
  engine: IEnginePort,
): Promise<MistakeRecord[]> {
  const results: MistakeRecord[] = []

  for (const { record, moves } of games) {
    for (const move of moves) {
      if (sideToMove(move.fenBefore) !== record.color) continue

      const evalSwing = evalSwingFor(move, record.color)
      const timePressure = move.timeRemainingSeconds !== null
        && move.timeRemainingSeconds < TIME_LOSS_THRESHOLD_SECONDS
      const isTactical = evalSwing !== null && evalSwing >= INACCURACY_THRESHOLD_CP

      if (!isTactical && !timePressure) continue

      const phase = classifyPhase(move.moveNumber)
      const leakType = classifyLeakType(move.timeRemainingSeconds, phase)

      let bestMove = move.san
      if (isTactical) {
        const engineResult = await engine.evaluate(move.fenBefore, ENGINE_SEARCH_DEPTH)
        bestMove = engineResult.bestMove
      }

      results.push({
        gameId: record.gameId,
        moveNumber: move.moveNumber,
        phase,
        leakType,
        fenBefore: move.fenBefore,
        playedMove: move.san,
        bestMove,
        evalBefore: move.evalBefore,
        evalAfter: move.evalAfter,
        evalSwing,
        timeRemainingSeconds: move.timeRemainingSeconds,
        theme: null,
      })
    }
  }

  return results
}
