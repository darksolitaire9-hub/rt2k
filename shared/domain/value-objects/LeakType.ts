export const LeakType = {
  FlagRisk: 'FLAG_RISK',
  PreFlagBlunder: 'PRE_FLAG_BLUNDER',
  TacticalMiss: 'TACTICAL_MISS',
  EarlyResignation: 'EARLY_RESIGNATION',
} as const

export type LeakType = typeof LeakType[keyof typeof LeakType]
