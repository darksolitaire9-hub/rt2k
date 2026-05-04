import { IndexedDbAnalysisRepositoryAdapter } from '../adapters/repository/IndexedDbAnalysisRepositoryAdapter'
import { SupabaseAnalysisRepositoryAdapter } from '../adapters/repository/SupabaseAnalysisRepositoryAdapter'
import { SyncingAnalysisRepository } from '../adapters/repository/SyncingAnalysisRepository'

let repoInstance: SyncingAnalysisRepository | null = null

export function useRepository() {
  if (repoInstance) return repoInstance

  const supabase = useSupabaseClient()
  const local = new IndexedDbAnalysisRepositoryAdapter()
  const remote = new SupabaseAnalysisRepositoryAdapter(supabase)
  
  repoInstance = new SyncingAnalysisRepository(local, remote, supabase)
  return repoInstance
}
