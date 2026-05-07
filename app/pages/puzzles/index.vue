<script setup lang="ts">
const route = useRoute()
const { result } = useAnalysis()
const { getEmptyState } = useNarrative()
const { activePuzzles, solvedPuzzles, allPuzzles } = usePuzzles()

const activeTab = ref<'todo' | 'completed'>('todo')

const typeFilter = computed(() => route.query.type as string | undefined)

const filtered = computed(() => {
  const source = activeTab.value === 'todo' ? activePuzzles.value : solvedPuzzles.value
  return typeFilter.value
    ? source.filter(p => p.leakType === typeFilter.value)
    : source
})

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

    <!-- Tab Switcher -->
    <div v-if="allPuzzles.length > 0" class="flex p-1 gap-1 rounded-[--radius-stm] bg-sage/20 dark:bg-forest/10 border border-sage/30 dark:border-forest/20">
      <button
        class="flex-1 py-2 text-[10px] uppercase font-bold tracking-widest rounded-sm transition-all"
        :class="activeTab === 'todo' ? 'bg-white dark:bg-forest text-forest dark:text-emerald shadow-sm' : 'text-moss/50 dark:text-mint/30 hover:text-moss dark:hover:text-mint/50'"
        @click="activeTab = 'todo'"
      >
        To Do ({{ activePuzzles.length }})
      </button>
      <button
        class="flex-1 py-2 text-[10px] uppercase font-bold tracking-widest rounded-sm transition-all"
        :class="activeTab === 'completed' ? 'bg-white dark:bg-forest text-forest dark:text-emerald shadow-sm' : 'text-moss/50 dark:text-mint/30 hover:text-moss dark:hover:text-mint/50'"
        @click="activeTab = 'completed'"
      >
        History ({{ solvedPuzzles.length }})
      </button>
    </div>

    <!-- Empty: no puzzles at all -->
    <div v-if="!allPuzzles.length" class="stm-card space-y-4 text-center py-12">
      <UIcon name="i-lucide-puzzle" class="size-12 text-forest/20 dark:text-emerald/20 mx-auto" />
      <div class="space-y-1">
        <h2 class="stm-heading text-xl text-charcoal dark:text-white">No puzzles yet</h2>
        <p class="text-sm font-medium text-moss dark:text-mint/50">
          {{ getEmptyState('noPuzzles') }}
        </p>
      </div>
      <button class="stm-button-hero" @click="navigateTo('/analyze')">
        Go to Analyse
      </button>
    </div>

    <!-- Empty: filter active but no matches -->
    <div v-else-if="!filtered.length && typeFilter" class="stm-card space-y-2 text-center py-10">
      <h2 class="stm-heading text-lg text-charcoal dark:text-white">No puzzles for this leak type</h2>
      <p class="text-sm font-medium text-moss dark:text-mint/50">Try a different filter or clear it to see all puzzles.</p>
    </div>

    <!-- Empty: Tab specific -->
    <div v-else-if="!filtered.length" class="stm-card space-y-4 text-center py-12">
      <template v-if="activeTab === 'todo'">
        <UIcon name="i-lucide-check-circle" class="size-12 text-forest dark:text-emerald mx-auto" />
        <div class="space-y-1">
          <h2 class="stm-heading text-xl text-charcoal dark:text-white">All caught up!</h2>
          <p class="text-sm font-medium text-moss dark:text-mint/50">
            {{ getEmptyState('allCaughtUp') }}
          </p>
        </div>
      </template>
      <template v-else>
        <UIcon name="i-lucide-history" class="size-12 text-forest/20 dark:text-emerald/20 mx-auto" />
        <div class="space-y-1">
          <h2 class="stm-heading text-xl text-charcoal dark:text-white">No history yet</h2>
          <p class="text-sm font-medium text-moss dark:text-mint/50">
            {{ getEmptyState('noHistory') }}
          </p>
        </div>
      </template>
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
