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
  leaks,
  isPartial,
  analyze,
} = useAnalysis()
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 space-y-6">
    <header class="text-center space-y-1">
      <h1 class="text-2xl font-bold tracking-tight">rt2k</h1>
      <p class="text-gray-500 text-sm">Upload your games, find your leaks.</p>
    </header>

    <PgnUploadCard :loading="loading" @analyze="analyze" />

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
      />

      <section v-if="leaks.length" class="space-y-4">
        <h2 class="text-lg font-semibold">Your top leaks</h2>
        <LeakCard
          v-for="leak in leaks.slice(0, 3)"
          :key="leak.type"
          :leak="leak"
          @train="navigateTo('/puzzles')"
        />
      </section>

      <UAlert
        v-else
        color="success"
        variant="soft"
        title="No significant leaks detected"
        description="No major patterns found in these games."
      />
    </template>
  </div>
</template>
