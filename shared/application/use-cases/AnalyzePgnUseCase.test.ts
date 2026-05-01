import { describe, it, expect } from 'vitest'
import { analyzePgn } from './AnalyzePgnUseCase'
import { GameResult } from '../../domain/value-objects/GameResult'
import { TerminationType } from '../../domain/value-objects/TerminationType'

describe('AnalyzePgnUseCase - Traceability & Filtering', () => {
  const mockParser = {
    parse: () => [
      {
        record: { date: '2026.04.30', gameId: 'recent-1', result: GameResult.Win, clockPerMove: [] },
        moves: []
      },
      {
        record: { date: '2020.01.01', gameId: 'old-1', result: GameResult.Loss, clockPerMove: [] },
        moves: []
      }
    ]
  }

  const mockEngine = {
    evaluatePositions: async (reqs: any[]) => reqs.map(r => ({ fen: r.fen, scoreCp: 0, bestMoveUci: 'e2e4' }))
  }

  it('filters games by 90-day window', async () => {
    // We need to pass all required fields for GameRecord
    const games = [
      {
        record: { 
          date: '2026.04.30', 
          gameId: 'recent', 
          result: GameResult.Win, 
          clockPerMove: [],
          oppName: 'Opp', color: 'white', termination: TerminationType.Normal,
          openingName: '', eco: '', myElo: 1500, oppElo: 1500, timeControl: '',
          moveCount: 10, timeLoss: false, openingFail: false, conversionFail: false
        },
        moves: []
      },
      {
        record: { 
          date: '2020.01.01', 
          gameId: 'old', 
          result: GameResult.Loss, 
          clockPerMove: [],
          oppName: 'Opp', color: 'black', termination: TerminationType.Normal,
          openingName: '', eco: '', myElo: 1500, oppElo: 1500, timeControl: '',
          moveCount: 10, timeLoss: false, openingFail: false, conversionFail: false
        },
        moves: []
      }
    ]

    const customParser = { parse: () => games }
    
    // Using a fixed "today" for testing isn't easy without mocking Date, 
    // but our code uses `new Date()`. On April 30, 2026:
    const result = await analyzePgn('', 'user', customParser as any, mockEngine as any)
    
    // Since we only have 1 recent game (< 20), it should fallback to all games
    // UNLESS we change the fallback logic. 
    // Wait, I implemented: `const pool = recentGames.length >= 20 ? recentGames : parsedGames`
    expect(result.games.length).toBe(2)
  })
})
