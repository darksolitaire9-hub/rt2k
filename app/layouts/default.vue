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
      <div class="max-w-7xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="font-display font-bold text-xl tracking-tight text-forest dark:text-emerald">
          rt2k
        </NuxtLink>
        
        <div class="flex items-center gap-2 sm:gap-4 overflow-hidden">
          <nav class="flex items-center gap-1 overflow-x-auto no-scrollbar whitespace-nowrap pb-1 -mb-1">
            <NuxtLink 
              to="/analyze" 
              class="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
              :class="route.path === '/analyze' ? 'bg-forest/10 text-forest dark:bg-emerald/10 dark:text-emerald' : 'text-moss dark:text-mint/60 hover:bg-forest/5 dark:hover:bg-emerald/5'"
            >
              Analyze
            </NuxtLink>
            <NuxtLink 
              to="/puzzles" 
              class="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
              :class="route.path.startsWith('/puzzles') ? 'bg-forest/10 text-forest dark:bg-emerald/10 dark:text-emerald' : 'text-moss dark:text-mint/60 hover:bg-forest/5 dark:hover:bg-emerald/5'"
            >
              Puzzles
            </NuxtLink>
            <NuxtLink 
              to="/analyses" 
              class="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
              :class="route.path.startsWith('/analyses') ? 'bg-forest/10 text-forest dark:bg-emerald/10 dark:text-emerald' : 'text-moss dark:text-mint/60 hover:bg-forest/5 dark:hover:bg-emerald/5'"
            >
              Analyses
            </NuxtLink>
            <NuxtLink 
              to="/settings" 
              class="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
              :class="route.path.startsWith('/settings') ? 'bg-forest/10 text-forest dark:bg-emerald/10 dark:text-emerald' : 'text-moss dark:text-mint/60 hover:bg-forest/5 dark:hover:bg-emerald/5'"
            >
              Settings
            </NuxtLink>
          </nav>

          <UButton
            icon="i-lucide-github"
            to="https://github.com/darksolitaire9-hub/rt2k"
            target="_blank"
            variant="ghost"
            color="neutral"
            size="sm"
            aria-label="GitHub Repository"
          />
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

    <main class="flex-1 max-w-7xl mx-auto w-full px-6 md:px-8 py-8 overflow-x-hidden">
      <slot />
    </main>

    <!-- Global Action Thumb Zone (Placeholder for future navigation/actions) -->
    <div class="fixed bottom-0 left-0 right-0 p-6 pointer-events-none z-30 flex justify-center">
      <div class="max-w-7xl w-full flex justify-end pointer-events-auto">
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
