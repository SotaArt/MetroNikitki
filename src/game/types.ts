export const COLORS = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'violet'] as const
export type Color = typeof COLORS[number]

export interface Passenger {
  id: number
  color: Color
  boardingTo?: { platform: 0; wagonIndex: number }
  boardingSinceTick?: number
  spawnTick?: number
  seed?: number
}

export interface Wagon {
  color: Color | 'bonus'
  passengers: Passenger[]
  boarding: number
}

export interface LaunchingTrain {
  colors: (Color | 'bonus')[]
  dir: 'left' | 'right'
  ticks: number
}

export interface PendingPlatformDispatch {
  colors: (Color | 'bonus')[]
  ticks: number
}

export interface Train {
  id: number
  wagons: Wagon[]
  status: 'depot' | 'queued' | 'arriving' | 'boarding' | 'departing' | 'gone'
  platform: 0 | null
  arrivedAt?: number
  createdAt: number
  animTicks?: number
  boardingStartTick?: number
}

export type LevelStatus = 'playing' | 'won' | 'lost' | 'complete'

export interface GameState {
  level: number
  levelTarget: number
  spawnedThisLevel: number
  sentThisLevel: number
  levelTicksLeft: number
  levelStatus: LevelStatus
  paused: boolean
  platformPassengers: Passenger[]
  depotSelection: (Color | 'bonus')[]
  bonusUsedThisLevel: boolean
  launchingTrain: LaunchingTrain | null
  pendingPlatformDispatch: PendingPlatformDispatch | null
  queueTrains: Train[]
  platforms: [Train | null]
  nextPassengerId: number
  nextTrainId: number
  tick: number
  arrivalSeq: number
  weights: Record<Color, number>
  needTicks: Record<Color, number>
  lastSpawnTick: number
  spawnCooldown: number
}
