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
  <div class="stm-card space-y-6">
    <div class="space-y-1">
      <h2 class="stm-heading text-2xl text-charcoal dark:text-white">Upload your games</h2>
      <p class="text-sm font-medium text-moss dark:text-mint/50">Drop a PGN file to find your leaks</p>
    </div>

    <div class="space-y-4">
      <!-- Drop zone -->
      <div
        v-if="!fileName || fileError"
        role="button"
        aria-label="Drop zone: drag and drop a PGN file here or click Choose file"
        class="border-2 border-dashed rounded-[--radius-stm] p-10 text-center transition-colors"
        :class="isDragging ? 'border-forest dark:border-emerald bg-sage/20 dark:bg-emerald/5' : 'border-gray-300 dark:border-forest/30'"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
      >
        <input id="pgn-file" type="file" accept=".pgn" class="sr-only" @change="onFileInput" />
        <label for="pgn-file" class="cursor-pointer select-none flex flex-col items-center gap-3">
          <UIcon name="i-lucide-upload-cloud" class="size-10 text-forest/30 dark:text-emerald/30" />
          <div class="space-y-1">
            <p class="text-sm font-bold text-charcoal dark:text-white/80">
              Drop a <span class="text-forest dark:text-emerald">.pgn</span> file here
            </p>
            <p class="text-xs text-moss dark:text-mint/40">
              or <span class="text-forest dark:text-emerald font-semibold underline underline-offset-2">choose file</span>
            </p>
          </div>
        </label>
      </div>

      <!-- Reading progress -->
      <div v-if="isReading" class="space-y-2">
        <div class="flex justify-between text-xs font-medium text-moss dark:text-mint/50">
          <span>Reading file...</span>
          <span>{{ readProgress }}%</span>
        </div>
        <UProgress :value="readProgress" size="sm" />
      </div>

      <!-- File error -->
      <div v-if="fileError" class="flex items-center gap-3 p-4 rounded-[--radius-stm] bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
        <UIcon name="i-lucide-alert-circle" class="size-5 text-red-500 shrink-0" />
        <p class="text-sm font-medium text-red-700 dark:text-red-300">{{ fileError }}</p>
      </div>

      <!-- File loaded + form -->
      <template v-if="fileName && !isReading && !fileError">
        <!-- File chip -->
        <div class="flex items-center justify-between bg-sage/30 dark:bg-forest/10 p-3 rounded-[--radius-stm]">
          <div class="flex items-center gap-2 min-w-0">
            <UIcon name="i-lucide-file-text" class="size-5 text-forest dark:text-emerald shrink-0" />
            <p class="text-sm font-bold text-charcoal dark:text-white truncate">{{ fileName }}</p>
          </div>
          <button
            class="p-1.5 rounded-full hover:bg-sage dark:hover:bg-forest/20 transition-colors"
            aria-label="Remove file"
            @click="fileName = ''; pgn = ''; fileError = ''; detectedNames = []; playerUsername = ''"
          >
            <UIcon name="i-lucide-x" class="size-4 text-moss dark:text-mint/60" />
          </button>
        </div>

        <div class="space-y-5">
          <!-- Username -->
          <div class="space-y-2">
            <UInput
              v-model="playerUsername"
              placeholder="Your username in the PGN"
              icon="i-lucide-user"
              size="md"
              autofocus
              @keyup.enter="submit"
            />
            <div v-if="detectedNames.length > 1" class="flex flex-wrap gap-2 items-center">
              <p class="text-xs font-medium text-moss dark:text-mint/40">Detected:</p>
              <button
                v-for="name in detectedNames"
                :key="name"
                class="px-3 py-1 text-xs font-bold rounded-full transition-colors"
                :class="playerUsername === name
                  ? 'bg-forest dark:bg-emerald text-white'
                  : 'bg-sage/30 dark:bg-forest/20 text-charcoal dark:text-white/70 border border-gray-200 dark:border-forest/30'"
                @click="playerUsername = name"
              >
                {{ name }}
              </button>
            </div>
          </div>

          <!-- Range selector -->
          <div class="space-y-2">
            <p class="text-[10px] font-bold uppercase tracking-widest text-moss dark:text-mint/50">How far back?</p>
            <div class="flex gap-2">
              <button
                v-for="r in ranges"
                :key="r.value"
                class="flex-1 py-2 text-xs font-bold rounded-[--radius-stm] transition-colors"
                :class="selectedRange === r.value
                  ? 'bg-forest dark:bg-emerald text-white'
                  : 'bg-sage/20 dark:bg-forest/10 text-charcoal dark:text-white/70 border border-gray-200 dark:border-forest/20'"
                @click="selectedRange = r.value"
              >
                {{ r.label }}
              </button>
            </div>
            <p class="text-[11px] text-moss dark:text-mint/40 leading-tight transition-all">{{ selectedRangeHint }}</p>
          </div>

          <!-- Submit -->
          <button
            v-if="playerUsername.trim()"
            class="stm-button-hero"
            :disabled="!pgn || loading"
            @click="submit"
          >
            <span v-if="loading" class="flex items-center gap-2">
              <UIcon name="i-lucide-loader-2" class="size-5 animate-spin" />
              Getting your puzzles...
            </span>
            <span v-else>Find my weaknesses</span>
          </button>
        </div>
      </template>

      <p class="text-[10px] text-moss/40 dark:text-mint/20 text-center uppercase tracking-wider">
        Browser-only · Private · Local Analysis
      </p>
    </div>
  </div>
</template>
