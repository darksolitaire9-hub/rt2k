<script setup lang="ts">
defineProps<{
  totalGames: number
  wins: number
  losses: number
  draws: number
  timeLosses: number
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
          <p class="text-xs text-gray-500 mt-1">Games parsed</p>
        </div>
        <div>
          <p class="text-3xl font-bold text-red-500">{{ timeLosses }}</p>
          <p class="text-xs text-gray-500 mt-1">Time losses</p>
        </div>
      </div>

      <div class="flex justify-center gap-6 text-sm font-semibold">
        <span class="text-green-600">{{ wins }} W</span>
        <span class="text-gray-400">/</span>
        <span class="text-red-500">{{ losses }} L</span>
        <span class="text-gray-400">/</span>
        <span class="text-gray-500">{{ draws }} D</span>
      </div>
    </div>
  </UCard>
</template>
