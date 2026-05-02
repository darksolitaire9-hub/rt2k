<script setup lang="ts">
const route = useRoute()
const colorMode = useColorMode()

const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="min-h-screen flex flex-col transition-colors duration-300">
    <!-- Minimal STM Header -->
    <header class="sticky top-0 z-20 bg-sand/80 dark:bg-midnight/80 backdrop-blur-lg">
      <div class="max-w-xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
        <NuxtLink to="/analyze" class="font-display font-bold text-xl tracking-tight text-forest dark:text-emerald">
          rt2k
        </NuxtLink>
        
        <div class="flex items-center gap-4">
          <nav class="flex items-center gap-2">
            <NuxtLink 
              to="/analyze" 
              class="text-sm font-medium transition-colors"
              :class="route.path === '/analyze' ? 'text-forest dark:text-emerald' : 'text-moss dark:text-mint/60'"
            >
              Analyze
            </NuxtLink>
            <NuxtLink 
              to="/puzzles" 
              class="text-sm font-medium transition-colors"
              :class="route.path.startsWith('/puzzles') ? 'text-forest dark:text-emerald' : 'text-moss dark:text-mint/60'"
            >
              Puzzles
            </NuxtLink>
          </nav>

          <UButton
            icon="i-lucide-sun-moon"
            variant="ghost"
            color="neutral"
            size="sm"
            @click="toggleColorMode"
            aria-label="Toggle theme"
          />
        </div>
      </div>
    </header>

    <main class="flex-1 max-w-xl mx-auto w-full px-6 md:px-8 py-8">
      <slot />
    </main>

    <!-- Global Action Thumb Zone (Placeholder for future navigation/actions) -->
    <div class="fixed bottom-0 left-0 right-0 p-6 pointer-events-none z-30 flex justify-center">
      <div class="max-w-xl w-full flex justify-end pointer-events-auto">
        <!-- Persistent buttons could go here -->
      </div>
    </div>
  </div>
</template>

<style>
/* Smooth route transitions */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
