<script setup lang="ts">
defineProps<{ loading: boolean }>()

const emit = defineEmits<{ analyze: [pgn: string, username: string] }>()

const fileName = ref('')
const pgn = ref('')
const playerUsername = ref('')
const fileError = ref('')
const isDragging = ref(false)

const MAX_SIZE = 50 * 1024 * 1024

function handleFile(file: File) {
  fileError.value = ''
  if (!file.name.toLowerCase().endsWith('.pgn')) {
    fileError.value = 'Please upload a .pgn file.'
    return
  }
  if (file.size > MAX_SIZE) {
    fileError.value = 'File is too large (max 50 MB).'
    return
  }
  fileName.value = file.name
  const reader = new FileReader()
  reader.onload = e => { pgn.value = (e.target?.result as string) ?? '' }
  reader.readAsText(file)
}

function onFileInput(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) handleFile(file)
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) handleFile(file)
}

function submit() {
  if (pgn.value && playerUsername.value.trim()) {
    emit('analyze', pgn.value, playerUsername.value.trim())
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">Upload your games</h2>
    </template>

    <div class="space-y-4">
      <div
        role="button"
        aria-label="Drop zone: drag and drop a PGN file here or click Choose file"
        class="border-2 border-dashed rounded-lg p-6 text-center transition-colors"
        :class="isDragging
          ? 'border-primary bg-primary/5'
          : 'border-gray-300 dark:border-gray-700'"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
      >
        <input
          id="pgn-file"
          type="file"
          accept=".pgn"
          class="sr-only"
          @change="onFileInput"
        />
        <label for="pgn-file" class="cursor-pointer select-none">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Drop a <span class="font-medium">.pgn</span> file here, or
            <span class="text-primary font-medium">choose file</span>
          </p>
        </label>
      </div>

      <p class="text-xs text-gray-400 text-center">
        We analyse games locally in your browser — nothing is uploaded.
      </p>

      <UAlert
        v-if="fileError"
        color="error"
        variant="soft"
        :title="fileError"
      />

      <template v-if="fileName">
        <p class="text-sm font-medium truncate">{{ fileName }}</p>

        <UInput
          v-model="playerUsername"
          placeholder="Your username in the PGN"
        />

        <UButton
          block
          :loading="loading"
          :disabled="!playerUsername.trim() || !pgn"
          @click="submit"
        >
          Analyse
        </UButton>
      </template>
    </div>
  </UCard>
</template>
