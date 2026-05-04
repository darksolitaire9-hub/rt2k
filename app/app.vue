<script setup lang="ts">
onMounted(() => {
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
