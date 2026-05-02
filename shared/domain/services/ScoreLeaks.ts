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

export function scoreLeaks(mistakes: MistakeRecord[], trend: TrendReport, totalAnalyzedGames?: number): Leak[] {
  const grouped = new Map<LeakType, MistakeRecord[]>()
  
  // Real game count from mistakes to get a sense of scale if not provided
  const totalGames = (typeof totalAnalyzedGames === 'number')
    ? totalAnalyzedGames
    : ([...new Set(mistakes.map(m => m.gameId))].length || 1)

  for (const mistake of mistakes) {
    const group = grouped.get(mistake.leakType) ?? []
    group.push(mistake)
    grouped.set(mistake.leakType, group)
  }

  const leaks: Leak[] = []

  for (const [type, group] of grouped) {
    const uniqueGamesInLeak = [...new Set(group.map(m => m.gameId))].length
    
    // Statistical significance check: MUST meet both absolute count AND relative density
    const density = totalGames > 0 ? uniqueGamesInLeak / totalGames : 0
    if (uniqueGamesInLeak < MIN_GAMES_FOR_LEAK_PATTERN || density < 0.05) continue

    const timeBoost = (type === 'FLAG_RISK' || type === 'PRE_FLAG_BLUNDER') && trend.flagRate > 0.3
      ? 1.5 : 1.0
    const score = group.length * LEAK_WEIGHTS[type] * timeBoost
    const evidenceGameIds = [...new Set(group.map(m => m.gameId))]

    const frequencyLabel = density > 0.2 ? 'Very Frequent' : density > 0.1 ? 'Frequent' : 'Occasional'
    const gamesPerLeak = Math.round(1 / (density || 0.01))

    const evidence: string[] = [
      `${frequencyLabel} — occurs in 1 of every ${gamesPerLeak} games`,
    ]

    if (type === 'FLAG_RISK') {
      evidence.push(`Flag rate: ${Math.round(trend.flagRate * 100)}%`)
      const avgClock = group.reduce((acc, m) => acc + (m.clockAtMoment ?? 0), 0) / group.length
      evidence.push(`Typical clock when flagged: ${Math.round(avgClock)}s`)
    }
    else if (type === 'TACTICAL_MISS') {
      evidence.push(`Average material loss: 2+ pawn units`)
    }
    else if (type === 'EARLY_RESIGNATION') {
      evidence.push(`Positions often had defensive resources remaining`)
    }

    leaks.push({
      type,
      score,
      title: LEAK_TITLES[type],
      description: LEAK_DESCRIPTIONS[type],
      evidenceGameIds,
      evidence,
    })
  }

  return leaks.sort((a, b) => b.score - a.score).slice(0, MAX_LEAKS_REPORTED)
}
