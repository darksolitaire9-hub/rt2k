<script setup lang="ts">
const props = defineProps<{
  leak: {
    type: string
    score: number
    title: string
    description: string
    evidenceGameIds: string[]
    evidence: string[]
  }
}>()

defineEmits<{ train: [leakType: string] }>()

const severityBadge = computed(() => {
  if (props.leak.score <= 40) return { label: 'Minor', color: 'bg-sage text-forest dark:bg-emerald/10 dark:text-emerald' }
  if (props.leak.score <= 70) return { label: 'Moderate', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' }
  return { label: 'Critical', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' }
})
</script>

<template>
  <div class="stm-card flex flex-col gap-6" role="article" :aria-labelledby="`leak-title-${leak.type}`">
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-1">
        <span 
          class="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full"
          :class="severityBadge.color"
          role="note"
        >
          {{ severityBadge.label }} Severity
        </span>
        <h3 :id="`leak-title-${leak.type}`" class="stm-heading text-xl text-charcoal dark:text-white">
          {{ leak.title }}
        </h3>
      </div>
      <div class="text-right" role="group" aria-label="Leak impact score">
        <div class="text-2xl font-display font-bold text-forest dark:text-emerald leading-none" aria-live="polite">
          {{ Math.round(leak.score) }}
        </div>
        <div class="text-[10px] uppercase tracking-tighter text-moss dark:text-mint/40 font-bold" aria-hidden="true">
          Leak Score
        </div>
      </div>
    </div>

    <p class="text-sm leading-relaxed text-moss dark:text-mint/70 font-medium">
      {{ leak.description }}
    </p>

    <div v-if="leak.evidence.length" class="space-y-3">
      <div class="text-[10px] uppercase tracking-widest font-bold text-moss/60 dark:text-mint/30">
        Personal Evidence
      </div>
      <ul class="space-y-2">
        <li v-for="bullet in leak.evidence" :key="bullet" class="text-xs flex items-start gap-3 text-charcoal/80 dark:text-white/70">
          <UIcon name="i-lucide-target" class="size-4 shrink-0 text-forest dark:text-emerald" />
          <span>{{ bullet }}</span>
        </li>
      </ul>
    </div>

    <button 
      class="stm-button-hero mt-auto group"
      @click="$emit('train', leak.type)"
    >
      Fix this leak
      <UIcon name="i-lucide-arrow-right" class="ml-2 size-5 transition-transform group-hover:translate-x-1" />
    </button>
  </div>
</template>
