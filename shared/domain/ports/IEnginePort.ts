export interface IEnginePort {
  evaluate(fen: string, depth: number): Promise<number>
}
