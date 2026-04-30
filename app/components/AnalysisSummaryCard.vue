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
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">Summary</h2>
    </template>

    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4 text-center">
        <div>
          <p class="text-3xl font-bold">{{ totalGames }}</p>
          <p class="text-xs text-muted mt-1">Games parsed</p>
        </div>
        <div>
          <p class="text-3xl font-bold">{{ winRate }}%</p>
          <p class="text-xs text-muted mt-1">Win rate</p>
        </div>
      </div>

      <div class="flex justify-center gap-6 text-sm font-semibold">
        <span class="text-success">{{ wins }} W</span>
        <span class="text-muted">/</span>
        <span class="text-error">{{ losses }} L</span>
        <span class="text-muted">/</span>
        <span class="text-muted">{{ draws }} D</span>
      </div>

      <p v-if="timeLosses > 0" class="text-sm text-center text-error">
        You lost {{ timeLosses }} game{{ timeLosses === 1 ? '' : 's' }} on time
      </p>

      <p v-if="ratingRange" class="text-xs text-center text-muted">
        Rating range: {{ ratingRange.min }}–{{ ratingRange.max }}
      </p>
    </div>
  </UCard>
</template>
