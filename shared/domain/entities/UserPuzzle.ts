export interface UserPuzzle {
  id: string
  sourceGameId: string
  sourceMoveNumber: number
  fen: string
  bestMove: string
  playedMove: string
  theme: string | null
  ratingHint: number | null
}
