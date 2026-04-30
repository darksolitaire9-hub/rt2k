<script setup lang="ts">
const {
  loading,
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
} = useAnalysis()

const openingOpen = ref(false)
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 space-y-6">
    <PgnUploadCard :loading="loading" @analyze="analyze" />

    <UCard v-if="loading">
      <div class="space-y-2">
        <p class="text-sm text-gray-500">Analysing your games…</p>
        <UProgress animation="carousel" size="sm" />
      </div>
    </UCard>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      :title="error"
    />

    <UAlert
      v-if="hasResult && isPartial"
      color="warning"
      variant="soft"
      title="Analysis incomplete"
      description="Some games are missing engine evaluations or clock data. Leak scores are estimates."
    />

    <template v-if="hasResult">
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

      <UAlert
        v-else
        color="success"
        variant="soft"
        title="No significant leaks detected"
        description="No major patterns found in these games."
      />

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
