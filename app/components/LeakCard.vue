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

defineEmits<{ train: [] }>()

const severityColor = computed(() => {
  if (props.leak.score <= 40) return 'success'
  if (props.leak.score <= 70) return 'warning'
  return 'error'
})

const evidenceLabel = computed(() => {
  const n = props.leak.evidenceGameIds.length
  return `Found in ${n} game${n === 1 ? '' : 's'}`
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h3 class="font-semibold text-base">{{ leak.title }}</h3>
        <UBadge :color="severityColor" variant="soft" class="shrink-0">
          {{ leak.score }}/100
        </UBadge>
      </div>
    </template>

    <div class="space-y-3">
      <p class="text-sm text-gray-600 dark:text-gray-400">{{ leak.description }}</p>
      <p class="text-xs text-gray-400">{{ evidenceLabel }}</p>
      <UButton variant="outline" size="sm" block @click="$emit('train')">
        Train this
      </UButton>
    </div>
  </UCard>
</template>
