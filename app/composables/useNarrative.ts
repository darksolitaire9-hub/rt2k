import { NARRATIVE, getRandomNarrative } from '#shared/domain/services/NarrativeService'

export function useNarrative() {
  const getLoadingMessage = (stage: string) => {
    return getRandomNarrative('loading', stage)
  }

  const getWarning = (key: keyof typeof NARRATIVE.warnings) => {
    return NARRATIVE.warnings[key]
  }

  const getEmptyState = (key: keyof typeof NARRATIVE.empty) => {
    return NARRATIVE.empty[key]
  }

  return {
    getLoadingMessage,
    getWarning,
    getEmptyState,
    NARRATIVE
  }
}
