<script setup lang="ts">
const props = defineProps<{
  stage: string
  current: number
  total: number
}>()

const messages: Record<string, string[]> = {
  starting: [
    "Waking up the engine, bro...",
    "Prepping the analysis board...",
    "Getting things ready for a deep dive...",
    "Initializing Stockfish WASM threads...",
    "Clearing the hash tables for a fresh run..."
  ],
  parsing: [
    "Scanning your game history...",
    "Deconstructing your recent form...",
    "Reading between the lines of your PGN...",
    "Extracting those critical games...",
    "Reconstructing move trees from your history...",
    "Normalizing PGN metadata...",
    "Indexing your opening choices..."
  ],
  detecting: [
    "Isolating tactical patterns...",
    "Identifying where the ELO is leaking...",
    "Spotting the critical moments...",
    "Filtering for your biggest blunders...",
    "Mapping your tactical blind spots...",
    "Analyzing pawn structure transitions...",
    "Flagging unusual time-management dips..."
  ],
  evaluating: [
    "Benchmarking your decision making...",
    "Quantifying those tactical blind spots...",
    "Running the engine on key positions...",
    "Synthesizing your performance metrics...",
    "Calculating centipawn loss across critical lines...",
    "Simulating better alternatives, bro...",
    "Searching for the 'Why' behind the 'What'...",
    "Comparing your moves to the master database..."
  ],
  finalizing: [
    "Calibrating your training plan...",
    "Wrapping up the insights...",
    "Finalizing your leak report, bro...",
    "Polishing the personalized puzzles...",
    "Synthesizing the road to 2000..."
  ]
}

const currentMessageIndex = ref(0)
const internalStage = ref(props.stage)
const isMessageTransitioning = ref(false)

const currentMessages = computed(() => messages[props.stage] || messages.starting)

const activeMessage = computed(() => {
  const msgs = currentMessages.value
  return msgs[currentMessageIndex.value % msgs.length]
})

// Rotate messages every 4 seconds with a smooth transition
let interval: any
onMounted(() => {
  interval = setInterval(() => {
    isMessageTransitioning.value = true
    setTimeout(() => {
      currentMessageIndex.value++
      isMessageTransitioning.value = false
    }, 400)
  }, 4000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

watch(() => props.stage, (newStage) => {
  if (newStage !== internalStage.value) {
    internalStage.value = newStage
    currentMessageIndex.value = 0
  }
})

const progressPercent = computed(() => {
  if (props.total <= 0) return 0
  return Math.round((props.current / props.total) * 100)
})

const showProgress = computed(() => props.stage === 'evaluating' && props.total > 0)
</script>

<template>
  <div class="relative w-full min-h-[480px] flex flex-col items-center justify-center overflow-hidden rounded-[--radius-stm] bg-white dark:bg-midnight transition-colors duration-700">
    
    <!-- Gooey Mesh Gradient Background -->
    <div class="absolute inset-0 z-0 pointer-events-none opacity-50 dark:opacity-70">
      <svg class="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
        <g filter="url(#goo)">
          <circle class="blob blob-1" cx="20" cy="30" r="25" fill="var(--color-sage)" />
          <circle class="blob blob-2" cx="80" cy="70" r="30" fill="var(--color-emerald)" />
          <circle class="blob blob-3" cx="50" cy="50" r="20" fill="var(--color-mint)" />
          <circle class="blob blob-4" cx="30" cy="80" r="22" fill="var(--color-forest)" />
        </g>
      </svg>
    </div>

    <!-- Content -->
    <div class="relative z-10 flex flex-col items-center space-y-12 p-8 text-center max-w-sm">
      
      <!-- Advanced Gyro Scanner Logo -->
      <div class="relative size-32 flex items-center justify-center">
        <!-- Outer Ring (Clockwise) -->
        <div class="absolute inset-0 border-[1px] border-dashed border-forest/20 dark:border-emerald/20 rounded-full animate-spin-very-slow" />
        
        <!-- Middle Ring (Counter-Clockwise) -->
        <div class="absolute inset-4 border-[1px] border-forest/10 dark:border-emerald/10 rounded-full animate-spin-reverse-slow" />
        
        <!-- Inner Core -->
        <div class="relative size-20 rounded-full bg-white/40 dark:bg-emerald/5 flex items-center justify-center backdrop-blur-md border border-white/60 dark:border-forest/20 shadow-2xl z-20">
          <UIcon 
            name="i-lucide-search" 
            class="size-10 text-forest dark:text-emerald animate-pulse-slow" 
          />
          <!-- Scanning line effect -->
          <div class="absolute inset-0 overflow-hidden rounded-full">
            <div class="w-full h-1/2 bg-gradient-to-b from-transparent via-forest/5 dark:via-emerald/10 to-transparent animate-scan" />
          </div>
        </div>

        <!-- Satellite Pips -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 size-1.5 rounded-full bg-forest dark:bg-emerald animate-orbit-1" />
        <div class="absolute bottom-4 right-0 size-1 rounded-full bg-sage dark:bg-mint animate-orbit-2" />
      </div>

      <div class="space-y-4 min-h-[90px]" aria-live="polite">
        <h2 
          class="stm-heading text-2xl text-charcoal dark:text-white transition-all duration-500"
          :class="{ 'opacity-0 blur-sm scale-95': isMessageTransitioning }"
        >
          {{ activeMessage }}
        </h2>
        <p class="text-moss dark:text-mint/60 font-medium text-sm tracking-wide">
          Road to 2000 is being mapped...
        </p>
      </div>

      <!-- Enhanced Progress Section -->
      <div v-if="showProgress" class="w-full space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div class="flex justify-between items-end px-1">
          <div class="flex items-center gap-2">
            <div class="size-1.5 rounded-full bg-forest dark:bg-emerald animate-ping" />
            <span class="text-[10px] uppercase font-bold tracking-[0.2em] text-moss/50 dark:text-mint/40">Engine Eval</span>
          </div>
          <span class="text-xs font-display font-bold text-forest dark:text-emerald">{{ progressPercent }}%</span>
        </div>
        <div class="h-1.5 w-full bg-sage/20 dark:bg-forest/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/40 dark:border-forest/10">
          <div 
            class="h-full bg-forest dark:bg-emerald transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1)"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-pulse-slow {
  animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-spin-very-slow {
  animation: spin 25s linear infinite;
}

.animate-spin-reverse-slow {
  animation: spin-reverse 15s linear infinite;
}

.animate-scan {
  animation: scan 3s ease-in-out infinite;
}

.animate-orbit-1 {
  animation: orbit 8s linear infinite;
  transform-origin: center 68px;
}

.animate-orbit-2 {
  animation: orbit 5s linear infinite reverse;
  transform-origin: -20px center;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes spin-reverse {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(0.92); }
}

@keyframes scan {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(200%); }
}

@keyframes orbit {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Mesh Gradient Blobs */
.blob {
  animation: float 25s infinite alternate cubic-bezier(0.45, 0.05, 0.55, 0.95);
  transform-origin: center;
}

.blob-1 { animation-duration: 22s; animation-delay: -2s; }
.blob-2 { animation-duration: 28s; animation-delay: -5s; }
.blob-3 { animation-duration: 20s; animation-delay: -8s; }
.blob-4 { animation-duration: 32s; animation-delay: -12s; }

@keyframes float {
  0% { transform: translate(0, 0) scale(1) rotate(0deg); }
  33% { transform: translate(30px, -40px) scale(1.2) rotate(120deg); }
  66% { transform: translate(-20px, 20px) scale(0.8) rotate(240deg); }
  100% { transform: translate(0, 0) scale(1) rotate(360deg); }
}

/* Reduced Motion support */
@media (prefers-reduced-motion: reduce) {
  .blob, .animate-pulse-slow, .animate-spin-very-slow, .animate-spin-reverse-slow, .animate-scan, .animate-orbit-1, .animate-orbit-2 {
    animation: none !important;
  }
  .transition-all {
    transition: none !important;
  }
}
</style>
