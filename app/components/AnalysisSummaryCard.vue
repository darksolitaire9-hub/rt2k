<script setup lang="ts">
defineProps<{
  totalGames: number
  wins: number
  losses: number
  draws: number
  timeLosses: number
  winRate: number
  ratingRange: { min: number; max: number } | null
}>()
</script>

<template>
  <div class="stm-card" role="region" aria-label="Performance Summary">
    <div class="space-y-1 mb-8 text-center">
      <div 
        class="text-[10px] uppercase tracking-[0.2em] font-bold"
        :class="winRate >= 55 ? 'text-forest dark:text-emerald' : winRate <= 40 ? 'text-red-600 dark:text-red-400' : 'text-moss/60 dark:text-mint/30'"
      >
        {{ winRate >= 55 ? 'Peak Performance' : winRate <= 40 ? 'In a Slump' : 'Steady Progress' }}
      </div>
      <h2 class="stm-heading text-2xl text-charcoal dark:text-white">
        {{ winRate >= 55 ? "You're crushing it, bro!" : winRate <= 40 ? "Tough run lately." : "Keep grinding." }}
      </h2>
    </div>

    <div class="grid grid-cols-2 gap-8 mb-8">
      <div class="text-center" role="group" aria-label="Total games analyzed">
        <div class="text-4xl stm-heading text-forest dark:text-emerald mb-1">
          {{ totalGames }}
        </div>
        <div class="text-[10px] uppercase font-bold tracking-wider text-moss dark:text-mint/50">
          Games Analyzed
        </div>
      </div>
      <div class="text-center" role="group" aria-label="Win rate percentage">
        <div class="text-4xl stm-heading text-forest dark:text-emerald mb-1">
          {{ winRate }}%
        </div>
        <div class="text-[10px] uppercase font-bold tracking-wider text-moss dark:text-mint/50">
          Win Rate
        </div>
      </div>
    </div>

    <div class="flex items-center justify-center gap-4 py-4 border-y border-gray-100 dark:border-forest/10" role="group" aria-label="Win loss draw breakdown">
      <div class="flex flex-col items-center">
        <span class="text-lg font-bold text-forest dark:text-emerald">{{ wins }}</span>
        <span class="text-[10px] uppercase font-bold text-moss/50">Wins</span>
      </div>
      <div class="w-px h-6 bg-gray-100 dark:bg-forest/10" aria-hidden="true" />
      <div class="flex flex-col items-center">
        <span class="text-lg font-bold text-red-600 dark:text-red-400">{{ losses }}</span>
        <span class="text-[10px] uppercase font-bold text-moss/50">Losses</span>
      </div>
      <div class="w-px h-6 bg-gray-100 dark:bg-forest/10" aria-hidden="true" />
      <div class="flex flex-col items-center">
        <span class="text-lg font-bold text-moss/70">{{ draws }}</span>
        <span class="text-[10px] uppercase font-bold text-moss/50">Draws</span>
      </div>
    </div>

    <div v-if="timeLosses > 0 || ratingRange" class="mt-6 space-y-2">
      <div v-if="timeLosses > 0" class="flex items-center justify-center gap-2 text-xs font-medium text-red-600 dark:text-red-400">
        <UIcon name="i-lucide-clock" class="size-3.5" />
        {{ timeLosses }} losses on time
      </div>
      <div v-if="ratingRange" class="text-[10px] text-center uppercase tracking-widest text-moss/40 font-bold">
        Elo: {{ ratingRange.min }} — {{ ratingRange.max }}
      </div>
    </div>
  </div>
</template>
