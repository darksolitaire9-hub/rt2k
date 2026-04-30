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

const severityColor = computed(() => {
  if (props.leak.score <= 40) return 'success'
  if (props.leak.score <= 70) return 'warning'
  return 'error'
})

const severityLabel = computed(() => {
  if (props.leak.score <= 40) return 'Minor leak'
  if (props.leak.score <= 70) return 'Moderate leak'
  return 'Major leak'
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h3 class="font-semibold text-base">{{ leak.title }}</h3>
        <div class="flex items-center gap-1.5 shrink-0">
          <span class="text-xs text-muted">{{ severityLabel }}</span>
          <UBadge :color="severityColor" variant="soft">
            {{ Math.round(leak.score) }}/100
          </UBadge>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <p class="text-sm text-muted leading-relaxed">{{ leak.description }}</p>

      <ul v-if="leak.evidence.length" class="space-y-1">
        <li v-for="bullet in leak.evidence" :key="bullet" class="text-xs text-muted flex items-start gap-2">
          <UIcon name="i-heroicons-check-circle" class="size-3.5 mt-0.5 text-success/70" />
          {{ bullet }}
        </li>
      </ul>

      <UButton variant="outline" size="sm" block @click="$emit('train', leak.type)">
        Train this
      </UButton>
    </div>
  </UCard>
</template>
