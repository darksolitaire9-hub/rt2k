<script setup lang="ts">
const { hydrate } = useAnalysis()

onMounted(async () => {
  await hydrate()
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
