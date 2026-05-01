<script setup lang="ts">
defineProps<{ loading: boolean }>()

const emit = defineEmits<{
  analyze: [pgn: string, username: string, days: number]
  preLoad: []
  preAnalyze: [pgn: string, username: string, days: number]
}>()

const fileName = ref('')
const pgn = ref('')
const playerUsername = ref('')
const detectedNames = ref<string[]>([])
const selectedRange = ref(90)
const ranges = [
  {
    label: '90 days',
    value: 90,
    hint: 'Your recent form — best for spotting current habits',
  },
  {
    label: '180 days',
    value: 180,
    hint: 'Last 6 months — catches patterns that come and go',
  },
  {
    label: 'All time',
    value: 9999,
    hint: 'Full history — slowest, use for deep-rooted leaks',
  },
]
const selectedRangeHint = computed(() => ranges.find(r => r.value === selectedRange.value)?.hint ?? '')
const fileError = ref('')
const isDragging = ref(false)
const readProgress = ref(0)
const isReading = ref(false)

const MAX_SIZE = 50 * 1024 * 1024

function detectNamesFromPgn(content: string): string[] {
  const names: string[] = []
  // Scan only the first 2 KB — enough to cover the first game's headers
  const sample = content.slice(0, 2048)
  for (const match of sample.matchAll(/\[(White|Black)\s+"([^"]+)"\]/g)) {
    const name = match[2]
    if (name && name !== '?' && !names.includes(name)) {
      names.push(name)
    }
  }
  return names
}

const pgnVersion = ref(0)
const lastPrewarmSignature = ref('')

function handleFile(file: File) {
  fileError.value = ''
  pgn.value = ''
  detectedNames.value = []
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
    if (e.lengthComputable) readProgress.value = Math.round((e.loaded / e.total) * 100)
  }

  reader.onload = e => {
    const content = (e.target?.result as string) ?? ''
    pgn.value = content
    pgnVersion.value++
    readProgress.value = 100
    isReading.value = false
    detectedNames.value = detectNamesFromPgn(content)
    // Pre-fill username if only one unique name detected
    if (detectedNames.value.length === 1) {
      playerUsername.value = detectedNames.value[0] || ''
    }
    emit('preLoad')
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

// Fire pre-analysis as soon as both pgn and username are known.
// Dedupe using a signature to avoid redundant messages while typing.
watch([pgnVersion, playerUsername, selectedRange], ([version, newUsername, newDays]) => {
  const username = newUsername.trim()
  if (pgn.value && username) {
    const signature = `${version}::${username}::${newDays}`
    if (signature !== lastPrewarmSignature.value) {
      lastPrewarmSignature.value = signature
      emit('preAnalyze', pgn.value, username, newDays)
    }
  }
})

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
        :class="isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-700'"
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

      <UAlert v-if="fileError" color="error" variant="soft" :title="fileError" />

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
            @click="fileName = ''; pgn = ''; fileError = ''; detectedNames = []; playerUsername = ''"
          />
        </div>

        <div class="space-y-4 pt-2">
          <!-- Username input with auto-detect suggestions -->
          <div class="space-y-2">
            <UInput
              v-model="playerUsername"
              placeholder="Your username in the PGN"
              icon="i-heroicons-user"
              size="md"
              autofocus
              @keyup.enter="submit"
            />
            <div v-if="detectedNames.length > 1" class="flex flex-wrap gap-2">
              <p class="text-xs text-muted self-center">Detected:</p>
              <UButton
                v-for="name in detectedNames"
                :key="name"
                size="xs"
                :variant="playerUsername === name ? 'solid' : 'outline'"
                color="neutral"
                class="cursor-pointer"
                @click="playerUsername = name"
              >
                {{ name }}
              </UButton>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <p class="px-1 text-xs font-medium text-muted">How far back?</p>
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
            <p class="px-1 text-[11px] text-muted leading-tight transition-all">{{ selectedRangeHint }}</p>
          </div>

          <UButton
            v-if="playerUsername.trim()"
            block
            size="xl"
            class="cursor-pointer font-bold"
            :loading="loading"
            :disabled="!pgn"
            @click="submit"
          >
            {{ loading ? 'Getting your puzzles...' : 'Find my weaknesses' }}
          </UButton>
        </div>
      </template>

      <p class="text-[10px] text-gray-400 text-center uppercase tracking-wider">
        Browser-only · Private · Local Analysis
      </p>
    </div>
  </UCard>
</template>
