import { COLORS, type Color, type GameState, type Passenger, type Train, type Wagon } from './types'

export const WAGON_CAPACITY = 4
export const PLATFORM_CAPACITY = 20
export const SPAWN_BASE_COOLDOWN = 2
export const MAX_LEVEL = 20
export const BASE_LEVEL_TIME_TICKS = 43 // ~30s at 700ms

export function levelTimeTicks(level: number) {
  const extra = Math.floor((level - 1) / 2) * 14 // +10s every 2 levels (14 ticks ~ 9.8s)
  return BASE_LEVEL_TIME_TICKS + extra
}

let rngState = 1
function rand() {
  rngState = (1664525 * rngState + 1013904223) >>> 0
  return rngState / 0x100000000
}

function passengerSeed(id: number, tick: number) {
  // deterministic per-passenger seed independent of array order / other passengers
  return (((id * 1103515245) ^ (tick * 12345) ^ (rngState * 2654435761)) >>> 0) || 1
}

function emptyWeights(): Record<Color, number> {
  const w = {} as Record<Color, number>
  for (const c of COLORS) w[c] = 1
  return w
}
function emptyNeedTicks(): Record<Color, number> {
  const n = {} as Record<Color, number>
  for (const c of COLORS) n[c] = 0
  return n
}

function wagon(color: Color | 'bonus'): Wagon {
  return { color, passengers: [], boarding: 0 }
}

export function levelTarget(level: number) {
  return 12 * level
}

export function createTrainFromColors(id: number, colors: (Color | 'bonus')[]): Train {
  return {
    id,
    wagons: colors.map(c => wagon(c)),
    status: 'depot',
    platform: null,
    createdAt: 0,
  }
}

export function createInitialState(level = 1): GameState {
  const target = levelTarget(level)
  const state: GameState = {
    level,
    levelTarget: target,
    spawnedThisLevel: 0,
    sentThisLevel: 0,
    levelTicksLeft: levelTimeTicks(level),
    levelStatus: 'playing',
    paused: true,
    platformPassengers: [],
    depotSelection: [],
    bonusUsedThisLevel: false,
    launchingTrain: null,
    pendingPlatformDispatch: null,
    queueTrains: [],
    platforms: [null],
    nextPassengerId: 1,
    nextTrainId: 1,
    tick: 0,
    arrivalSeq: 0,
    weights: emptyWeights(),
    needTicks: emptyNeedTicks(),
    lastSpawnTick: -999,
    spawnCooldown: SPAWN_BASE_COOLDOWN,
  }
  // start with an empty platform: passengers will appear gradually at the respawn point
  state.lastSpawnTick = state.tick - state.spawnCooldown
  return state
}

function weightedColor(state: GameState): Color {
  let total = 0
  for (const c of COLORS) total += state.weights[c]
  let r = rand() * total
  for (const c of COLORS) {
    r -= state.weights[c]
    if (r <= 0) return c
  }
  return COLORS[COLORS.length - 1]
}

function createsFourRun(arr: Passenger[], idx: number, color: Color) {
  // check if placing color at idx would create 4 consecutive same
  const get = (i: number) => {
    if (i === idx) return color
    if (i < idx) return arr[i]?.color
    return arr[i - 1]?.color
  }
  const len = arr.length + 1
  for (let start = Math.max(0, idx - 3); start <= Math.min(idx, len - 4); start++) {
    const c0 = get(start)
    if (c0 !== color) continue
    if (get(start + 1) === c0 && get(start + 2) === c0 && get(start + 3) === c0) return true
  }
  return false
}

export function spawnPassenger(state: GameState, force = false) {
  if (state.spawnedThisLevel >= state.levelTarget) return
  const total = state.platformPassengers.length
  if (!force && total >= PLATFORM_CAPACITY) return
  const color = weightedColor(state)
  const id = state.nextPassengerId++
  const p: Passenger = { id, color, spawnTick: state.tick, seed: passengerSeed(id, state.tick) }
  // stable append: game behavior must not depend on physical array position/random insertion
  state.platformPassengers.push(p)
  state.spawnedThisLevel++
  if (state.platformPassengers.length > PLATFORM_CAPACITY) {
    state.platformPassengers.length = PLATFORM_CAPACITY
  }
}

// compatibility alias
export function spawnPassengerGroup(state: GameState, force = false) {
  spawnPassenger(state, force)
}



export function selectDepotWagon(state: GameState, color: Color | 'bonus'): void {
  if (state.levelStatus !== 'playing') return
  if (state.launchingTrain) return
  if (state.depotSelection.length >= 3) return
  if (color === 'bonus') {
    if (state.bonusUsedThisLevel || state.depotSelection.includes('bonus')) return
  }
  state.depotSelection.push(color)
  if (state.depotSelection.length === 3) {
    if (state.depotSelection.includes('bonus')) state.bonusUsedThisLevel = true
    const colors = state.depotSelection.splice(0, 3)
    state.launchingTrain = { colors: [...colors], dir: 'left', ticks: 5 }
    state.pendingPlatformDispatch = { colors: [...colors], ticks: 5 }
  }
}

export function clearDepotSelection(state: GameState): void {
  state.depotSelection = []
}

export function kickTrain(state: GameState): void {
  if (state.levelStatus !== 'playing') return
  const t = state.platforms[0]
  if (!t || t.status !== 'boarding') return
  t.status = 'departing'
  t.animTicks = 5
}

function dispatchTrain(state: GameState, train: Train) {
  const free = state.platforms[0] == null ? 0 : -1
  if (free === -1) {
    train.status = 'queued'
    train.platform = null
    state.queueTrains.push(train)
  } else {
    arriveOnPlatform(state, train, 0)
  }
}

function arriveOnPlatform(state: GameState, train: Train, platform: 0) {
  train.status = 'arriving'
  train.animTicks = 5
  train.platform = platform
  train.arrivedAt = state.arrivalSeq++
  state.platforms[platform] = train
}

function wagonSpace(w: Wagon) {
  return bonusBoardLimit(w) - w.passengers.length - w.boarding
}

function bonusBoardLimit(w: Wagon) {
  // bonus wagon accepts 2 passengers (any same color group) after regular seating
  return w.color === 'bonus' ? 2 : WAGON_CAPACITY
}

function isTrainSeatedFull(t: Train) {
  return t.wagons.every(w => w.passengers.length >= bonusBoardLimit(w))
}

function trainPassengerCount(t: Train) {
  return t.wagons.reduce((s, w) => s + w.passengers.length, 0)
}

function progressAnimations(state: GameState) {
  for (let i = 0; i < 1; i++) {
    const t = state.platforms[i]
    if (!t) continue
    if (t.status === 'arriving') {
      t.animTicks = (t.animTicks ?? 1) - 1
      if (t.animTicks <= 0) {
        t.status = 'boarding'
        t.animTicks = 0
        t.boardingStartTick = state.tick
      }
    } else if (t.status === 'departing') {
      t.animTicks = (t.animTicks ?? 1) - 1
      if (t.animTicks <= 0) {
        // count sent passengers on actual departure
        state.sentThisLevel += trainPassengerCount(t)
        state.platforms[i] = null
        if (state.queueTrains.length > 0) {
          const next = state.queueTrains.shift()!
          arriveOnPlatform(state, next, 0)
        }
      }
    }
  }
}

function canBoardWagon(w: Wagon, p: Passenger): boolean {
  if (wagonSpace(w) <= 0) return false
  if (w.color === 'bonus') {
    // accepts passengers of the same color; color group fixed by first seated/reserved
    const groupColor = w.passengers[0]?.color ?? (w.boarding > 0 ? null : p.color)
    // if boarding already reserved but no one seated yet, we must infer allowed color from waiting targets is tricky;
    // simpler: allow if empty+no boarding, or matches seated color. If boarding>0 and empty, allow same as p only when consistent via existing reservations tracked by passengers - handled below by checking any passenger targeting this wagon
    if (w.passengers.length > 0) return p.color === w.passengers[0].color
    return true // color decided by this passenger if no seated and group not fixed externally
  }
  return w.color === p.color
}

function bonusGroupColor(state: GameState, train: Train, wi: number): Color | null {
  const w = train.wagons[wi]
  if (w.color !== 'bonus') return null
  if (w.passengers.length > 0) return w.passengers[0].color
  const targeting = state.platformPassengers.find(p => p.boardingTo?.platform === 0 && p.boardingTo.wagonIndex === wi)
  return targeting?.color ?? null
}

function repairBoardingState(state: GameState) {
  // repair wagon boarding counters and drop orphan/invalid reservations
  for (let pi = 0; pi < 1; pi++) {
    const t = state.platforms[pi]
    if (!t) continue
    const trainFull = t.status === 'boarding' && isTrainSeatedFull(t)
    for (let wi = 0; wi < t.wagons.length; wi++) {
      const w = t.wagons[wi]
      const targeting = state.platformPassengers.filter(p => p.boardingTo?.platform === pi && p.boardingTo.wagonIndex === wi)
      if (t.status !== 'boarding' || trainFull) {
        if (w.boarding !== 0 || targeting.length > 0) {
          w.boarding = 0
          for (const p of targeting) { delete p.boardingTo; delete p.boardingSinceTick }
        }
        continue
      }
      // remove invalid targets for this wagon
      const validTargeting: typeof targeting = []
      for (const p of targeting) {
        const limit = bonusBoardLimit(w)
        const seated = w.passengers.length
        let ok = seated < limit
        if (ok) {
          if (w.color === 'bonus') {
            const gc = w.passengers.length > 0 ? w.passengers[0].color : (validTargeting[0]?.color ?? p.color)
            ok = p.color === gc
          } else {
            ok = p.color === w.color
          }
        }
        if (ok) validTargeting.push(p)
        else { delete p.boardingTo; delete p.boardingSinceTick }
      }
      w.boarding = validTargeting.length
      // clamp impossible overbooking
      const maxBoarding = Math.max(0, bonusBoardLimit(w) - w.passengers.length)
      if (w.boarding > maxBoarding) {
        const extra = validTargeting.slice(maxBoarding)
        for (const p of extra) { delete p.boardingTo; delete p.boardingSinceTick }
        w.boarding = maxBoarding
      }
    }
  }
}

function startBoarding(state: GameState) {
  repairBoardingState(state)
  const active = state.platforms
    .filter((t: Train | null): t is Train => !!t && t.status === 'boarding')
    .sort((a, b) => (a.arrivedAt ?? 0) - (b.arrivedAt ?? 0))
  // clear targets for passengers no longer valid
  for (const p of state.platformPassengers) {
    if (p.boardingTo) {
      const train = state.platforms[p.boardingTo.platform]
      const w = train?.wagons[p.boardingTo.wagonIndex]
      let valid = !!train && train.status === 'boarding' && !!w && wagonSpace(w) >= 0
      if (valid && w) {
        if (w.color === 'bonus') {
          const gc = bonusGroupColor(state, train!, p.boardingTo.wagonIndex)
          valid = !gc || gc === p.color
        } else {
          valid = w.color === p.color
        }
      } else valid = false
      if (!valid) {
        if (w) w.boarding = Math.max(0, w.boarding - 1)
        delete p.boardingTo
        delete p.boardingSinceTick
      }
    }
  }
  if (active.length === 0) return

  // predictable/stable processing order independent of incidental array arrangement
  const passengersForAssignment = [...state.platformPassengers].sort((a, b) => a.id - b.id)

  const tryAssign = (allowBonus: boolean) => {
    for (const p of passengersForAssignment) {
      if (p.boardingTo) continue
      for (const train of active) {
        for (let wi = 0; wi < train.wagons.length; wi++) {
          const w = train.wagons[wi]
          const isBonus = w.color === 'bonus'
          if (isBonus !== allowBonus) continue
          if (wagonSpace(w) <= 0) continue
          if (isBonus) {
            const gc = bonusGroupColor(state, train, wi)
            if (gc && gc !== p.color) continue
            w.boarding += 1
            p.boardingTo = { platform: 0, wagonIndex: wi }
            p.boardingSinceTick = state.tick
            break
          } else if (w.color === p.color) {
            w.boarding += 1
            p.boardingTo = { platform: 0, wagonIndex: wi }
            p.boardingSinceTick = state.tick
            break
          }
        }
        if (p.boardingTo) break
      }
    }
  }

  // 1) regular wagons first
  tryAssign(false)

  // 2) bonus wagon only after no more regular boarding is possible for waiting passengers
  const canRegularBoardAny = () => {
    for (const p of state.platformPassengers) {
      if (p.boardingTo) continue
      for (const train of active) {
        for (let wi = 0; wi < train.wagons.length; wi++) {
          const w = train.wagons[wi]
          if (w.color !== 'bonus' && w.color === p.color && wagonSpace(w) > 0) return true
        }
      }
    }
    return false
  }
  if (!canRegularBoardAny()) {
    tryAssign(true)
  }
}

export function finalizeBoarding(state: GameState, passengerId: number) {
  const idx = state.platformPassengers.findIndex(p => p.id === passengerId)
  if (idx < 0) return
  const p = state.platformPassengers[idx]
  if (!p.boardingTo) return
  const train = state.platforms[p.boardingTo.platform]
  if (!train) { delete p.boardingTo; return }
  const w = train.wagons[p.boardingTo.wagonIndex]
  w.boarding = Math.max(0, w.boarding - 1)
  state.platformPassengers.splice(idx, 1)
  const limit = bonusBoardLimit(w)
  const colorOk = w.color === 'bonus' ? (w.passengers.length === 0 || w.passengers[0].color === p.color) : w.color === p.color
  if (w.passengers.length < limit && colorOk) {
    w.passengers.push({ id: p.id, color: p.color })
  } else {
    // fallback: return passenger without target if wagon unexpectedly full/mismatched
    delete p.boardingTo
    delete p.boardingSinceTick
    state.platformPassengers.push(p)
  }
}

function autoFinalizeBoarding(state: GameState) {
  // safety net: if UI animation/finalization stalls, complete boarding logically
  const toFinalize: number[] = []
  for (const p of state.platformPassengers) {
    if (!p.boardingTo) continue
    if (p.boardingSinceTick == null) continue
    if (state.tick - p.boardingSinceTick < 12) continue
    const train = state.platforms[p.boardingTo.platform]
    if (!train || train.status !== 'boarding') continue
    const w = train.wagons[p.boardingTo.wagonIndex]
    if (!w) continue
    const limit = bonusBoardLimit(w)
    const colorOk = w.color === 'bonus' ? (w.passengers.length === 0 || w.passengers[0].color === p.color) : w.color === p.color
    if (w.passengers.length < limit && colorOk) toFinalize.push(p.id)
  }
  for (const id of toFinalize) finalizeBoarding(state, id)
}

function checkDepartures(state: GameState) {
  for (let i = 0; i < 1; i++) {
    const t = state.platforms[i]
    if (!t || t.status !== 'boarding') continue
    if (isTrainSeatedFull(t)) {
      // clear any dangling boarding reservations/targets for a full train
      for (const w of t.wagons) w.boarding = 0
      for (const p of state.platformPassengers) {
        if (p.boardingTo?.platform === i) {
          delete p.boardingTo
          delete p.boardingSinceTick
        }
      }
      t.status = 'departing'
      t.animTicks = 5
    }
  }
}

function progressLaunching(state: GameState) {
  if (!state.launchingTrain) return
  state.launchingTrain.ticks -= 1
  if (state.launchingTrain.ticks <= 0) {
    state.launchingTrain = null
  }
}

function progressPendingPlatformDispatch(state: GameState) {
  if (!state.pendingPlatformDispatch) return
  state.pendingPlatformDispatch.ticks -= 1
  if (state.pendingPlatformDispatch.ticks <= 0) {
    const train = createTrainFromColors(state.nextTrainId++, state.pendingPlatformDispatch.colors)
    train.createdAt = state.tick
    state.pendingPlatformDispatch = null
    dispatchTrain(state, train)
  }
}

export function updateAdaptation(state: GameState) {
  const needed = new Set<Color>()
  for (const t of state.platforms) {
    if (!t || (t.status !== 'boarding' && t.status !== 'arriving')) continue
    for (const w of t.wagons) {
      if (w.color !== 'bonus' && w.passengers.length + w.boarding < WAGON_CAPACITY) needed.add(w.color)
    }
  }
  for (const c of COLORS) {
    if (needed.has(c)) state.needTicks[c] = Math.min(state.needTicks[c] + 1, 200)
    else state.needTicks[c] = Math.max(state.needTicks[c] - 2, 0)
  }
  for (const c of COLORS) {
    const boost = Math.min(state.needTicks[c] / 40, 1.5)
    state.weights[c] = 1 + boost
  }
  const sum = COLORS.reduce((s, c) => s + state.weights[c], 0)
  for (const c of COLORS) {
    const maxShare = 0.38
    if (state.weights[c] / sum > maxShare) {
      state.weights[c] = (maxShare * (sum - state.weights[c])) / (1 - maxShare)
    }
  }
  state.spawnCooldown = SPAWN_BASE_COOLDOWN
}

function checkLevelEnd(state: GameState) {
  if (state.levelStatus !== 'playing') return
  if (state.sentThisLevel >= state.levelTarget) {
    state.levelStatus = state.level >= MAX_LEVEL ? 'complete' : 'won'
    return
  }
  if (state.levelTicksLeft <= 0) {
    state.levelStatus = 'lost'
  }
}

function isTimerPaused(state: GameState) {
  if (state.paused) return true
  const t = state.platforms[0]
  return !!t && (t.status === 'arriving' || t.status === 'departing')
}

export function togglePause(state: GameState): void {
  if (state.levelStatus !== 'playing') return
  state.paused = !state.paused
}

export function tick(state: GameState) {
  if (state.levelStatus !== 'playing') return
  state.tick++
  if (!isTimerPaused(state)) state.levelTicksLeft--
  updateAdaptation(state)
  if (state.tick - state.lastSpawnTick >= state.spawnCooldown) {
    if (state.spawnedThisLevel < state.levelTarget) {
      spawnPassenger(state)
    }
    state.lastSpawnTick = state.tick
  }
  progressLaunching(state)
  progressPendingPlatformDispatch(state)
  progressAnimations(state)
  startBoarding(state)
  autoFinalizeBoarding(state)
  checkDepartures(state)
  checkLevelEnd(state)
}

export function restart(): GameState {
  return createInitialState(1)
}

export function nextLevel(state: GameState): GameState {
  const nl = Math.min(state.level + 1, MAX_LEVEL)
  const next = createInitialState(nl)
  next.nextPassengerId = state.nextPassengerId
  next.nextTrainId = state.nextTrainId
  return next
}

export function retryLevel(state: GameState): GameState {
  const next = createInitialState(state.level)
  next.nextPassengerId = state.nextPassengerId
  next.nextTrainId = state.nextTrainId
  return next
}
