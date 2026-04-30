<script setup lang="ts">
const {
loading,
progress,
error,
hasResult,
totalGames,
wins,
losses,
draws,
timeLosses,
winRate,
ratingRange,
openingStats,
leaks,
isPartial,
analyze,
preLoad,
} = useAnalysis()
const progressMessage = computed(() => {
if (!loading.value) return ''
const { stage, current, total } = progress.value
if (stage === 'parsing') return 'Parsing PGN...'
if (stage === 'detecting') return 'Detecting patterns...'
if (stage === 'evaluating') {
  return `Checking mistakes... (${current}/${total})`
}
return 'Starting analysis...'
})

const openingOpen = ref(false)
</script>

<template>
<div class="max-w-2xl mx-auto px-4 py-8 space-y-6">
  <div v-if="loading && !hasResult" class="flex flex-col items-center justify-center py-12 space-y-4">
    <UIcon name="i-heroicons-arrow-path" class="size-8 animate-spin text-primary" />
    <div class="text-center">
      <p class="font-medium">{{ progressMessage }}</p>
      <p class="text-sm text-muted">This may take a minute for large files.</p>
    </div>
  </div>

  <PgnUploadCard v-if="!hasResult && !loading" :loading="loading" @analyze="analyze" @pre-load="preLoad" />
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      :title="error"
      class="cursor-pointer"
      @click="hasResult = false; error = null"
    >
      <template #description>
        Click here to try again with a different file.
      </template>
    </UAlert>

    <UAlert
      v-if="hasResult && isPartial"
      color="warning"
      variant="soft"
      title="Analysis incomplete"
      description="Some games were skipped due to size limits or missing data. Results are based on the most recent 100 games."
    />

    <template v-if="hasResult">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold">Analysis Results</h1>
        <UButton 
          variant="ghost" 
          color="neutral" 
          size="sm" 
          icon="i-heroicons-arrow-path"
          @click="hasResult = false"
        >
          New Analysis
        </UButton>
      </div>

      <AnalysisSummaryCard
        :total-games="totalGames"
        :wins="wins"
        :losses="losses"
        :draws="draws"
        :time-losses="timeLosses"
        :win-rate="winRate"
        :rating-range="ratingRange"
      />

      <section v-if="leaks.length" class="space-y-4">
        <h2 class="text-lg font-semibold">Your top leaks</h2>
        <LeakCard
          v-for="leak in leaks.slice(0, 3)"
          :key="leak.type"
          :leak="leak"
          @train="(type) => navigateTo({ path: '/puzzles', query: { type } })"
        />
      </section>

      <div v-else class="space-y-4">
        <UAlert
          color="success"
          variant="soft"
          title="No significant leaks detected"
          description="No major patterns found in these games. Great job!"
        />
        <UButton block variant="outline" @click="hasResult = false">
          Upload more games
        </UButton>
      </div>

      <UCard v-if="openingStats.length">
        <template #header>
          <button
            class="flex items-center justify-between w-full text-left"
            :aria-expanded="openingOpen"
            @click="openingOpen = !openingOpen"
          >
            <h2 class="text-lg font-semibold">Opening breakdown</h2>
            <UIcon
              :name="openingOpen ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
              class="size-4 text-muted"
            />
          </button>
        </template>

        <div v-if="openingOpen" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-muted border-b border-default">
                <th class="pb-2 font-medium">Opening</th>
                <th class="pb-2 font-medium text-right">Games</th>
                <th class="pb-2 font-medium text-right">Win %</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in openingStats"
                :key="row.name"
                class="border-b border-default last:border-0"
                :class="row.winRate <= 33 ? 'text-error' : ''"
              >
                <td class="py-1.5 pr-4 truncate max-w-[180px]">{{ row.name }}</td>
                <td class="py-1.5 text-right">{{ row.games }}</td>
                <td class="py-1.5 text-right">{{ row.winRate }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </template>
  </div>
</template>
