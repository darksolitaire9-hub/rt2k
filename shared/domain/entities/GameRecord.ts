export interface GameRecord {
  gameId: string
  date: string
  color: 'white' | 'black'
  result: 'win' | 'loss' | 'draw'
  termination: 'normal' | 'time' | 'resign' | 'abandoned'
  openingName: string
  eco: string
  myElo: number
  oppElo: number
  timeControl: string
  moveCount: number
  timeLoss: boolean
  openingFail: boolean
  conversionFail: boolean
}
