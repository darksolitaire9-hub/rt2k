export interface Leak {
  type: 'time' | 'tactics' | 'opening' | 'structure' | 'endgame'
  score: number
  title: string
  description: string
  evidenceGameIds: string[]
}
