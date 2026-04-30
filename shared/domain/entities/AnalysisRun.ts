import type { TrendReport } from './TrendReport'

export interface AnalysisRun {
  id: string
  sourceType: 'pgn-upload' | 'lichess-import'
  gamesCount: number
  createdAt: string
  isPartial: boolean
  trendReport: TrendReport | null
}
