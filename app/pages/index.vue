<script setup lang="ts">
import { definePageMeta, useSeoMeta, useSchemaOrg, defineWebSite, defineWebPage } from '#imports'

definePageMeta({
  layout: 'default'
})

useSeoMeta({
  title: 'rt2k — Master your chess mistakes',
  description: 'Personalized chess training based on your own games. Analyze your form, detect leaks, and solve custom puzzles to reach 2000 ELO.'
})

useSchemaOrg([
  defineWebSite({
    name: 'rt2k'
  }),
  defineWebPage({
    name: 'rt2k - Personalized Chess Training'
  })
])
</script>

<template>
  <main class="flex flex-col items-center justify-center min-h-screen p-4 text-center">
    <UContainer class="max-w-4xl mx-auto space-y-12">
      <!-- Hero Section -->
      <section class="space-y-6 pt-20">
        <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Stop solving <span class="text-primary-500">generic</span> puzzles.
        </h1>
        <p class="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          rt2k analyzes your actual games using Stockfish 18, detects your personal "leaks", and generates targeted puzzles to help you master the patterns holding you back.
        </p>
        <div class="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <UButton
            id="start-analyzing-btn"
            to="/analyze"
            size="xl"
            color="primary"
            variant="solid"
            aria-label="Start analyzing your games"
            class="w-full sm:w-auto flex justify-center"
          >
            Start Analyzing Now
          </UButton>
          <UButton
            id="view-features-btn"
            href="#features"
            size="xl"
            color="gray"
            variant="ghost"
            aria-label="Learn more about rt2k features"
            class="w-full sm:w-auto flex justify-center"
          >
            Learn More
          </UButton>
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="grid grid-cols-1 md:grid-cols-3 gap-8 text-left py-16 border-t border-gray-200 dark:border-gray-800">
        <article class="space-y-3">
          <UIcon name="lucide:brain-circuit" class="w-10 h-10 text-primary-500" />
          <h2 class="text-2xl font-bold">Local-First Analysis</h2>
          <p class="text-gray-600 dark:text-gray-400">
            Your PGNs never leave your device. All analysis is powered entirely in your browser using an optimized WebAssembly build of Stockfish 18.
          </p>
        </article>
        
        <article class="space-y-3">
          <UIcon name="lucide:target" class="w-10 h-10 text-primary-500" />
          <h2 class="text-2xl font-bold">Leak Detection</h2>
          <p class="text-gray-600 dark:text-gray-400">
            We categorize your mistakes into Opening, Conversion, Blunders, and Imbalances so you know exactly what is bleeding your ELO.
          </p>
        </article>

        <article class="space-y-3">
          <UIcon name="lucide:puzzle" class="w-10 h-10 text-primary-500" />
          <h2 class="text-2xl font-bold">Custom Puzzles</h2>
          <p class="text-gray-600 dark:text-gray-400">
            Don't just look at engine lines. We generate playable puzzles straight from the critical moments of your own games.
          </p>
        </article>
      </section>
      
      <!-- FAQ for SEO -->
      <section class="text-left py-16 border-t border-gray-200 dark:border-gray-800 space-y-8">
        <h2 class="text-3xl font-bold text-center">Frequently Asked Questions</h2>
        <div class="space-y-6 max-w-2xl mx-auto">
          <article>
            <h3 class="font-bold text-lg">Do I need to create an account?</h3>
            <p class="text-gray-600 dark:text-gray-400">No. rt2k uses your browser's IndexedDB to store your game history and analysis completely offline.</p>
          </article>
          <article>
            <h3 class="font-bold text-lg">How is this different from Lichess or Chess.com?</h3>
            <p class="text-gray-600 dark:text-gray-400">Instead of giving you random tactical puzzles, rt2k builds puzzles from the exact positions where you made mistakes in your actual games.</p>
          </article>
        </div>
      </section>
    </UContainer>
  </main>
</template>
