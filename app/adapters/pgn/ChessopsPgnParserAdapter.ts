import { parsePgn, parseComment } from 'chessops/pgn'
import { Chess } from 'chessops/chess'
import { makeFen } from 'chessops/fen'
import { parseSan } from 'chessops/san'
import type { IPgnParserPort, PgnParserOptions } from '#shared/domain/ports/IPgnParserPort'
import type { ParsedGame, ParsedMove } from '#shared/domain/entities/ParsedGame'
import type { GameRecord } from '#shared/domain/entities/GameRecord'
import { GameResult } from '#shared/domain/value-objects/GameResult'
import { TerminationType } from '#shared/domain/value-objects/TerminationType'
import {
  BLUNDER_THRESHOLD_CP,
  OPENING_PHASE_UNTIL_MOVE,
  MIDDLEGAME_PHASE_UNTIL_MOVE,
} from '#shared/domain/config/leakRules'

function splitPgnOptimized(pgn: string): string[] {
  const games: string[] = []
  const marker = '[Event '
  let start = pgn.indexOf(marker)
  
  if (start === -1) return []

  while (start !== -1) {
    const next = pgn.indexOf(marker, start + marker.length)
    if (next === -1) {
      games.push(pgn.slice(start).trim())
      break
    }
    games.push(pgn.slice(start, next).trim())
    start = next
  }
  
  return games
}

function parseEvalFromComments(comments: string[] | undefined): number | null {
  if (!comments || comments.length === 0) return null
  for (const c of comments) {
    const parsed = parseComment(c)
    if (parsed.eval) {
      if (parsed.eval.mate !== undefined) {
        return parsed.eval.mate > 0 ? 9999 : -9999
      }
      if (parsed.eval.hpawns !== undefined) {
        return Math.round(parsed.eval.hpawns * 100)
      }
    }
    // Simple regex fallback
    const evalMatch = c.match(/\[%eval\s+(-?[\d.]+)/)
    if (evalMatch) return Math.round(parseFloat(evalMatch[1]!) * 100)
    const mateMatch = c.match(/\[%eval\s+#(-?\d+)/)
    if (mateMatch) return parseInt(mateMatch[1]!) > 0 ? 9999 : -9999
    const mateMatch2 = c.match(/\[%eval\s+-#(\d+)/)
    if (mateMatch2) return -9999
  }
  return null
}

function parseClkFromComments(comments: string[] | undefined): number | null {
  if (!comments || comments.length === 0) return null
  for (const c of comments) {
    const parsed = parseComment(c)
    if (parsed.clk) {
      const match = parsed.clk.match(/(\d+):(\d+):(\d+)/)
      if (match) {
        return parseInt(match[1]!) * 3600 + parseInt(match[2]!) * 60 + parseInt(match[3]!)
      }
    }
    // Simple regex fallback
    const clkMatch = c.match(/\[%clk\s+(\d+):(\d+):(\d+)/)
    if (clkMatch) return parseInt(clkMatch[1]!) * 3600 + parseInt(clkMatch[2]!) * 60 + parseInt(clkMatch[3]!)
  }
  return null
}

function mapResult(resultHeader: string, color: 'white' | 'black'): GameResult {
  if (resultHeader === '1-0') return color === 'white' ? GameResult.Win : GameResult.Loss
  if (resultHeader === '0-1') return color === 'black' ? GameResult.Win : GameResult.Loss
  if (resultHeader === '1/2-1/2') return GameResult.Draw
  return GameResult.Draw
}

function mapTermination(t: string): TerminationType {
  const lower = t.toLowerCase()
  if (lower.includes('time') || lower.includes('out of time')) return TerminationType.Time
  if (lower.includes('abandon')) return TerminationType.Abandoned
  if (lower.includes('resign')) return TerminationType.Resign
  return TerminationType.Normal
}

function computeOpeningFail(moves: ParsedMove[], color: 'white' | 'black'): boolean {
  return moves
    .filter(m => m.moveNumber <= OPENING_PHASE_UNTIL_MOVE)
    .some(m => {
      if (m.evalBefore === null || m.evalAfter === null) return false
      const swing = color === 'white' ? m.evalBefore - m.evalAfter : m.evalAfter - m.evalBefore
      return swing >= BLUNDER_THRESHOLD_CP
    })
}

function computeConversionFail(moves: ParsedMove[], color: 'white' | 'black', result: GameResult): boolean {
  if (result === GameResult.Win) return false
  const sign = color === 'white' ? 1 : -1
  return moves
    .filter(m => m.moveNumber > MIDDLEGAME_PHASE_UNTIL_MOVE)
    .some(m => m.evalBefore !== null && sign * m.evalBefore >= BLUNDER_THRESHOLD_CP)
}

export class ChessopsPgnParserAdapter implements IPgnParserPort {
  parse(pgn: string, playerUsername: string, options?: PgnParserOptions): ParsedGame[] {
    const rawGames = splitPgnOptimized(pgn)
    const lc = playerUsername.toLowerCase().trim()
    const since = options?.since
    const limit = options?.limit
    
    const results: ParsedGame[] = []
    let outOfDateCount = 0
    const MAX_OUT_OF_DATE_BUFFER = 5
    
    for (let i = rawGames.length - 1; i >= 0; i--) {
      if (limit && results.length >= limit) break
      
      const gamePgn = rawGames[i]!
      const headers = this.parseHeaders(gamePgn)
      
      const white = (headers.get('White') || '').toLowerCase().trim()
      const black = (headers.get('Black') || '').toLowerCase().trim()
      if (white !== lc && black !== lc) continue
      
      if (since) {
        const dateStr = (headers.get('Date') || '').replace(/\./g, '-')
        const gameDate = new Date(dateStr)
        if (!isNaN(gameDate.getTime()) && gameDate < since) {
          outOfDateCount++
          if (outOfDateCount > MAX_OUT_OF_DATE_BUFFER) break
          continue 
        } else {
          outOfDateCount = 0
        }
      }
      
      const parsed = this.parseOneWithRawPgn(gamePgn, lc)
      if (parsed) results.push(parsed)
    }
    
    return results
  }

  private parseOneWithRawPgn(gamePgn: string, playerUsernameLc: string): ParsedGame | null {
    const games = parsePgn(gamePgn)
    if (games.length === 0) return null
    const game = games[0]!

    const white = (game.headers.get('White') || '').toLowerCase().trim()
    const black = (game.headers.get('Black') || '').toLowerCase().trim()
    
    const color: 'white' | 'black' | null =
      white === playerUsernameLc ? 'white' :
      black === playerUsernameLc ? 'black' : null
      
    if (!color) return null

    const moves: ParsedMove[] = []
    const pos = Chess.default()
    
    let lastEval = parseEvalFromComments(game.comments)
    
    let halfmoveCount = 0
    const mainline = game.moves.mainline()
    for (const node of mainline) {
      const fenBefore = makeFen(pos.toSetup())
      
      const evalAfter = parseEvalFromComments(node.comments)
      const timeRemaining = parseClkFromComments(node.comments)
      
      moves.push({
        moveNumber: Math.floor(halfmoveCount / 2) + 1,
        san: node.san,
        fenBefore,
        evalBefore: lastEval,
        evalAfter,
        timeRemainingSeconds: timeRemaining,
      })
      
      const move = parseSan(pos, node.san)
      if (move) {
        pos.play(move)
      }
      lastEval = evalAfter
      halfmoveCount++
    }

    const resultHeader = game.headers.get('Result') ?? '*'
    const result = mapResult(resultHeader, color)
    const termination = mapTermination(game.headers.get('Termination') ?? '')
    const siteHeader = game.headers.get('Site') ?? ''
    const gameId = siteHeader.split('/').pop() || `game-${Math.random().toString(36).slice(2)}`

    const record: GameRecord = {
      gameId,
      date: game.headers.get('Date') ?? '',
      oppName: color === 'white' ? (game.headers.get('Black') ?? 'Unknown') : (game.headers.get('White') ?? 'Unknown'),
      color,
      result,
      termination,
      openingName: game.headers.get('Opening') ?? '',
      eco: game.headers.get('ECO') ?? '',
      myElo: parseInt(color === 'white' ? (game.headers.get('WhiteElo') ?? '0') : (game.headers.get('BlackElo') ?? '0')),
      oppElo: parseInt(color === 'white' ? (game.headers.get('BlackElo') ?? '0') : (game.headers.get('WhiteElo') ?? '0')),
      timeControl: game.headers.get('TimeControl') ?? '',
      moveCount: Math.ceil(halfmoveCount / 2),
      timeLoss: termination === TerminationType.Time && result !== GameResult.Win,
      openingFail: computeOpeningFail(moves, color),
      conversionFail: computeConversionFail(moves, color, result),
      clockPerMove: moves.map(m => m.timeRemainingSeconds),
    }

    return { record, moves }
  }

  private parseHeaders(pgn: string): Map<string, string> {
    const headers = new Map<string, string>()
    const matches = pgn.matchAll(/\[(\w+)\s+"([^"]+)"\]/g)
    for (const match of matches) {
      headers.set(match[1]!, match[2]!)
    }
    return headers
  }
}
