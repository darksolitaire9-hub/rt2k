export interface TrendReport {
  recentRatingDelta: number
  recentWinRate: number
  flagRate: number
  dominantTermination: 'Time forfeit' | 'Normal' | 'mixed'
}
