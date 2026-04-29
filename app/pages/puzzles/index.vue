<script setup lang="ts">
const { puzzles } = usePuzzles()

function solve(id: string) {
  navigateTo(`/puzzles/${id}`)
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 space-y-6">
    <header class="flex items-center gap-3">
      <UButton
        variant="ghost"
        icon="i-heroicons-arrow-left"
        to="/analyze"
        aria-label="Back to analysis"
      />
      <h1 class="text-2xl font-bold">Puzzles</h1>
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

    <div v-else class="space-y-3">
      <PuzzleListItem
        v-for="puzzle in puzzles"
        :key="puzzle.id"
        :puzzle="puzzle"
        @solve="solve(puzzle.id)"
      />
    </div>
  </div>
</template>
