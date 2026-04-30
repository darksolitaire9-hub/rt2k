<script setup lang="ts">
const route = useRoute()
const { puzzles } = usePuzzles()

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
  <div class="max-w-2xl mx-auto px-4 py-8 space-y-6">
    <header class="flex items-center justify-between gap-3">
      <h1 class="text-2xl font-bold">Puzzles</h1>
      <UButton
        v-if="typeFilter"
        variant="ghost"
        size="sm"
        icon="i-heroicons-x-mark"
        trailing
        @click="navigateTo('/puzzles')"
      >
        Clear filter
      </UButton>
    </header>

    <UAlert
      v-if="!puzzles.length"
      color="warning"
      variant="soft"
      title="No puzzles yet"
      description="Upload and analyse a PGN first to generate puzzles from your games."
    >
      <template #footer>
        <UButton to="/analyze" size="sm">Go to Analyse</UButton>
      </template>
    </UAlert>

    <UAlert
      v-else-if="!filtered.length"
      color="neutral"
      variant="soft"
      :title="`No puzzles for this leak type`"
      description="Try a different filter or clear it to see all puzzles."
    />

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
