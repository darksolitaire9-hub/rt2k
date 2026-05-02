import { describe, it, expect } from 'vitest'
import { ChessJsPgnParserAdapter } from './ChessJsPgnParserAdapter'
import { GameResult } from '../../../shared/domain/value-objects/GameResult'
import { TerminationType } from '../../../shared/domain/value-objects/TerminationType'

const PLAYER = 'testplayer'
const OPPONENT = 'opponent'

const WHITE_PGN = `[Event "Rated Blitz game"]
[Site "https://lichess.org/testgame1"]
[Date "2024.01.15"]
[White "${PLAYER}"]
[Black "${OPPONENT}"]
[Result "1-0"]
[WhiteElo "1800"]
[BlackElo "1750"]
[TimeControl "180+2"]
[ECO "C50"]
[Opening "Italian Game"]
[Termination "Normal"]

1. e4 { [%eval 0.17] [%clk 3:00:00] } 1... e5 { [%eval 0.14] [%clk 3:00:00] } 2. Nf3 { [%eval 0.30] [%clk 2:59:55] } 2... Nc6 { [%eval 0.25] [%clk 2:59:55] } 1-0`

const BLACK_PGN = `[Event "Rated Blitz game"]
[Site "https://lichess.org/testgame2"]
[Date "2024.01.16"]
[White "${OPPONENT}"]
[Black "${PLAYER}"]
[Result "0-1"]
[WhiteElo "1750"]
[BlackElo "1800"]
[TimeControl "180+2"]
[ECO "B20"]
[Opening "Sicilian Defense"]
[Termination "Normal"]

1. e4 { [%eval 0.17] [%clk 3:00:00] } 1... c5 { [%eval 0.14] [%clk 3:00:00] } 0-1`

const NO_EVAL_PGN = `[Event "Rapid"]
[Site "https://lichess.org/noevals"]
[White "${PLAYER}"]
[Black "${OPPONENT}"]
[Result "1-0"]
[WhiteElo "1800"]
[BlackElo "1750"]
[TimeControl "600+0"]
[ECO "A00"]
[Opening "Polish Opening"]
[Termination "Normal"]

1. b4 b5 2. Bb2 Bb7 1-0`

const TIME_FORFEIT_PGN = `[Event "Rated Blitz game"]
[Site "https://lichess.org/timegame"]
[White "${PLAYER}"]
[Black "${OPPONENT}"]
[Result "0-1"]
[WhiteElo "1800"]
[BlackElo "1750"]
[TimeControl "180+2"]
[ECO "A00"]
[Opening "Polish Opening"]
[Termination "Time forfeit"]

1. b4 b5 0-1`

const MATE_EVAL_PGN = `[Event "Rapid"]
[Site "https://lichess.org/mateevals"]
[White "${PLAYER}"]
[Black "${OPPONENT}"]
[Result "1-0"]
[WhiteElo "1800"]
[BlackElo "1750"]
[TimeControl "600+0"]
[ECO "A00"]
[Opening "Polish Opening"]
[Termination "Normal"]

1. b4 { [%eval #5] } 1... b5 { [%eval -#3] } 1-0`

describe('ChessJsPgnParserAdapter', () => {
  const adapter = new ChessJsPgnParserAdapter()

  it('returns empty array for empty PGN', () => {
    expect(adapter.parse('', PLAYER)).toEqual([])
  })

  it('skips games where player is not a participant', () => {
    expect(adapter.parse(WHITE_PGN, 'unknown')).toHaveLength(0)
  })

  it('parses a game where the player is white', () => {
    const result = adapter.parse(WHITE_PGN, PLAYER)
    expect(result).toHaveLength(1)
    expect(result[0].record.color).toBe('white')
  })

  it('parses a game where the player is black', () => {
    const result = adapter.parse(BLACK_PGN, PLAYER)
    expect(result).toHaveLength(1)
    expect(result[0].record.color).toBe('black')
  })

  it('extracts correct GameRecord metadata', () => {
    const [game] = adapter.parse(WHITE_PGN, PLAYER)
    expect(game.record.gameId).toBe('testgame1')
    expect(game.record.date).toBe('2024.01.15')
    expect(game.record.eco).toBe('C50')
    expect(game.record.openingName).toBe('Italian Game')
    expect(game.record.myElo).toBe(1800)
    expect(game.record.oppElo).toBe(1750)
    expect(game.record.timeControl).toBe('180+2')
    expect(game.record.moveCount).toBe(2)
  })

  it('maps result to Win for the winning player', () => {
    const [game] = adapter.parse(WHITE_PGN, PLAYER)
    expect(game.record.result).toBe(GameResult.Win)
  })

  it('maps result to Loss from the losing side perspective', () => {
    const [game] = adapter.parse(WHITE_PGN, OPPONENT)
    expect(game.record.result).toBe(GameResult.Loss)
  })

  it('parses all halfmoves with correct SAN and move number', () => {
    const [game] = adapter.parse(WHITE_PGN, PLAYER)
    expect(game.moves).toHaveLength(4)
    expect(game.moves[0]).toMatchObject({ san: 'e4', moveNumber: 1 })
    expect(game.moves[1]).toMatchObject({ san: 'e5', moveNumber: 1 })
    expect(game.moves[2]).toMatchObject({ san: 'Nf3', moveNumber: 2 })
    expect(game.moves[3]).toMatchObject({ san: 'Nc6', moveNumber: 2 })
  })

  it('sets fenBefore to the starting position for the first move', () => {
    const [game] = adapter.parse(WHITE_PGN, PLAYER)
    expect(game.moves[0].fenBefore).toContain('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR')
  })

  it('evalBefore of move 1 is null (no comment precedes the first move)', () => {
    const [game] = adapter.parse(WHITE_PGN, PLAYER)
    expect(game.moves[0].evalBefore).toBeNull()
  })

  it('evalAfter of move 1 matches the annotation after e4', () => {
    const [game] = adapter.parse(WHITE_PGN, PLAYER)
    expect(game.moves[0].evalAfter).toBe(17)
  })

  it('evalBefore of move 2 equals evalAfter of move 1', () => {
    const [game] = adapter.parse(WHITE_PGN, PLAYER)
    expect(game.moves[1].evalBefore).toBe(game.moves[0].evalAfter)
  })

  it('parses clock annotations into seconds', () => {
    const [game] = adapter.parse(WHITE_PGN, PLAYER)
    expect(game.moves[0].timeRemainingSeconds).toBe(10800) // 3:00:00
    expect(game.moves[2].timeRemainingSeconds).toBe(10795) // 2:59:55
  })

  it('returns null evals and clocks when no annotations are present', () => {
    const [game] = adapter.parse(NO_EVAL_PGN, PLAYER)
    expect(game.moves[0].evalBefore).toBeNull()
    expect(game.moves[0].evalAfter).toBeNull()
    expect(game.moves[0].timeRemainingSeconds).toBeNull()
  })

  it('parses both games from a multi-game PGN string in reverse order (newest first)', () => {
    const result = adapter.parse(WHITE_PGN + '\n\n' + BLACK_PGN, PLAYER)
    expect(result).toHaveLength(2)
    // The parser processes in reverse, and BLACK_PGN is 2024.01.16 while WHITE_PGN is 2024.01.15
    expect(result[0].record.gameId).toBe('testgame2')
    expect(result[1].record.gameId).toBe('testgame1')
  })

  it('sets timeLoss true when Termination is Time forfeit and player lost', () => {
    const [game] = adapter.parse(TIME_FORFEIT_PGN, PLAYER)
    expect(game.record.termination).toBe(TerminationType.Time)
    expect(game.record.timeLoss).toBe(true)
  })

  it('sets timeLoss false when Termination is Normal', () => {
    const [game] = adapter.parse(WHITE_PGN, PLAYER)
    expect(game.record.timeLoss).toBe(false)
  })

  it('maps mate-in-N eval annotation to 9999', () => {
    const [game] = adapter.parse(MATE_EVAL_PGN, PLAYER)
    expect(game.moves[0].evalAfter).toBe(9999)
  })

  it('maps opponent mate-in-N eval annotation to -9999', () => {
    const [game] = adapter.parse(MATE_EVAL_PGN, PLAYER)
    expect(game.moves[1].evalAfter).toBe(-9999)
  })
})
