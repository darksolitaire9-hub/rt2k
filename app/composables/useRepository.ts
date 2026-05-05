import { IndexedDbAnalysisRepositoryAdapter } from '../adapters/repository/IndexedDbAnalysisRepositoryAdapter'

let repoInstance: IndexedDbAnalysisRepositoryAdapter | null = null

export function useRepository() {
  if (repoInstance) return repoInstance

  repoInstance = new IndexedDbAnalysisRepositoryAdapter()
  return repoInstance
}
