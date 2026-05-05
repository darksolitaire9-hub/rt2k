<script setup lang="ts">
import { Chessground } from 'chessground'
import type { Api } from 'chessground/dist/api'

const props = defineProps<{
  puzzle: {
    id: string
    sourceGameId: string
    sourceMoveNumber: number
    fen: string
    solution: string
    clockAtMoment: number | null
    leakType: string
  }
}>()

const emit = defineEmits<{
  (e: 'solved'): void
}>()

type Feedback = 'idle' | 'correct' | 'wrong' | 'revealed'

const boardEl = ref<HTMLElement | null>(null)
let cg: Api | null = null
const feedback = ref<Feedback>('idle')

function sideToMove(fen: string): 'white' | 'black' {
  return fen.split(' ')[1] === 'b' ? 'black' : 'white'
}

function initBoard() {
  if (!boardEl.value) return
  cg?.destroy()
  feedback.value = 'idle'

  const color = sideToMove(props.puzzle.fen)

  cg = Chessground(boardEl.value, {
    fen: props.puzzle.fen,
    orientation: color,
    turnColor: color,
    movable: {
      free: true,
      color,
      events: {
        after(orig, dest) {
          if (orig + dest === props.puzzle.solution) {
            feedback.value = 'correct'
            cg?.set({ movable: { color: undefined } })
            emit('solved')
          }
          else {
            feedback.value = 'wrong'
            setTimeout(() => {
              cg?.set({ fen: props.puzzle.fen, turnColor: color })
              feedback.value = 'idle'
            }, 800)
          }
        },
      },
    },
    animation: { enabled: true, duration: 200 },
  })
}

function reset() {
  initBoard()
}

function showHint() {
  const from = props.puzzle.solution.slice(0, 2)
  cg?.selectSquare(from as Parameters<Api['selectSquare']>[0])
}

function showSolution() {
  const orig = props.puzzle.solution.slice(0, 2) as Parameters<Api['move']>[0]
  const dest = props.puzzle.solution.slice(2, 4) as Parameters<Api['move']>[1]
  cg?.move(orig, dest)
  cg?.set({ movable: { color: undefined } })
  feedback.value = 'revealed'
}

onMounted(() => initBoard())
onUnmounted(() => cg?.destroy())
watch(() => props.puzzle.id, () => initBoard())
</script>

<template>
  <div class="space-y-4">
    <div ref="boardEl" class="w-full aspect-square" />

    <p class="text-center text-sm font-bold uppercase tracking-wide min-h-5" aria-live="polite">
      <span v-if="feedback === 'correct'" class="text-forest dark:text-emerald">Correct!</span>
      <span v-else-if="feedback === 'wrong'" class="text-red-500 dark:text-red-400">Try again</span>
      <span v-else-if="feedback === 'revealed'" class="text-moss dark:text-mint/50">Solution shown</span>
      <span v-else class="text-moss/50 dark:text-mint/30 capitalize">{{ sideToMove(puzzle.fen) }} to move</span>
    </p>

    <div class="grid grid-cols-3 gap-2">
      <button
        class="min-h-[44px] rounded-[--radius-stm] border-2 border-gray-200 dark:border-forest/30 text-xs font-bold uppercase tracking-wide text-charcoal dark:text-white/70 hover:border-forest dark:hover:border-emerald transition-colors"
        @click="reset"
      >
        Reset
      </button>
      <button
        class="min-h-[44px] rounded-[--radius-stm] border-2 border-gray-200 dark:border-forest/30 text-xs font-bold uppercase tracking-wide text-charcoal dark:text-white/70 hover:border-forest dark:hover:border-emerald transition-colors"
        @click="showHint"
      >
        Hint
      </button>
      <button
        class="min-h-[44px] rounded-[--radius-stm] border-2 border-gray-200 dark:border-forest/30 text-xs font-bold uppercase tracking-wide text-charcoal dark:text-white/70 hover:border-forest dark:hover:border-emerald transition-colors"
        @click="showSolution"
      >
        Solution
      </button>
    </div>

    <p class="text-[10px] text-moss/40 dark:text-mint/20 text-center uppercase tracking-wider">
      Move {{ puzzle.sourceMoveNumber }} · game {{ puzzle.sourceGameId.slice(-6) }}
    </p>
  </div>
</template>
