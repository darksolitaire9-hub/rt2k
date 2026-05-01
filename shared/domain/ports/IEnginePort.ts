export interface EngineResult {
  score: number
  bestMove: string
}

export interface EvalOptions {
  depth?: number
  movetime?: number  // ms; takes priority over depth when set
}

export interface IEnginePort {
  evaluate(fen: string, options: EvalOptions): Promise<EngineResult>
}
