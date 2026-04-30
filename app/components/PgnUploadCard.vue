<script setup lang="ts">
defineProps<{ loading: boolean }>()

const emit = defineEmits<{ analyze: [pgn: string, username: string, days: number] }>()

const fileName = ref('')
const pgn = ref('')
const playerUsername = ref('')
const selectedRange = ref(90)
const ranges = [
  { label: '90 days', value: 90 },
  { label: '180 days', value: 180 },
  { label: 'All time', value: 9999 }
]
const fileError = ref('')
const isDragging = ref(false)
const readProgress = ref(0)
const isReading = ref(false)

const MAX_SIZE = 50 * 1024 * 1024

function handleFile(file: File) {
  fileError.value = ''
  pgn.value = ''
  readProgress.value = 0
  
  if (!file.name.toLowerCase().endsWith('.pgn')) {
    fileError.value = 'Please upload a .pgn file.'
    return
  }
  if (file.size > MAX_SIZE) {
    fileError.value = 'File is too large (max 50 MB).'
    return
  }
  
  fileName.value = file.name
  isReading.value = true
  
  const reader = new FileReader()
  
  reader.onprogress = e => {
    if (e.lengthComputable) {
      readProgress.value = Math.round((e.loaded / e.total) * 100)
    }
  }

  reader.onload = e => { 
    pgn.value = (e.target?.result as string) ?? ''
    readProgress.value = 100
    isReading.value = false
  }
  
  reader.onerror = () => {
    fileError.value = 'Failed to read file.'
    isReading.value = false
  }

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
    emit('analyze', pgn.value, playerUsername.value.trim(), selectedRange.value)
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
        v-if="!fileName || fileError"
        role="button"
        aria-label="Drop zone: drag and drop a PGN file here or click Choose file"
        class="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
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
          <UIcon name="i-heroicons-cloud-arrow-up" class="size-8 text-gray-400 mb-2" />
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Drop a <span class="font-medium">.pgn</span> file here, or
            <span class="text-primary font-medium">choose file</span>
          </p>
        </label>
      </div>

      <div v-if="isReading" class="space-y-2">
        <div class="flex justify-between text-xs text-muted">
          <span>Reading file...</span>
          <span>{{ readProgress }}%</span>
        </div>
        <UProgress :value="readProgress" size="sm" />
      </div>

      <UAlert
        v-if="fileError"
        color="error"
        variant="soft"
        :title="fileError"
      />

      <template v-if="fileName && !isReading && !fileError">
        <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
          <div class="flex items-center gap-2 min-w-0">
            <UIcon name="i-heroicons-document-text" class="size-5 text-primary shrink-0" />
            <p class="text-sm font-medium truncate">{{ fileName }}</p>
          </div>
          <UButton 
            variant="ghost" 
            color="neutral" 
            icon="i-heroicons-x-mark" 
            size="xs" 
            @click="fileName = ''; pgn = ''; fileError = ''" 
          />
        </div>

        <div class="space-y-4 pt-2">
          <UInput
            v-model="playerUsername"
            placeholder="Your username in the PGN"
            icon="i-heroicons-user"
            size="md"
            autofocus
            @keyup.enter="submit"
          />

          <div class="flex flex-col gap-2">
            <p class="text-xs font-medium text-muted px-1">Analysis Window</p>
            <div class="flex gap-2">
              <UButton
                v-for="r in ranges"
                :key="r.value"
                :variant="selectedRange === r.value ? 'solid' : 'ghost'"
                color="neutral"
                size="xs"
                class="flex-1 justify-center cursor-pointer"
                @click="selectedRange = r.value"
              >
                {{ r.label }}
              </UButton>
            </div>
          </div>

          <UButton
            v-if="playerUsername.trim()"
            block
            size="lg"
            class="cursor-pointer"
            :loading="loading"
            :disabled="!pgn"
            @click="submit"
          >
            {{ loading ? 'Analysing Latest Games...' : 'Analyse Games' }}
          </UButton>
        </div>
      </template>

      <p class="text-[10px] text-gray-400 text-center uppercase tracking-wider">
        Browser-only · Private · Local Analysis
      </p>
    </div>
  </UCard>
</template>
