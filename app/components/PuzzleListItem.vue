<script setup lang="ts">
defineProps<{
  puzzle: {
    id: string
    sourceGameId: string
    sourceMoveNumber: number
    sourceOpponent: string
    sourceDate: string
    fen: string
    solution: string
    clockAtMoment: number | null
    leakType: string
  }
  solved?: boolean
}>()

defineEmits<{ solve: [] }>()

const LEAK_LABELS: Record<string, string> = {
  FLAG_RISK: 'Time Risk',
  PRE_FLAG_BLUNDER: 'Pre-Flag',
  TACTICAL_MISS: 'Tactics',
  EARLY_RESIGNATION: 'Early Resign',
}
</script>

<template>
  <UCard>
    <div class="flex items-center justify-between gap-3">
      <div class="min-w-0 space-y-1">
        <p class="text-sm font-medium truncate">
          vs {{ puzzle.sourceOpponent }} · {{ puzzle.sourceDate }}
        </p>
        <p class="text-xs text-muted">
          Move {{ puzzle.sourceMoveNumber }}
        </p>
        <div class="flex flex-wrap gap-1 mt-1">
          <UBadge color="neutral" variant="soft" size="sm">
            {{ LEAK_LABELS[puzzle.leakType] ?? puzzle.leakType }}
          </UBadge>
          <UBadge v-if="solved" color="success" variant="soft" size="sm" icon="i-heroicons-check">
            Solved
          </UBadge>
        </div>
      </div>
      <UButton size="sm" class="shrink-0" @click="$emit('solve')">
        {{ solved ? 'Review' : 'Solve' }}
      </UButton>
    </div>
  </UCard>
</template>
