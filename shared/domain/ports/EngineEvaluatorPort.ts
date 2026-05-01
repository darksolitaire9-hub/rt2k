export type EvalRequest = {
  fen: string
  movetimeMs: number
}

export type EvalResult = {
  fen: string
  scoreCp: number
  bestMoveUci: string | null
}

export interface EngineEvaluatorPort {
  evaluatePositions(requests: EvalRequest[]): Promise<EvalResult[]>
}
