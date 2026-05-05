import type { AnalysisRun } from '../entities/AnalysisRun'
import type { GameRecord } from '../entities/GameRecord'
import type { Leak } from '../entities/Leak'
import type { UserPuzzle } from '../entities/UserPuzzle'

export interface IAnalysisRepositoryPort {
  save(run: AnalysisRun, games: GameRecord[], leaks: Leak[], puzzles: UserPuzzle[]): Promise<void>
  findById(id: string): Promise<AnalysisRun | null>
  listByUser(userId: string): Promise<AnalysisRun[]>
  getLatestAnalysis(): Promise<{ run: AnalysisRun; games: GameRecord[]; leaks: Leak[]; puzzles: UserPuzzle[] } | null>
  updatePuzzleSolved(id: string): Promise<void>
}
