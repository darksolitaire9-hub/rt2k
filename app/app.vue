<script setup lang="ts">
const { hydrate } = useAnalysis()

onMounted(async () => {
  await hydrate()
  const repo = useRepository()
  repo.syncUnsynced()
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
