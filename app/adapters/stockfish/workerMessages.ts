import type { EvalResult } from '#shared/domain/ports/EngineEvaluatorPort'

export type WorkerRequest = {
  id: string
  type: 'EVALUATE_POSITION'
  fen: string
  movetimeMs: number
}

export type WorkerResponse =
  | { id: string; type: 'EVAL_RESULT'; result: EvalResult }
  | { id: string; type: 'ERROR'; error: string }
  | { id: string; type: 'READY' }
