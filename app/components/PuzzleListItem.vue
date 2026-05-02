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
  <div class="stm-card flex items-center justify-between gap-4 py-4 px-5">
    <div class="min-w-0 space-y-1">
      <p class="text-sm font-bold text-charcoal dark:text-white truncate">
        vs {{ puzzle.sourceOpponent }}
      </p>
      <p class="text-xs font-medium text-moss dark:text-mint/50">
        Move {{ puzzle.sourceMoveNumber }} · {{ puzzle.sourceDate }}
      </p>
      <div class="flex flex-wrap gap-1.5 mt-1.5">
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-sage/50 dark:bg-forest/20 text-forest dark:text-emerald border border-sage dark:border-forest/30">
          {{ LEAK_LABELS[puzzle.leakType] ?? puzzle.leakType }}
        </span>
        <span v-if="solved" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/30">
          <UIcon name="i-lucide-check" class="size-3" />
          Solved
        </span>
      </div>
    </div>
    <button
      class="shrink-0 min-h-[44px] px-5 rounded-[--radius-stm] bg-forest dark:bg-emerald text-white font-bold text-xs uppercase tracking-wider transition-transform active:scale-[0.97]"
      @click="$emit('solve')"
    >
      {{ solved ? 'Review' : 'Solve' }}
    </button>
  </div>
</template>
