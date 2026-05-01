import type { AnalysisResult } from '../../shared/application/use-cases/AnalyzePgnUseCase'

export type AnalyzeTier = 'burst' | 'mid' | 'deep'

export type WorkerRequest =
  | { type: 'init' }
  | { type: 'prewarm'; requestId: string; pgn: string; playerUsername: string; days: number; cacheKey?: string }
  | { type: 'analyze'; requestId: string; pgn: string; playerUsername: string; days: number; cacheKey?: string }
  | { type: 'cancel'; requestId: string }

export type WorkerResponse =
  | { type: 'ready' }
  | { type: 'progress'; requestId: string; tier: AnalyzeTier; progress: { stage: string; current: number; total: number } }
  | { type: 'result'; requestId: string; tier: AnalyzeTier; result: AnalysisResult }
  | { type: 'done'; requestId: string }
  | { type: 'error'; requestId: string; message: string }

export function hashString(input: string): string {
  let h = 5381
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h) ^ input.charCodeAt(i)
  return (h >>> 0).toString(36)
}

export function makeCacheKey(playerUsername: string, days: number, pgn: string): string {
  return `${playerUsername}::${days}::${hashString(pgn)}`
}
