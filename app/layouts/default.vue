<script setup lang="ts">
const { progress, isLoading } = useLoadingIndicator()
const route = useRoute()
</script>

<template>
  <div class="min-h-screen flex flex-col bg-background">
    <header class="border-b border-default sticky top-0 z-10 bg-background/80 backdrop-blur-md">
      <div class="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <NuxtLink to="/analyze" class="font-bold text-lg tracking-tight">rt2k</NuxtLink>
        <nav class="flex items-center gap-1">
          <UButton
            variant="ghost"
            size="sm"
            to="/analyze"
            :color="route.path === '/analyze' ? 'primary' : 'neutral'"
          >
            Analyse
          </UButton>
          <UButton
            variant="ghost"
            size="sm"
            to="/puzzles"
            :color="route.path.startsWith('/puzzles') ? 'primary' : 'neutral'"
          >
            Puzzles
          </UButton>
        </nav>
      </div>
      <UProgress
        v-if="isLoading"
        :value="progress"
        :max="100"
        size="xs"
        class="absolute bottom-0 left-0 right-0 rounded-none"
      />
    </header>

    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>
