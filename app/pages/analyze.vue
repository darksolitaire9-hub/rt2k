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

const { getWarning } = useNarrative()
const { unsolvedPuzzles } = usePuzzles()

const allPuzzlesSolved = computed(() => {
  return puzzleCount.value > 0 && unsolvedPuzzles.value.length === 0 && !backgroundRunning.value
})

const backgroundMessage = computed(() => {
  if (!backgroundRunning.value) return ''
  const { stage, current, total } = backgroundProgress.value
  if (stage === 'evaluating' && total > 0) return `Checking more positions... ${current}/${total}`
  return 'Scanning more of your games...'
})

const openingOpen = ref(false)
</script>

<template>
  <div class="space-y-12 pb-24">
    <!-- State: Initial Loading -->
    <AnalysisLoadingScreen
      v-if="loading && !hasResult"
      :stage="progress.stage"
      :current="progress.current"
      :total="progress.total"
    />

    <!-- State: Ready to Upload -->
    <div v-if="!hasResult && !loading" class="space-y-12">
      <div class="space-y-4 text-center">
        <h1 class="stm-heading text-4xl text-charcoal dark:text-white">
          Analyze your form
        </h1>
        <p class="text-moss dark:text-mint/60 max-w-sm mx-auto font-medium">
          Upload your PGN and let's see what's holding you back from 2000.
        </p>
      </div>
      
      <PgnUploadCard
        :loading="loading"
        @analyze="analyze"
        @pre-load="preLoad"
        @pre-analyze="(pgn, u, days) => preAnalyze(pgn, u, days)"
      />
    </div>

    <!-- State: Error -->
    <div v-if="error" class="stm-card border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 space-y-4">
      <div class="flex items-center gap-3 text-red-600 dark:text-red-400 font-bold uppercase tracking-widest text-xs">
        <UIcon name="i-lucide-alert-circle" class="size-5" />
        Analysis Failed
      </div>
      <p class="text-red-800 dark:text-red-200 font-medium">{{ error }}</p>
      <button class="stm-button-hero bg-red-600 dark:bg-red-500" @click="hasResult = false">
        Try again
      </button>
    </div>

    <!-- State: Results -->
    <template v-if="hasResult">
      <div class="space-y-4 text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sage/30 dark:bg-emerald/10 text-forest dark:text-emerald text-[10px] uppercase font-bold tracking-widest">
          <div v-if="backgroundRunning" class="size-1.5 rounded-full bg-forest dark:bg-emerald animate-ping" />
          {{ backgroundRunning ? 'Live Analysis' : 'Analysis Complete' }}
        </div>
        <h1 class="stm-heading text-4xl text-charcoal dark:text-white">
          Your Report
        </h1>
      </div>

      <!-- Background progress message -->
      <div v-if="backgroundRunning && backgroundMessage" class="flex items-center gap-2 text-xs font-medium text-moss dark:text-mint/50">
        <div class="size-1.5 rounded-full bg-forest dark:bg-emerald animate-ping shrink-0" />
        {{ backgroundMessage }}
      </div>

      <!-- Partial analysis notice -->
      <div v-if="isPartial" class="flex items-center gap-3 px-4 py-3 rounded-[--radius-stm] bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
        <UIcon name="i-lucide-clock" class="size-4 text-amber-500 shrink-0" />
        <p class="text-xs font-medium text-amber-800 dark:text-amber-200">
          {{ getWarning('clockless') }}
        </p>
      </div>

      <!-- Puzzle Hero CTA -->
      <div v-if="puzzleCount > 0" class="stm-card bg-forest dark:bg-emerald text-white border-0 space-y-6">
        <div class="flex items-start justify-between">
          <div class="space-y-1">
            <h2 class="stm-heading text-3xl">
              {{ allPuzzlesSolved ? 'Puzzles Done!' : `${unsolvedPuzzles.length} Puzzles` }}
            </h2>
            <p class="text-white/70 font-medium text-sm">
              {{ allPuzzlesSolved ? 'You caught all the crucial mistakes. Great work.' : 'Custom-built from your actual mistakes.' }}
            </p>
          </div>
          <UIcon :name="allPuzzlesSolved ? 'i-lucide-award' : 'i-lucide-sparkles'" class="size-10 text-white/30" />
        </div>
        
        <button 
          v-if="!allPuzzlesSolved"
          class="w-full min-h-[56px] bg-white text-forest dark:text-emerald font-display font-bold uppercase tracking-wider rounded-[--radius-stm] flex items-center justify-center transition-transform active:scale-[0.98]"
          @click="navigateTo('/puzzles')"
        >
          Train now
        </button>
        <div 
          v-else
          class="w-full min-h-[56px] bg-white/10 text-white font-display font-bold uppercase tracking-wider rounded-[--radius-stm] flex items-center justify-center border border-white/20"
        >
          Analysis Exhausted
        </div>
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

      <!-- Leaks Section -->
      <section v-if="leaks.length" class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="stm-heading text-2xl text-charcoal dark:text-white">Top Leaks</h2>
          <span class="text-[10px] uppercase font-bold tracking-widest text-moss/40">Sorted by impact</span>
        </div>
        
        <div class="space-y-4">
          <LeakCard
            v-for="leak in leaks.slice(0, 3)"
            :key="leak.type"
            :leak="leak"
            @train="(type) => navigateTo({ path: '/puzzles', query: { type } })"
          />
        </div>
      </section>

      <!-- Opening Breakdown (Effortless UI) -->
      <div v-if="openingStats.length" class="stm-card p-0 overflow-hidden">
        <button
          class="w-full flex items-center justify-between p-6 text-left"
          @click="openingOpen = !openingOpen"
          aria-expanded="openingOpen"
        >
          <div class="space-y-1">
            <h2 class="stm-heading text-xl text-charcoal dark:text-white">Opening Performance</h2>
            <p class="text-xs font-medium text-moss dark:text-mint/40">Where you're losing the game early</p>
          </div>
          <UIcon
            :name="openingOpen ? 'i-lucide-minus' : 'i-lucide-plus'"
            class="size-6 text-forest dark:text-emerald"
          />
        </button>

        <div v-if="openingOpen" class="px-6 pb-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div 
            v-for="row in openingStats.slice(0, 8)" 
            :key="row.name"
            class="space-y-3 pb-6 border-b border-gray-50 dark:border-forest/5 last:border-0 last:pb-0"
          >
            <!-- Header: Name + Verdict -->
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-0.5 min-w-0">
                <div class="text-sm font-bold text-charcoal dark:text-white truncate" :title="row.name">{{ row.name }}</div>
                <div class="text-[10px] uppercase font-bold text-moss/50 tracking-wider">{{ row.games }} games played</div>
              </div>
              <div 
                class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest shrink-0"
                :class="row.winRate <= 35 ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : row.winRate >= 55 ? 'bg-forest/10 text-forest dark:bg-emerald/10 dark:text-emerald' : 'bg-gray-100 text-moss dark:bg-white/5 dark:text-mint/50'"
              >
                {{ row.winRate <= 35 ? 'Critical Leak' : row.winRate >= 55 ? 'Main Weapon' : 'Developing' }}
              </div>
            </div>

            <!-- Visual Bar: Win / Draw / Loss -->
            <div class="space-y-1.5">
              <div class="h-2 w-full flex rounded-full overflow-hidden bg-gray-100 dark:bg-white/5">
                <div 
                  class="h-full bg-forest dark:bg-emerald transition-all duration-1000" 
                  :style="{ width: `${row.winRate}%` }" 
                  :title="`Wins: ${row.winRate}%`"
                />
                <!-- Simplified for now: assuming 5% draws if data not split, or just showing win vs not-win -->
                <div 
                  class="h-full bg-red-500 dark:bg-red-400 opacity-80 transition-all duration-1000" 
                  :style="{ width: `${100 - row.winRate}%` }" 
                  :title="`Losses/Draws: ${100 - row.winRate}%`"
                />
              </div>
              <div class="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-moss/40 dark:text-mint/20">
                <span>Wins: {{ row.winRate }}%</span>
                <span>Losses/Draws: {{ 100 - row.winRate }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Action -->
      <div class="pt-8 space-y-4">
        <button 
          class="stm-button-hero bg-sage dark:bg-deep-sage text-forest dark:text-white"
          @click="hasResult = false"
        >
          New Analysis
        </button>
        <p class="text-center text-[10px] uppercase font-bold tracking-widest text-moss/40">
          Road to 2000 — Keep Grinding
        </p>
      </div>

    </template>
  </div>
</template>
