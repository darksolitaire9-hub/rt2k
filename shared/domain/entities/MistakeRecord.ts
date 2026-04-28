export interface MistakeRecord {
  gameId: string
  moveNumber: number
  phase: 'opening' | 'middlegame' | 'endgame'
  leakType: 'time' | 'tactics' | 'opening' | 'structure' | 'endgame'
  fenBefore: string
  playedMove: string
  bestMove: string
  evalBefore: number | null
  evalAfter: number | null
  evalSwing: number | null
  timeRemainingSeconds: number | null
  theme: string | null
}
