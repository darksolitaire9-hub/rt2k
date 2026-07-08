<script setup lang="ts">
const { hydrate } = useAnalysis()

const { hydratePuzzles } = usePuzzles()

onMounted(async () => {
  await hydrate()
  await hydratePuzzles()
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
