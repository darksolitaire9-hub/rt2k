<script setup lang="ts">
const route = useRoute()
const { puzzles, findById } = usePuzzles()

const puzzle = computed(() => findById(route.params.id as string))

const currentIndex = computed(() => puzzles.value.findIndex(p => p.id === route.params.id))
const prevId = computed(() => puzzles.value[currentIndex.value - 1]?.id ?? null)
const nextId = computed(() => puzzles.value[currentIndex.value + 1]?.id ?? null)
</script>

<template>
  <div class="max-w-lg mx-auto px-4 py-8 space-y-6">
    <header class="flex items-center gap-3">
      <UButton variant="ghost" icon="i-heroicons-arrow-left" to="/puzzles" size="sm" aria-label="Back to puzzles" />
      <h1 class="text-xl font-bold flex-1">Puzzle {{ currentIndex + 1 }} of {{ puzzles.length }}</h1>
    </header>

    <UAlert
      v-if="!puzzle"
      color="error"
      variant="soft"
      title="Puzzle not found"
      description="This puzzle doesn't exist or your session has expired."
    >
      <template #footer>
        <UButton to="/analyze" size="sm">Back to Analyse</UButton>
      </template>
    </UAlert>

    <template v-else>
      <PuzzleBoard :puzzle="puzzle" />

      <div class="flex justify-between gap-2">
        <UButton
          variant="outline"
          :disabled="!prevId"
          @click="prevId && navigateTo(`/puzzles/${prevId}`)"
        >
          Previous
        </UButton>
        <UButton
          variant="outline"
          :disabled="!nextId"
          @click="nextId && navigateTo(`/puzzles/${nextId}`)"
        >
          Next
        </UButton>
      </div>
    </template>
  </div>
</template>
