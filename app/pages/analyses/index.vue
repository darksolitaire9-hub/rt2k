<script setup lang="ts">
import { useRepository } from '~/composables/useRepository'
import type { AnalysisRun } from '#shared/domain/entities/AnalysisRun'
import { ref, onMounted } from 'vue'

const repo = useRepository()
const analyses = ref<AnalysisRun[]>([])
const loading = ref(true)

onMounted(async () => {
  analyses.value = await repo.listByUser('local')
  // Sort descending by date
  analyses.value.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  loading.value = false
})

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(iso))
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-display font-bold tracking-tight text-forest dark:text-emerald">My Analyses</h1>
      <p class="text-moss dark:text-mint/80 mt-2">History of your local analysis runs.</p>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-forest/50" />
    </div>
    
    <div v-else-if="analyses.length === 0" class="text-center py-12 border-2 border-dashed border-sand/50 rounded-xl">
      <UIcon name="i-lucide-history" class="w-12 h-12 mx-auto text-moss/30 mb-4" />
      <h3 class="text-lg font-medium text-forest dark:text-emerald">No analyses yet</h3>
      <p class="text-moss dark:text-mint/60 mt-1 mb-6">Analyze your games to start seeing history here.</p>
      <UButton to="/analyze" icon="i-lucide-play">New Analysis</UButton>
    </div>

    <div v-else class="space-y-4">
      <UCard v-for="run in analyses" :key="run.id" class="relative group hover:border-forest/30 transition-colors">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-bold text-forest dark:text-emerald">
              {{ run.gamesCount }} Games Analyzed
            </h3>
            <p class="text-xs text-moss dark:text-mint/60 mt-1">
              {{ formatDate(run.createdAt) }}
            </p>
          </div>
          <UBadge v-if="run.isPartial" color="warning" variant="subtle" size="sm">Partial</UBadge>
          <UBadge v-else color="success" variant="subtle" size="sm">Complete</UBadge>
        </div>
      </UCard>
    </div>
  </div>
</template>
