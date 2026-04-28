import { describe, it, expect } from 'vitest'
import { analyzeGames } from './AnalyzeGames'
import type { IPgnParserPort } from '../ports/IPgnParserPort'
import type { GameRecord } from '../entities/GameRecord'
import { GameResult } from '../value-objects/GameResult'
import { TerminationType } from '../value-objects/TerminationType'

const stubGame: GameRecord = {
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
}

function makeParser(games: GameRecord[]): IPgnParserPort {
  return { parse: () => games }
}

describe('analyzeGames', () => {
  it('returns the games produced by the parser', () => {
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
    const games = [stubGame, { ...stubGame, gameId: 'g2' }]
    const result = analyzeGames(makeParser(games), '[Game "1"][Game "2"]', 'alice')
    expect(result).toHaveLength(2)
  })
})
