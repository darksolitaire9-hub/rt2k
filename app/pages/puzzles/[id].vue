<script setup lang="ts">
const route = useRoute()
const { allPuzzles, findById } = usePuzzles()
const { markPuzzleSolved } = useAnalysis()

const puzzle = computed(() => findById(route.params.id as string))

const currentIndex = computed(() => allPuzzles.value.findIndex(p => p.id === route.params.id))
const prevId = computed(() => allPuzzles.value[currentIndex.value - 1]?.id ?? null)
const nextId = computed(() => allPuzzles.value[currentIndex.value + 1]?.id ?? null)

async function onSolved() {
  if (!puzzle.value) return
  
  // Mark as solved
  markPuzzleSolved(puzzle.value.id)
  
  // Auto-navigate after delay
  if (nextId.value) {
    setTimeout(() => {
      // Check if we are still on the same puzzle before navigating
      if (route.params.id === puzzle.value?.id) {
        navigateTo(`/puzzles/${nextId.value}`)
      }
    }, 1500)
  }
}
</script>

<template>
  <div class="space-y-6 pb-24">
    <!-- Nav bar -->
    <div class="flex items-center gap-3">
      <button
        class="p-2 rounded-[--radius-stm] bg-white dark:bg-ink border border-gray-200 dark:border-forest/20 shadow-[--shadow-stm] dark:shadow-[--shadow-stm-dark] transition-colors hover:border-forest dark:hover:border-emerald"
        aria-label="Back to puzzles"
        @click="navigateTo('/puzzles')"
      >
        <UIcon name="i-lucide-arrow-left" class="size-5 text-charcoal dark:text-white/80" />
      </button>
      <div>
        <p class="text-[10px] uppercase font-bold tracking-widest text-moss/40 dark:text-mint/30">Training</p>
        <h1 class="stm-heading text-xl text-charcoal dark:text-white">
          Puzzle {{ currentIndex + 1 }}
          <span class="text-moss dark:text-mint/40 font-medium text-base">/ {{ allPuzzles.length }}</span>
        </h1>
      </div>
    </div>

    <!-- Not found -->
    <div v-if="!puzzle" class="stm-card border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 space-y-4">
      <div class="flex items-center gap-3 text-red-600 dark:text-red-400 font-bold uppercase tracking-widest text-xs">
        <UIcon name="i-lucide-alert-circle" class="size-5" />
        Puzzle not found
      </div>
      <p class="text-sm font-medium text-red-800 dark:text-red-200">This puzzle doesn't exist or your session has expired.</p>
      <button class="stm-button-hero bg-red-600 dark:bg-red-500" @click="navigateTo('/analyze')">
        Back to Analyse
      </button>
    </div>

    <template v-else>
      <PuzzleBoard :puzzle="puzzle" @solved="onSolved" />

      <!-- Prev / Next -->
      <div class="flex gap-3">
        <button
          class="flex-1 min-h-[48px] rounded-[--radius-stm] border-2 font-bold uppercase tracking-wider text-sm transition-colors flex items-center justify-center gap-2"
          :class="prevId
            ? 'border-forest dark:border-emerald text-forest dark:text-emerald hover:bg-sage/20 dark:hover:bg-emerald/5'
            : 'border-gray-200 dark:border-forest/10 text-gray-300 dark:text-white/20 cursor-not-allowed'"
          :disabled="!prevId"
          @click="prevId && navigateTo(`/puzzles/${prevId}`)"
        >
          <UIcon name="i-lucide-arrow-left" class="size-4" />
          Prev
        </button>
        <button
          class="flex-1 min-h-[48px] rounded-[--radius-stm] border-2 font-bold uppercase tracking-wider text-sm transition-colors flex items-center justify-center gap-2"
          :class="nextId
            ? 'border-forest dark:border-emerald text-forest dark:text-emerald hover:bg-sage/20 dark:hover:bg-emerald/5'
            : 'border-gray-200 dark:border-forest/10 text-gray-300 dark:text-white/20 cursor-not-allowed'"
          :disabled="!nextId"
          @click="nextId && navigateTo(`/puzzles/${nextId}`)"
        >
          Next
          <UIcon name="i-lucide-arrow-right" class="size-4" />
        </button>
      </div>
    </template>
  </div>
</template>
