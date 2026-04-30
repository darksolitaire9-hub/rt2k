<script setup lang="ts">
const props = defineProps<{
  leak: {
    type: string
    score: number
    title: string
    description: string
    evidenceGameIds: string[]
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

const evidenceLine = computed(() => {
  const n = props.leak.evidenceGameIds.length
  return `Found in ${n} game${n === 1 ? '' : 's'}`
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
            {{ leak.score }}/100
          </UBadge>
        </div>
      </div>
    </template>

    <div class="space-y-3">
      <p class="text-sm text-muted">{{ leak.description }}</p>
      <ul class="text-xs text-muted list-disc list-inside space-y-0.5">
        <li>{{ evidenceLine }}</li>
      </ul>
      <UButton variant="outline" size="sm" block @click="$emit('train', leak.type)">
        Train this
      </UButton>
    </div>
  </UCard>
</template>
