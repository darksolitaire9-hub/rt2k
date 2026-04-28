export interface AnalysisRun {
  id: string
  sourceType: 'pgn-upload' | 'lichess-import'
  gamesCount: number
  createdAt: string
}
