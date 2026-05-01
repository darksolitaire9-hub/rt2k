import { Chess } from 'chess.js'
import type { IPgnParserPort } from '../../../shared/domain/ports/IPgnParserPort'
import type { ParsedGame, ParsedMove } from '../../../shared/domain/entities/ParsedGame'
import type { GameRecord } from '../../../shared/domain/entities/GameRecord'
import { GameResult } from '../../../shared/domain/value-objects/GameResult'
import { TerminationType } from '../../../shared/domain/value-objects/TerminationType'
import {
  BLUNDER_THRESHOLD_CP,
  OPENING_PHASE_UNTIL_MOVE,
  MIDDLEGAME_PHASE_UNTIL_MOVE,
} from '../../../shared/domain/config/leakRules'

function splitPgn(pgn: string): string[] {
  return pgn
    .split(/(?=^\[Event )/m)
    .map(s => s.trim())
    .filter(s => s.startsWith('[Event'))
}

function parseEval(comment: string): number | null {
  if (!comment) return null
  if (comment.includes('[%eval -#')) return -9999
  if (comment.includes('[%eval #')) return 9999
  const match = comment.match(/\[%eval\s+(-?[\d.]+)/)
  if (!match) return null
  return Math.round(parseFloat(match[1]) * 100)
}

function parseClk(comment: string): number | null {
  if (!comment) return null
  const match = comment.match(/\[%clk\s+(\d+):(\d+):(\d+)/)
  if (!match) return null
  return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3])
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

export class ChessJsPgnParserAdapter implements IPgnParserPort {
  parse(pgn: string, playerUsername: string): ParsedGame[] {
    const rawGames = splitPgn(pgn)
    const lc = playerUsername.toLowerCase().trim()
    
    // Reverse to process most recent games first
    const reversed = rawGames.reverse()
    
    return reversed
      .map(g => this.parseOne(g, lc))
      .filter((g): g is ParsedGame => g !== null)
  }

  private parseOne(gamePgn: string, playerUsernameLc: string): ParsedGame | null {
    const headers = this.parseHeaders(gamePgn)
    const white = (headers['White'] || '').toLowerCase().trim()
    const black = (headers['Black'] || '').toLowerCase().trim()
    
    const color: 'white' | 'black' | null =
      white === playerUsernameLc ? 'white' :
      black === playerUsernameLc ? 'black' : null
      
    if (!color) return null

    const chess = new Chess()
    const sanitizedPgn = gamePgn.replace(/\}\s*\{/g, ' ')

    try {
      chess.loadPgn(sanitizedPgn)
    } catch (e) {
      return null
    }

    const h = chess.header()
    const commentMap = new Map(chess.getComments().map(c => [c.fen, c.comment]))
    const history = chess.history({ verbose: true })

    const moves: ParsedMove[] = history.map((move, i) => ({
      moveNumber: Math.floor(i / 2) + 1,
      san: move.san,
      fenBefore: move.before,
      evalBefore: parseEval(commentMap.get(move.before) ?? ''),
      evalAfter: parseEval(commentMap.get(move.after) ?? ''),
      timeRemainingSeconds: parseClk(commentMap.get(move.after) ?? ''),
    }))

    const resultHeader = h['Result'] ?? '*'
    const result = mapResult(resultHeader, color)
    const termination = mapTermination(h['Termination'] ?? '')
    const siteHeader = h['Site'] ?? ''
    const gameId = siteHeader.split('/').pop() || `game-${Math.random().toString(36).slice(2)}`

    const record: GameRecord = {
      gameId,
      date: h['Date'] ?? '',
      oppName: color === 'white' ? (h['Black'] ?? 'Unknown') : (h['White'] ?? 'Unknown'),
      color,
      result,
      termination,
      openingName: h['Opening'] ?? '',
      eco: h['ECO'] ?? '',
      myElo: parseInt(color === 'white' ? (h['WhiteElo'] ?? '0') : (h['BlackElo'] ?? '0')),
      oppElo: parseInt(color === 'white' ? (h['BlackElo'] ?? '0') : (h['WhiteElo'] ?? '0')),
      timeControl: h['TimeControl'] ?? '',
      moveCount: Math.ceil(history.length / 2),
      timeLoss: termination === TerminationType.Time && result !== GameResult.Win,
      openingFail: computeOpeningFail(moves, color),
      conversionFail: computeConversionFail(moves, color, result),
      clockPerMove: moves.map(m => m.timeRemainingSeconds),
    }

    return { record, moves }
  }

  private parseHeaders(pgn: string): Record<string, string> {
    const headers: Record<string, string> = {}
    const matches = pgn.matchAll(/\[(\w+)\s+"([^"]+)"\]/g)
    for (const match of matches) {
      headers[match[1]] = match[2]
    }
    return headers
  }
}
