import { describe, it, expect } from 'vitest'
import { detectMistakes } from './DetectMistakes'
import type { IEnginePort, EngineResult } from '../ports/IEnginePort'
import type { ParsedGame, ParsedMove } from '../entities/ParsedGame'
import { GameResult } from '../value-objects/GameResult'
import { TerminationType } from '../value-objects/TerminationType'
import { LeakType } from '../value-objects/LeakType'
import { Phase } from '../value-objects/Phase'
import {
  INACCURACY_THRESHOLD_CP,
  BLUNDER_THRESHOLD_CP,
  TIME_LOSS_THRESHOLD_SECONDS,
} from '../config/leakRules'

// FEN constants: the active-color field (index 1) determines whose turn it is
const WHITE_TO_MOVE = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const BLACK_TO_MOVE = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'

function makeEngine(bestMove = 'd2d4'): IEnginePort & { calls: string[] } {
  const calls: string[] = []
  return {
    calls,
    async evaluate(_fen: string, _depth: number): Promise<EngineResult> {
      calls.push(_fen)
      return { score: 50, bestMove }
    },
  }
}

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

function makeGame(color: 'white' | 'black', moves: ParsedMove[]): ParsedGame {
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
      moveCount: 40,
      timeLoss: false,
      openingFail: false,
      conversionFail: false,
    },
    moves,
  }
}

describe('detectMistakes', () => {
  it('returns empty array for games with no moves', async () => {
    const result = await detectMistakes([makeGame('white', [])], makeEngine())
    expect(result).toEqual([])
  })

  it('returns empty array when no games provided', async () => {
    const result = await detectMistakes([], makeEngine())
    expect(result).toEqual([])
  })

  it('detects a tactical mistake when eval swing meets the inaccuracy threshold', async () => {
    const engine = makeEngine('d2d4')
    const move = makeMove({
      fenBefore: WHITE_TO_MOVE,
      moveNumber: 15,
      san: 'Nd2',
      evalBefore: INACCURACY_THRESHOLD_CP + 10,
      evalAfter: 0,
    })
    const result = await detectMistakes([makeGame('white', [move])], engine)
    expect(result).toHaveLength(1)
    expect(result[0].playedMove).toBe('Nd2')
    expect(result[0].bestMove).toBe('d2d4')
    expect(result[0].evalSwing).toBe(INACCURACY_THRESHOLD_CP + 10)
  })

  it('skips moves below the inaccuracy threshold', async () => {
    const move = makeMove({
      fenBefore: WHITE_TO_MOVE,
      moveNumber: 15,
      evalBefore: INACCURACY_THRESHOLD_CP - 1,
      evalAfter: 0,
    })
    const result = await detectMistakes([makeGame('white', [move])], makeEngine())
    expect(result).toHaveLength(0)
  })

  it('skips moves made by the opponent', async () => {
    // Player is white but this FEN shows black to move — opponent's turn
    const move = makeMove({
      fenBefore: BLACK_TO_MOVE,
      moveNumber: 1,
      evalBefore: 100,
      evalAfter: -200,
    })
    const result = await detectMistakes([makeGame('white', [move])], makeEngine())
    expect(result).toHaveLength(0)
  })

  it('classifies a move on move 5 as opening phase', async () => {
    const move = makeMove({
      fenBefore: WHITE_TO_MOVE,
      moveNumber: 5,
      evalBefore: BLUNDER_THRESHOLD_CP + 10,
      evalAfter: 0,
    })
    const result = await detectMistakes([makeGame('white', [move])], makeEngine())
    expect(result[0].phase).toBe(Phase.Opening)
  })

  it('classifies a move on move 20 as middlegame phase', async () => {
    const move = makeMove({
      fenBefore: WHITE_TO_MOVE,
      moveNumber: 20,
      evalBefore: BLUNDER_THRESHOLD_CP + 10,
      evalAfter: 0,
    })
    const result = await detectMistakes([makeGame('white', [move])], makeEngine())
    expect(result[0].phase).toBe(Phase.Middlegame)
  })

  it('classifies a move on move 35 as endgame phase', async () => {
    const move = makeMove({
      fenBefore: WHITE_TO_MOVE,
      moveNumber: 35,
      evalBefore: BLUNDER_THRESHOLD_CP + 10,
      evalAfter: 0,
    })
    const result = await detectMistakes([makeGame('white', [move])], makeEngine())
    expect(result[0].phase).toBe(Phase.Endgame)
  })

  it('assigns leakType opening for a mistake in the opening', async () => {
    const move = makeMove({ fenBefore: WHITE_TO_MOVE, moveNumber: 8, evalBefore: 150, evalAfter: 0 })
    const result = await detectMistakes([makeGame('white', [move])], makeEngine())
    expect(result[0].leakType).toBe(LeakType.Opening)
  })

  it('assigns leakType tactics for a mistake in the middlegame', async () => {
    const move = makeMove({ fenBefore: WHITE_TO_MOVE, moveNumber: 18, evalBefore: 150, evalAfter: 0 })
    const result = await detectMistakes([makeGame('white', [move])], makeEngine())
    expect(result[0].leakType).toBe(LeakType.Tactics)
  })

  it('assigns leakType endgame for a mistake in the endgame', async () => {
    const move = makeMove({ fenBefore: WHITE_TO_MOVE, moveNumber: 40, evalBefore: 150, evalAfter: 0 })
    const result = await detectMistakes([makeGame('white', [move])], makeEngine())
    expect(result[0].leakType).toBe(LeakType.Endgame)
  })

  it('assigns leakType time when clock is critically low, regardless of phase', async () => {
    const move = makeMove({
      fenBefore: WHITE_TO_MOVE,
      moveNumber: 15,
      evalBefore: 150,
      evalAfter: 0,
      timeRemainingSeconds: TIME_LOSS_THRESHOLD_SECONDS - 1,
    })
    const result = await detectMistakes([makeGame('white', [move])], makeEngine())
    expect(result[0].leakType).toBe(LeakType.Time)
  })

  it('flags a time mistake even when eval data is absent', async () => {
    const move = makeMove({
      fenBefore: WHITE_TO_MOVE,
      moveNumber: 25,
      timeRemainingSeconds: TIME_LOSS_THRESHOLD_SECONDS - 5,
    })
    const result = await detectMistakes([makeGame('white', [move])], makeEngine())
    expect(result).toHaveLength(1)
    expect(result[0].leakType).toBe(LeakType.Time)
    expect(result[0].evalSwing).toBeNull()
  })

  it('calls the engine for a tactical mistake to retrieve bestMove', async () => {
    const engine = makeEngine('g1f3')
    const move = makeMove({ fenBefore: WHITE_TO_MOVE, moveNumber: 10, evalBefore: 200, evalAfter: 0 })
    const result = await detectMistakes([makeGame('white', [move])], engine)
    expect(engine.calls).toHaveLength(1)
    expect(engine.calls[0]).toBe(WHITE_TO_MOVE)
    expect(result[0].bestMove).toBe('g1f3')
  })

  it('does not call the engine for a time-only mistake', async () => {
    const engine = makeEngine()
    const move = makeMove({
      fenBefore: WHITE_TO_MOVE,
      moveNumber: 20,
      timeRemainingSeconds: 5,
    })
    await detectMistakes([makeGame('white', [move])], engine)
    expect(engine.calls).toHaveLength(0)
  })

  it('uses the played move as bestMove fallback for time-only mistakes', async () => {
    const move = makeMove({
      fenBefore: WHITE_TO_MOVE,
      san: 'Ke2',
      moveNumber: 30,
      timeRemainingSeconds: 3,
    })
    const result = await detectMistakes([makeGame('white', [move])], makeEngine())
    expect(result[0].bestMove).toBe('Ke2')
  })

  it('computes correct eval swing for a black player mistake', async () => {
    // Black player: a bad black move causes eval to RISE (white gets better)
    const move = makeMove({
      fenBefore: BLACK_TO_MOVE,
      moveNumber: 12,
      evalBefore: -50,
      evalAfter: 200,  // rose by 250 — bad for black
    })
    const result = await detectMistakes([makeGame('black', [move])], makeEngine())
    expect(result).toHaveLength(1)
    expect(result[0].evalSwing).toBe(250)
  })

  it('populates all MistakeRecord fields correctly', async () => {
    const move = makeMove({
      fenBefore: WHITE_TO_MOVE,
      moveNumber: 15,
      san: 'Bb5',
      evalBefore: 300,
      evalAfter: 0,
      timeRemainingSeconds: 120,
    })
    const result = await detectMistakes([makeGame('white', [move])], makeEngine('e2e4'))
    const r = result[0]
    expect(r.gameId).toBe('g1')
    expect(r.moveNumber).toBe(15)
    expect(r.fenBefore).toBe(WHITE_TO_MOVE)
    expect(r.playedMove).toBe('Bb5')
    expect(r.bestMove).toBe('e2e4')
    expect(r.evalBefore).toBe(300)
    expect(r.evalAfter).toBe(0)
    expect(r.evalSwing).toBe(300)
    expect(r.timeRemainingSeconds).toBe(120)
    expect(r.theme).toBeNull()
  })
})
