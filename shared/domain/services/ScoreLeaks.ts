import type { MistakeRecord } from '../entities/MistakeRecord'
import type { Leak } from '../entities/Leak'
import type { TrendReport } from '../entities/TrendReport'
import type { LeakType } from '../value-objects/LeakType'
import {
  MIN_GAMES_FOR_LEAK_PATTERN,
  MAX_LEAKS_REPORTED,
  LEAK_WEIGHTS,
} from '../config/leakRules'

const LEAK_TITLES: Record<LeakType, string> = {
  FLAG_RISK: 'Time Trouble',
  PRE_FLAG_BLUNDER: 'Blunders Under Time Pressure',
  TACTICAL_MISS: 'Tactical Mistakes',
  EARLY_RESIGNATION: 'Premature Resignations',
}

const LEAK_DESCRIPTIONS: Record<LeakType, string> = {
  FLAG_RISK: 'You consistently run out of time, forcing rushed moves in critical positions.',
  PRE_FLAG_BLUNDER: 'You are losing material in the final moves before your clock runs out.',
  TACTICAL_MISS: 'You are missing tactical opportunities or falling into tactical traps mid-game.',
  EARLY_RESIGNATION: 'You are resigning in positions that may still have defensive resources.',
}

export function scoreLeaks(mistakes: MistakeRecord[], trend: TrendReport): Leak[] {
  const grouped = new Map<LeakType, MistakeRecord[]>()

  for (const mistake of mistakes) {
    const group = grouped.get(mistake.leakType) ?? []
    group.push(mistake)
    grouped.set(mistake.leakType, group)
  }

  const leaks: Leak[] = []

  for (const [type, group] of grouped) {
    if (group.length < MIN_GAMES_FOR_LEAK_PATTERN) continue

    const timeBoost = (type === 'FLAG_RISK' || type === 'PRE_FLAG_BLUNDER') && trend.flagRate > 0.3
      ? 1.5 : 1.0
    const score = group.length * LEAK_WEIGHTS[type] * timeBoost
    const evidenceGameIds = [...new Set(group.map(m => m.gameId))]

    leaks.push({
      type,
      score,
      title: LEAK_TITLES[type],
      description: LEAK_DESCRIPTIONS[type],
      evidenceGameIds,
    })
  }

  return leaks.sort((a, b) => b.score - a.score).slice(0, MAX_LEAKS_REPORTED)
}
