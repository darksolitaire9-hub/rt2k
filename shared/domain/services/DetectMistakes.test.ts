import { describe, it, expect } from 'vitest'
import { detectMistakes } from './DetectMistakes'
import type { ParsedGame, ParsedMove } from '../entities/ParsedGame'
import { GameResult } from '../value-objects/GameResult'
import { TerminationType } from '../value-objects/TerminationType'
import { LeakType } from '../value-objects/LeakType'
import {
  MIN_CLOCK_FLAG_THRESHOLD_SECONDS,
  PRE_FLAG_LOOKBACK_MOVES,
  EARLY_RESIGNATION_MAX_MOVES,
} from '../config/leakRules'

// FEN constants: index 1 determines active color
const WHITE_TO_MOVE = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const BLACK_TO_MOVE = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'

function makeMove(overrides: Partial<ParsedMove> & { fenBefore: string }): ParsedMove {
  return {
    moveNumber: 1,
    san: 'e4',
    evalBefore: null,
    evalAfter: null,
    timeRemainingSeconds: null,
    ...overrides,
  }
}

function makeGame(color: 'white' | 'black', moves: ParsedMove[], overrides: Partial<ParsedGame['record']> = {}): ParsedGame {
  return {
    record: {
      gameId: 'g1',
      date: '2024-01-01',
      color,
      result: GameResult.Loss,
      termination: TerminationType.Normal,
      openingName: 'Sicilian Defense',
      eco: 'B20',
      myElo: 1500,
      oppElo: 1520,
      timeControl: '600+0',
      moveCount: moves.length,
      timeLoss: false,
      openingFail: false,
      conversionFail: false,
      clockPerMove: moves.map(m => m.timeRemainingSeconds),
      ...overrides,
    },
    moves,
  }
}

describe('detectMistakes', () => {
  it('returns empty array for games with no moves', () => {
    const result = detectMistakes([makeGame('white', [])])
    expect(result).toEqual([])
  })

  it('detects FLAG_RISK when clock drops below threshold in a time-loss game', () => {
    const moves = [
      makeMove({ fenBefore: WHITE_TO_MOVE, moveNumber: 1, timeRemainingSeconds: 60 }),
      makeMove({ fenBefore: WHITE_TO_MOVE, moveNumber: 2, timeRemainingSeconds: MIN_CLOCK_FLAG_THRESHOLD_SECONDS - 1 }),
    ]
    const game = makeGame('white', moves, { timeLoss: true })
    const result = detectMistakes([game])
    expect(result).toHaveLength(1)
    expect(result[0].leakType).toBe(LeakType.FlagRisk)
    expect(result[0].clockAtMoment).toBe(MIN_CLOCK_FLAG_THRESHOLD_SECONDS - 1)
  })

  it('detects PRE_FLAG_BLUNDER before time runs out', () => {
    const moves = Array.from({ length: 20 }, (_, i) =>
      makeMove({ fenBefore: WHITE_TO_MOVE, moveNumber: i + 1, timeRemainingSeconds: 30 - i }),
    )
    const game = makeGame('white', moves, { timeLoss: true })
    const result = detectMistakes([game])
    // Pre-flag blunder should be PRE_FLAG_LOOKBACK_MOVES before the end
    const expectedMove = moves[moves.length - 1 - PRE_FLAG_LOOKBACK_MOVES].moveNumber
    expect(result.some(r => r.leakType === LeakType.PreFlagBlunder && r.moveNumber === expectedMove)).toBe(true)
  })

  it('detects TACTICAL_MISS on material swing', () => {
    const moves = [
      // Move 1: White to move, full material
      makeMove({ fenBefore: WHITE_TO_MOVE, moveNumber: 1 }),
      // Move 1 (Black): Black to move
      makeMove({ fenBefore: BLACK_TO_MOVE, moveNumber: 1 }),
      // Move 2: White to move, but White is now missing a Queen compared to Move 1
      // rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR -> rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR (No 'q')
      makeMove({ fenBefore: 'rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 2', moveNumber: 2 }),
    ]
    const game = makeGame('white', moves)
    const result = detectMistakes([game])
    expect(result.some(r => r.leakType === LeakType.TacticalMiss)).toBe(true)
  })

  it('detects EARLY_RESIGNATION in short losing games', () => {
    const moves = [makeMove({ fenBefore: WHITE_TO_MOVE, moveNumber: 1 })]
    const game = makeGame('white', moves, { result: GameResult.Loss, timeLoss: false, moveCount: EARLY_RESIGNATION_MAX_MOVES - 5 })
    const result = detectMistakes([game])
    expect(result.some(r => r.leakType === LeakType.EarlyResignation)).toBe(true)
  })

  it('skips moves made by the opponent', () => {
    const moves = [makeMove({ fenBefore: BLACK_TO_MOVE, moveNumber: 1 })] // Opponent to move
    const game = makeGame('white', moves, { timeLoss: true })
    const result = detectMistakes([game])
    // Even if it's a time loss, it should not attribute opponent's turn FEN as player's mistake
    expect(result).toHaveLength(0)
  })
})
