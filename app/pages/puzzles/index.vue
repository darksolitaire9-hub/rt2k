<script setup lang="ts">
const route = useRoute()
const { result } = useAnalysis()
const { start } = useTrainingSession()
const { puzzles } = usePuzzles()

// Freeze the current live puzzle list as the training snapshot the moment the
// user enters the puzzle list. This prevents background analysis updates from
// invalidating a puzzle ID the user is currently solving.
onMounted(() => {
  if (result.value?.puzzles?.length) {
    start(result.value.puzzles)
  }
})

const typeFilter = computed(() => route.query.type as string | undefined)

const filtered = computed(() =>
  typeFilter.value
    ? puzzles.value.filter(p => p.leakType === typeFilter.value)
    : puzzles.value,
)

function solve(id: string) {
  navigateTo(`/puzzles/${id}`)
}
</script>

<template>
  <div class="space-y-8 pb-24">
    <!-- Header -->
    <div class="flex items-start justify-between gap-3">
      <div class="space-y-0.5">
        <p class="text-[10px] uppercase font-bold tracking-widest text-moss/40 dark:text-mint/30">Training</p>
        <h1 class="stm-heading text-4xl text-charcoal dark:text-white">Puzzles</h1>
      </div>
      <button
        v-if="typeFilter"
        class="flex items-center gap-1.5 px-3 py-1.5 mt-2 text-xs font-bold rounded-full border border-sage dark:border-forest/20 text-moss dark:text-mint/60 bg-sage/30 dark:bg-forest/10 hover:bg-sage dark:hover:bg-forest/20 transition-colors"
        @click="navigateTo('/puzzles')"
      >
        Clear filter
        <UIcon name="i-lucide-x" class="size-3.5" />
      </button>
    </div>

    <!-- Empty: no puzzles at all -->
    <div v-if="!puzzles.length" class="stm-card space-y-4 text-center py-12">
      <UIcon name="i-lucide-puzzle" class="size-12 text-forest/20 dark:text-emerald/20 mx-auto" />
      <div class="space-y-1">
        <h2 class="stm-heading text-xl text-charcoal dark:text-white">No puzzles yet</h2>
        <p class="text-sm font-medium text-moss dark:text-mint/50">Upload and analyse a PGN to generate puzzles from your games.</p>
      </div>
      <button class="stm-button-hero" @click="navigateTo('/analyze')">
        Go to Analyse
      </button>
    </div>

    <!-- Empty: filter active but no matches -->
    <div v-else-if="!filtered.length" class="stm-card space-y-2 text-center py-10">
      <h2 class="stm-heading text-lg text-charcoal dark:text-white">No puzzles for this leak type</h2>
      <p class="text-sm font-medium text-moss dark:text-mint/50">Try a different filter or clear it to see all puzzles.</p>
    </div>

    <!-- Puzzle list -->
    <div v-else class="space-y-3">
      <PuzzleListItem
        v-for="puzzle in filtered"
        :key="puzzle.id"
        :puzzle="puzzle"
        @solve="solve(puzzle.id)"
      />
    </div>
  </div>
</template>
