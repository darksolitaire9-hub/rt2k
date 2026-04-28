export const LeakType = {
  Time: 'time',
  Tactics: 'tactics',
  Opening: 'opening',
  Structure: 'structure',
  Endgame: 'endgame',
} as const

export type LeakType = typeof LeakType[keyof typeof LeakType]
