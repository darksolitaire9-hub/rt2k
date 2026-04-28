import type { MistakeRecord } from '../entities/MistakeRecord'
import type { Leak } from '../entities/Leak'
import type { LeakType } from '../value-objects/LeakType'
import {
  MIN_OCCURRENCES_FOR_LEAK,
  MAX_LEAKS_REPORTED,
  LEAK_WEIGHTS,
} from '../config/leakRules'

const LEAK_TITLES: Record<LeakType, string> = {
  time: 'Time Trouble',
  tactics: 'Tactical Mistakes',
  opening: 'Opening Errors',
  structure: 'Structural Weaknesses',
  endgame: 'Endgame Inaccuracies',
}

const LEAK_DESCRIPTIONS: Record<LeakType, string> = {
  time: 'You consistently run low on the clock, leading to rushed and inaccurate moves.',
  tactics: 'You are missing tactical opportunities or falling into tactical traps in your games.',
  opening: 'Your opening play leads to disadvantaged positions early in the game.',
  structure: 'Pawn structure decisions are creating long-term weaknesses in your games.',
  endgame: 'You are losing or drawing positions that should be won in the endgame.',
}

export function scoreLeaks(mistakes: MistakeRecord[]): Leak[] {
  const grouped = new Map<LeakType, MistakeRecord[]>()

  for (const mistake of mistakes) {
    const group = grouped.get(mistake.leakType) ?? []
    group.push(mistake)
    grouped.set(mistake.leakType, group)
  }

  const leaks: Leak[] = []

  for (const [type, group] of grouped) {
    if (group.length < MIN_OCCURRENCES_FOR_LEAK) continue

    const weight = LEAK_WEIGHTS[type]
    const score = group.length * weight

    const evidenceGameIds = [...new Set(group.map(m => m.gameId))]

    leaks.push({
      type,
      score,
      title: LEAK_TITLES[type],
      description: LEAK_DESCRIPTIONS[type],
      evidenceGameIds,
    })
  }

  return leaks
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_LEAKS_REPORTED)
}
