import type { GameRecord } from '../entities/GameRecord'
import type { TrendReport } from '../entities/TrendReport'
import { TREND_WINDOW_GAMES } from '../config/leakRules'

export function computeTrend(games: GameRecord[]): TrendReport {
  const window = games.slice(-TREND_WINDOW_GAMES)
  const wins = window.filter(g => g.result === 'win').length
  const recentWinRate = window.length > 0 ? wins / window.length : 0
  const flagGames = games.filter(g => g.timeLoss).length
  const flagRate = games.length > 0 ? flagGames / games.length : 0
  const recentRatingDelta = window.length >= 2
    ? window[window.length - 1].myElo - window[0].myElo
    : 0
  const dominantTermination: TrendReport['dominantTermination'] =
    flagRate > 0.4 ? 'Time forfeit' : flagRate < 0.1 ? 'Normal' : 'mixed'

  return { recentRatingDelta, recentWinRate, flagRate, dominantTermination }
}
