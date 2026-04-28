export const TerminationType = {
  Normal: 'normal',
  Time: 'time',
  Resign: 'resign',
  Abandoned: 'abandoned',
  Other: 'other',
} as const

export type TerminationType = typeof TerminationType[keyof typeof TerminationType]
