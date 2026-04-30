import type { ParsedGame } from '../entities/ParsedGame'
import type { MistakeRecord } from '../entities/MistakeRecord'
import { LeakType } from '../value-objects/LeakType'
import {
  MIN_CLOCK_FLAG_THRESHOLD_SECONDS,
  PRE_FLAG_LOOKBACK_MOVES,
  MATERIAL_SWING_PAWN_UNITS,
  EARLY_RESIGNATION_MAX_MOVES,
  MAX_CANDIDATES_PER_GAME,
} from '../config/leakRules'

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 }

function materialValue(fen: string, color: 'white' | 'black'): number {
  let total = 0
  for (const ch of fen.split(' ')[0]) {
    const lower = ch.toLowerCase()
    if (!(lower in PIECE_VALUES)) continue
    const isWhite = ch !== lower
    if ((color === 'white') === isWhite) total += PIECE_VALUES[lower]
  }
  return total
}

export function detectMistakes(games: ParsedGame[]): MistakeRecord[] {
  const results: MistakeRecord[] = []

  for (const { record, moves } of games) {
    const candidates: MistakeRecord[] = []

    const playerMoves = moves.filter(
      m => (record.color === 'white') === (m.fenBefore.split(' ')[1] === 'w'),
    )

    // Heuristic 1: FLAG_RISK — clock dropped below threshold in a time-loss game
    if (record.timeLoss) {
      const flagMove = playerMoves.find(
        m => m.timeRemainingSeconds !== null
          && m.timeRemainingSeconds < MIN_CLOCK_FLAG_THRESHOLD_SECONDS,
      )
      if (flagMove) {
        candidates.push({
          gameId: record.gameId,
          moveNumber: flagMove.moveNumber,
          fen: flagMove.fenBefore,
          leakType: LeakType.FlagRisk,
          clockAtMoment: flagMove.timeRemainingSeconds,
          heuristicReason: 'clock_heuristic',
          engineEval: null,
          bestMove: null,
          sourceOpponent: record.oppName,
          sourceDate: record.date,
        })
      }
    }

    // Heuristic 2: PRE_FLAG_BLUNDER — position N moves before time ran out
    if (record.timeLoss && playerMoves.length > PRE_FLAG_LOOKBACK_MOVES) {
      const idx = Math.max(0, playerMoves.length - 1 - PRE_FLAG_LOOKBACK_MOVES)
      const preFlagMove = playerMoves[idx]
      if (preFlagMove) {
        candidates.push({
          gameId: record.gameId,
          moveNumber: preFlagMove.moveNumber,
          fen: preFlagMove.fenBefore,
          leakType: LeakType.PreFlagBlunder,
          clockAtMoment: preFlagMove.timeRemainingSeconds,
          heuristicReason: 'pre_flag_position',
          engineEval: null,
          bestMove: null,
          sourceOpponent: record.oppName,
          sourceDate: record.date,
        })
      }
    }

    // Heuristic 3: TACTICAL_MISS — material swing between consecutive player turns
    for (let i = 0; i < playerMoves.length - 1; i++) {
      if (candidates.length >= MAX_CANDIDATES_PER_GAME) break
      const before = materialValue(playerMoves[i].fenBefore, record.color)
      const after = materialValue(playerMoves[i + 1].fenBefore, record.color)
      if (before - after >= MATERIAL_SWING_PAWN_UNITS) {
        candidates.push({
          gameId: record.gameId,
          moveNumber: playerMoves[i].moveNumber,
          fen: playerMoves[i].fenBefore,
          leakType: LeakType.TacticalMiss,
          clockAtMoment: playerMoves[i].timeRemainingSeconds,
          heuristicReason: 'material_swing',
          engineEval: null,
          bestMove: null,
          sourceOpponent: record.oppName,
          sourceDate: record.date,
        })
        i++ // skip adjacent to avoid overlapping swings on the same exchange
      }
    }

    // Heuristic 4: EARLY_RESIGNATION — short loss in a non-time game
    if (
      record.result === 'loss'
      && !record.timeLoss
      && record.moveCount < EARLY_RESIGNATION_MAX_MOVES
      && playerMoves.length > 0
    ) {
      const last = playerMoves[playerMoves.length - 1]
      candidates.push({
        gameId: record.gameId,
        moveNumber: last.moveNumber,
        fen: last.fenBefore,
        leakType: LeakType.EarlyResignation,
        clockAtMoment: last.timeRemainingSeconds,
        heuristicReason: 'early_resignation',
        engineEval: null,
        bestMove: null,
        sourceOpponent: record.oppName,
        sourceDate: record.date,
      })
    }

    results.push(...candidates.slice(0, MAX_CANDIDATES_PER_GAME))
  }

  return results
}
