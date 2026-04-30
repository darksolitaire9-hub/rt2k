import type { LeakType } from '../value-objects/LeakType'

export interface Leak {
  type: LeakType
  score: number
  title: string
  description: string
  evidenceGameIds: string[]
  evidence: string[]
}
