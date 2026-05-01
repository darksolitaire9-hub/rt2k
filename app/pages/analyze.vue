<script setup lang="ts">
const {
  loading,
  backgroundRunning,
  backgroundProgress,
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
  puzzleCount,
  isPartial,
  analyze,
  preLoad,
  preAnalyze,
} = useAnalysis()

const progressMessage = computed(() => {
  if (!loading.value) return ''
  const { stage, current, total } = progress.value
  if (stage === 'parsing') return 'Reading your games...'
  if (stage === 'detecting') return 'Spotting patterns...'
  if (stage === 'evaluating') return `Checking positions... ${current}/${total}`
  return 'Starting up...'
})

const backgroundMessage = computed(() => {
  if (!backgroundRunning.value) return ''
  const { stage, current, total } = backgroundProgress.value
  if (stage === 'evaluating' && total > 0) return `Checking more positions... ${current}/${total}`
  return 'Scanning more of your games...'
})

const openingOpen = ref(false)

onMounted(() => {
  if (typeof PerformanceObserver !== 'undefined') {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn(`[MainThread] ⚠️ Long task detected (${Math.round(entry.duration)}ms) - Check if offloading is working!`);
        }
      }
    });
    observer.observe({ entryTypes: ['longtask'] });
  }
})
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 space-y-6">

    <!-- Initial loading spinner -->
    <div v-if="loading && !hasResult" class="flex flex-col items-center justify-center py-12 space-y-4">
      <UIcon name="i-heroicons-arrow-path" class="size-8 animate-spin text-primary" />
      <div class="text-center">
        <p class="font-medium">{{ progressMessage }}</p>
        <p class="text-sm text-muted">First puzzles coming right up.</p>
      </div>
    </div>

    <PgnUploadCard
      v-if="!hasResult && !loading"
      :loading="loading"
      @analyze="analyze"
      @pre-load="preLoad"
      @pre-analyze="(pgn, u, days) => preAnalyze(pgn, u, days)"
    />

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      :title="error"
      class="cursor-pointer"
      @click="hasResult = false"
    >
      <template #description>Click to try again with a different file.</template>
    </UAlert>

    <UAlert
      v-if="hasResult && isPartial"
      color="warning"
      variant="soft"
      title="Partial analysis"
      description="Results are based on the most recent games in the window — some were skipped due to size limits."
    />

    <template v-if="hasResult">

      <!-- Header row -->
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold">Your results</h1>
        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          icon="i-heroicons-arrow-path"
          @click="hasResult = false"
        >
          New analysis
        </UButton>
      </div>

      <!-- Background analysis banner -->
      <div
        v-if="backgroundRunning"
        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-sm text-primary"
      >
        <UIcon name="i-heroicons-arrow-path" class="size-4 animate-spin shrink-0" />
        <span>{{ backgroundMessage }}</span>
      </div>

      <!-- Puzzle CTA -->
      <UCard v-if="puzzleCount > 0">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="font-semibold text-base">
              {{ puzzleCount }} puzzle{{ puzzleCount !== 1 ? 's' : '' }} ready
              <span v-if="backgroundRunning" class="text-xs font-normal text-muted ml-1">(more coming)</span>
            </p>
            <p class="text-sm text-muted">Positions taken directly from your games</p>
          </div>
          <UButton size="sm" class="cursor-pointer shrink-0" @click="navigateTo('/puzzles')">
            Train now
          </UButton>
        </div>
      </UCard>

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
