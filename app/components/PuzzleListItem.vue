<script setup lang="ts">
defineProps<{
  puzzle: {
    id: string
    sourceGameId: string
    sourceMoveNumber: number
    fen: string
    bestMove: string
    playedMove: string
    theme: string | null
    ratingHint: number | null
  }
}>()

defineEmits<{ solve: [] }>()
</script>

<template>
  <UCard>
    <div class="flex items-center justify-between gap-3">
      <div class="min-w-0 space-y-1">
        <p class="text-sm font-medium truncate">
          From your game · move {{ puzzle.sourceMoveNumber }}
        </p>
        <div class="flex flex-wrap gap-1">
          <UBadge v-if="puzzle.theme" color="neutral" variant="soft" size="sm">
            {{ puzzle.theme }}
          </UBadge>
          <UBadge v-if="puzzle.ratingHint" color="primary" variant="soft" size="sm">
            ~{{ puzzle.ratingHint }}
          </UBadge>
        </div>
      </div>
      <UButton size="sm" class="shrink-0" @click="$emit('solve')">
        Solve
      </UButton>
    </div>
  </UCard>
</template>
