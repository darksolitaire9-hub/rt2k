export const Phase = {
  Opening: 'opening',
  Middlegame: 'middlegame',
  Endgame: 'endgame',
} as const

export type Phase = typeof Phase[keyof typeof Phase]
