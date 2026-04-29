<script setup lang="ts">
import { Chessground } from 'chessground'
import type { Api } from 'chessground/dist/api'

const props = defineProps<{
  puzzle: {
    id: string
    sourceGameId: string
    sourceMoveNumber: number
    fen: string
    bestMove: string
    playedMove: string
    theme: string | null
    ratingHint: number | null
  }
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
          if (orig + dest === props.puzzle.bestMove) {
            feedback.value = 'correct'
            cg?.set({ movable: { color: undefined } })
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
  const from = props.puzzle.bestMove.slice(0, 2)
  cg?.selectSquare(from as Parameters<Api['selectSquare']>[0])
}

function showSolution() {
  const orig = props.puzzle.bestMove.slice(0, 2) as Parameters<Api['move']>[0]
  const dest = props.puzzle.bestMove.slice(2, 4) as Parameters<Api['move']>[1]
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

    <p class="text-center text-sm font-medium min-h-5">
      <span v-if="feedback === 'correct'" class="text-green-600">Correct!</span>
      <span v-else-if="feedback === 'wrong'" class="text-red-500">Try again</span>
      <span v-else-if="feedback === 'revealed'" class="text-gray-400">Solution shown</span>
      <span v-else class="text-gray-400 capitalize">{{ sideToMove(puzzle.fen) }} to move</span>
    </p>

    <div class="grid grid-cols-3 gap-2">
      <UButton variant="outline" size="sm" @click="reset">Reset</UButton>
      <UButton variant="outline" size="sm" @click="showHint">Hint</UButton>
      <UButton variant="outline" size="sm" @click="showSolution">Solution</UButton>
    </div>

    <p class="text-xs text-gray-400 text-center">
      Move {{ puzzle.sourceMoveNumber }} · game {{ puzzle.sourceGameId.slice(-6) }}
    </p>
  </div>
</template>
