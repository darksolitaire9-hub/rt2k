export const GameResult = {
  Win: 'win',
  Loss: 'loss',
  Draw: 'draw',
} as const

export type GameResult = typeof GameResult[keyof typeof GameResult]
