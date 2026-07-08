<script setup lang="ts">
import { useAnalysis } from '~/composables/useAnalysis'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const { clearData } = useAnalysis()
const router = useRouter()
const isClearing = ref(false)
const toast = useToast()

async function handleClearData() {
  if (!confirm('Are you sure you want to delete all local analysis data? This cannot be undone.')) {
    return
  }
  
  isClearing.value = true
  try {
    await clearData()
    toast.add({
      title: 'Data Cleared',
      description: 'All local analyses and puzzles have been deleted.',
      color: 'success'
    })
    router.push('/analyze')
  } catch (err) {
    toast.add({
      title: 'Error',
      description: 'Failed to clear data.',
      color: 'error'
    })
  } finally {
    isClearing.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-display font-bold tracking-tight text-forest dark:text-emerald">Settings</h1>
      <p class="text-moss dark:text-mint/80 mt-2">Manage your local rt2k data.</p>
    </div>

    <UCard>
      <template #header>
        <h2 class="font-bold text-lg text-forest dark:text-emerald">Data Management</h2>
      </template>
      
      <div class="space-y-4">
        <p class="text-sm text-moss dark:text-mint/80">
          rt2k is completely local-first. All your PGNs, analyses, and puzzles are stored in your browser's IndexedDB.
          Clearing data will permanently delete all history.
        </p>
        
        <UButton
          color="error"
          variant="soft"
          icon="i-lucide-trash-2"
          :loading="isClearing"
          @click="handleClearData"
        >
          Clear Local Data
        </UButton>
      </div>
    </UCard>
  </div>
</template>
