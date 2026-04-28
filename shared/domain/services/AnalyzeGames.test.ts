import { describe, it, expect } from 'vitest'
import { analyzeGames } from './AnalyzeGames'
import type { IPgnParserPort } from '../ports/IPgnParserPort'
import type { ParsedGame } from '../entities/ParsedGame'
import { GameResult } from '../value-objects/GameResult'
import { TerminationType } from '../value-objects/TerminationType'

const stubGame: ParsedGame = {
  record: {
    gameId: 'g1',
    date: '2024-01-01',
    color: 'white',
    result: GameResult.Win,
    termination: TerminationType.Normal,
    openingName: 'Sicilian Defense',
    eco: 'B20',
    myElo: 1500,
    oppElo: 1480,
    timeControl: '600+0',
    moveCount: 40,
    timeLoss: false,
    openingFail: false,
    conversionFail: false,
  },
  moves: [
    { moveNumber: 1, san: 'e4', fenBefore: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', evalBefore: 20, evalAfter: 15, timeRemainingSeconds: 300 },
  ],
}

function makeParser(games: ParsedGame[]): IPgnParserPort {
  return { parse: () => games }
}

describe('analyzeGames', () => {
  it('returns the parsed games produced by the parser', () => {
    const result = analyzeGames(makeParser([stubGame]), '[Game "1"]', 'alice')
    expect(result).toEqual([stubGame])
  })

  it('passes pgn and playerUsername to the parser', () => {
    let capturedPgn = ''
    let capturedUsername = ''
    const parser: IPgnParserPort = {
      parse(pgn, playerUsername) {
        capturedPgn = pgn
        capturedUsername = playerUsername
        return []
      },
    }
    analyzeGames(parser, '[Event "Test"]', 'bob')
    expect(capturedPgn).toBe('[Event "Test"]')
    expect(capturedUsername).toBe('bob')
  })

  it('returns an empty array when the parser finds no matching games', () => {
    const result = analyzeGames(makeParser([]), '[Game "1"]', 'alice')
    expect(result).toEqual([])
  })

  it('returns all games when multiple games are parsed', () => {
    const games: ParsedGame[] = [
      stubGame,
      { ...stubGame, record: { ...stubGame.record, gameId: 'g2' } },
    ]
    const result = analyzeGames(makeParser(games), '[Game "1"][Game "2"]', 'alice')
    expect(result).toHaveLength(2)
  })

  it('each result carries both game record and moves', () => {
    const result = analyzeGames(makeParser([stubGame]), '[Game "1"]', 'alice')
    expect(result[0].record.gameId).toBe('g1')
    expect(result[0].moves).toHaveLength(1)
    expect(result[0].moves[0].san).toBe('e4')
  })
})
