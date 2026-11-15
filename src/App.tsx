import { useEffect, useRef, useState } from 'react'
import { COLORS, type Color, type GameState, type Passenger, type Train } from './game/types'
import { WAGON_CAPACITY, MAX_LEVEL, createInitialState, selectDepotWagon, clearDepotSelection, kickTrain, finalizeBoarding, tick, nextLevel, retryLevel, restart, togglePause } from './game/logic'

function cloneState(s: GameState): GameState {
  return structuredClone(s)
}

const COLOR_HEX: Record<Color, string> = {
  red: '#ff5b5b',
  orange: '#ff9f43',
  yellow: '#ffd93d',
  green: '#43c96b',
  cyan: '#46d6e8',
  blue: '#4d7cff',
  violet: '#a66bff',
}

const COLOR_NAME: Record<Color, string> = {
  red: 'красный',
  orange: 'оранжевый',
  yellow: 'жёлтый',
  green: 'зелёный',
  cyan: 'голубой',
  blue: 'синий',
  violet: 'фиолетовый',
}

const COLOR_IMAGE: Record<Color, string> = {
  red: '/MetroNikitki/wagons/%D0%9A%D1%80%D0%B0%D1%81%D0%BD%D1%8B%D0%B9.png',
  orange: '/MetroNikitki/wagons/%D0%9E%D1%80%D0%B0%D0%BD%D0%B6%D0%B5%D0%B2%D1%8B%D0%B9.png',
  yellow: '/MetroNikitki/wagons/%D0%96%D0%B5%D0%BB%D1%82%D1%8B%D0%B9.png',
  green: '/MetroNikitki/wagons/%D0%97%D0%B5%D0%BB%D0%B5%D0%BD%D1%8B%D0%B9.png',
  cyan: '/MetroNikitki/wagons/%D0%93%D0%BE%D0%BB%D1%83%D0%B1%D0%BE%D0%B9.png',
  blue: '/MetroNikitki/wagons/%D0%A1%D0%B8%D0%BD%D0%B8%D0%B9.png',
  violet: '/MetroNikitki/wagons/%D0%A4%D0%B8%D0%BE%D0%BB%D0%B5%D1%82%D0%BE%D0%B2%D1%8B%D0%B9.png',
}
const HEAD_IMAGE = '/MetroNikitki/wagons/%D0%93%D0%BE%D0%BB%D0%BE%D0%B2%D0%BD%D0%BE%D0%B9.png'
const BONUS_IMAGE = '/MetroNikitki/wagons/%D0%91%D0%BE%D0%BD%D1%83%D1%81.png'
const ESCALATOR_IMAGE = '/MetroNikitki/wagons/%D0%AD%D0%BA%D1%81%D0%BA%D0%BE%D0%BB%D0%B0%D1%82%D0%BE%D1%80.png'
const TITLE_IMAGE = '/MetroNikitki/wagons/%D0%97%D0%B0%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D0%B0%D1%8F.png'
const PLAY_BUTTON_IMAGE = '/MetroNikitki/wagons/%D0%9A%D0%BD%D0%BE%D0%BF%D0%BA%D0%B0%20%D0%B8%D0%B3%D1%80%D0%B0%D1%82%D1%8C.png'

const STATIONS: { name: string; image: string }[] = [
  { name: 'Царицыно', image: '/MetroNikitki/wagons/%D0%A6%D0%B0%D1%80%D0%B8%D1%86%D1%8B%D0%BD%D0%BE.png' },
  { name: 'Автозаводская', image: '/MetroNikitki/wagons/%D0%90%D0%B2%D1%82%D0%BE%D0%B7%D0%B0%D0%B2%D0%BE%D0%B4%D1%81%D0%BA%D0%B0%D1%8F.png' },
  { name: 'Баррикадная', image: '/MetroNikitki/wagons/%D0%91%D0%B0%D1%80%D1%80%D0%B8%D0%BA%D0%B0%D0%B4%D0%BD%D0%B0%D1%8F.png' },
  { name: 'Ботанический сад', image: '/MetroNikitki/wagons/%D0%91%D0%BE%D1%82%D0%B0%D0%BD%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9%20%D1%81%D0%B0%D0%B4.png' },
  { name: 'ВДНХ', image: '/MetroNikitki/wagons/%D0%92%D0%94%D0%9D%D0%A5.png' },
  { name: 'Деловой центр', image: '/MetroNikitki/wagons/%D0%94%D0%B5%D0%BB%D0%BE%D0%B2%D0%BE%D0%B9%20%D1%86%D0%B5%D0%BD%D1%82%D1%80.png' },
  { name: 'Каширская', image: '/MetroNikitki/wagons/%D0%9A%D0%B0%D1%88%D0%B8%D1%80%D1%81%D0%BA%D0%B0%D1%8F.png' },
  { name: 'Коломенская', image: '/MetroNikitki/wagons/%D0%9A%D0%BE%D0%BB%D0%BE%D0%BC%D0%B5%D0%BD%D1%81%D0%BA%D0%B0%D1%8F.png' },
  { name: 'Красные ворота', image: '/MetroNikitki/wagons/%D0%9A%D1%80%D0%B0%D1%81%D0%BD%D1%8B%D0%B5%20%D0%B2%D0%BE%D1%80%D0%BE%D1%82%D0%B0.png' },
  { name: 'Кропоткинская', image: '/MetroNikitki/wagons/%D0%9A%D1%80%D0%BE%D0%BF%D0%BE%D1%82%D0%BA%D0%B8%D0%BD%D1%81%D0%BA%D0%B0%D1%8F.png' },
  { name: 'Кутузовская', image: '/MetroNikitki/wagons/%D0%9A%D1%83%D1%82%D1%83%D0%B7%D0%BE%D0%B2%D1%81%D0%BA%D0%B0%D1%8F.png' },
  { name: 'Маяковская', image: '/MetroNikitki/wagons/%D0%9C%D0%B0%D1%8F%D0%BA%D0%BE%D0%B2%D1%81%D0%BA%D0%B0%D1%8F.png' },
  { name: 'Павелецкая', image: '/MetroNikitki/wagons/%D0%9F%D0%B0%D0%B2%D0%B5%D0%BB%D0%B5%D1%86%D0%BA%D0%B0%D1%8F.png' },
  { name: 'Парк победы', image: '/MetroNikitki/wagons/%D0%9F%D0%B0%D1%80%D0%BA%20%D0%BF%D0%BE%D0%B1%D0%B5%D0%B4%D1%8B.png' },
  { name: 'Речной вокзал', image: '/MetroNikitki/wagons/%D0%A0%D0%B5%D1%87%D0%BD%D0%BE%D0%B9%20%D0%B2%D0%BE%D0%BA%D0%B7%D0%B0%D0%BB.png' },
  { name: 'Спортивная', image: '/MetroNikitki/wagons/%D0%A1%D0%BF%D0%BE%D1%80%D1%82%D0%B8%D0%B2%D0%BD%D0%B0%D1%8F.png' },
  { name: 'Тверская', image: '/MetroNikitki/wagons/%D0%A2%D0%B2%D0%B5%D1%80%D1%81%D0%BA%D0%B0%D1%8F.png' },
  { name: 'Театральная', image: '/MetroNikitki/wagons/%D0%A2%D0%B5%D0%B0%D1%82%D1%80%D0%B0%D0%BB%D1%8C%D0%BD%D0%B0%D1%8F.png' },
  { name: 'Технопарк', image: '/MetroNikitki/wagons/%D0%A2%D0%B5%D1%85%D0%BD%D0%BE%D0%BF%D0%B0%D1%80%D0%BA.png' },
  { name: 'Третьяковская', image: '/MetroNikitki/wagons/%D0%A2%D1%80%D0%B5%D1%82%D1%8C%D1%8F%D0%BA%D0%BE%D0%B2%D1%81%D0%BA%D0%B0%D1%8F.png' }
]


function PassengerChar({ p, small, tiny, platform, mood }: { p: Passenger; small?: boolean; tiny?: boolean; platform?: boolean; mood?: 'happy' | 'impatient' }) {
  const size = platform ? 42 : tiny ? 20 : small ? 18 : 32
  const c = COLOR_HEX[p.color]
  const impatient = mood === 'impatient'
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={`passenger ${impatient ? 'impatient' : ''}`} aria-label={COLOR_NAME[p.color]}>
      <circle cx="20" cy="14" r="9" fill={c} />
      <rect x="11" y="22" width="18" height="14" rx="7" fill={c} />
      <circle cx="16.5" cy="13" r="1.8" fill="#fff" />
      <circle cx="23.5" cy="13" r="1.8" fill="#fff" />
      {impatient ? (
        <>
          <circle cx="17" cy="13.5" r="0.9" fill="#333" />
          <circle cx="24" cy="13.5" r="0.9" fill="#333" />
          <path d="M15 11 L18 12" stroke="#333" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M25 11 L22 12" stroke="#333" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M16.5 18 Q20 16 23.5 18" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="17" cy="13.5" r="0.9" fill="#333" />
          <circle cx="24" cy="13.5" r="0.9" fill="#333" />
          <path d="M16 17 Q20 20 24 17" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

function WagonView({ color, passengers, compact, ghost }: { color: Color | 'bonus' | null; passengers?: Passenger[]; compact?: boolean; ghost?: boolean }) {
  if (!color) {
    return <div className={`wagon ${compact ? 'compact' : ''} ghost`}><div className="wagon-empty">?</div></div>
  }
  const capacity = color === 'bonus' ? 2 : WAGON_CAPACITY
  const ps = passengers ?? []
  const slots = Array.from({ length: capacity }, (_, i) => ps[i])
  if (color === 'bonus') {
    const groupColor = ps[0]?.color
    // In depot build preview (ghost-picked) show image wagon without seat indicators
    if (ghost) {
      return (
        <div className={`wagon ${compact ? 'compact' : ''} image-wagon bonus-wagon ghost-picked`} title="Бонусный вагон">
          <img src={BONUS_IMAGE} alt="Бонусный вагон" className="wagon-img" />
        </div>
      )
    }
    return (
      <div className={`wagon ${compact ? 'compact' : ''} image-wagon bonus-wagon`} title="Бонусный вагон">
        <div className="wagon-seats-above bonus-seats">
          {slots.map((p, i) => (
            <span key={i} className={`seat-marker ${p ? 'filled' : ''}`} style={p ? { background: COLOR_HEX[p.color], borderColor: '#2f9e44' } : groupColor ? { borderColor: COLOR_HEX[groupColor] } : undefined} />
          ))}
        </div>
        <img src={BONUS_IMAGE} alt="Бонусный вагон" className="wagon-img" />
      </div>
    )
  }
  // In depot build preview (ghost-picked) show image wagon without seat indicators
  if (ghost) {
    return (
      <div className={`wagon ${compact ? 'compact' : ''} image-wagon ghost-picked`} title={COLOR_NAME[color]}>
        <img src={COLOR_IMAGE[color]} alt={COLOR_NAME[color]} className="wagon-img" />
      </div>
    )
  }
  return (
    <div className={`wagon ${compact ? 'compact' : ''} image-wagon`} title={COLOR_NAME[color]}>
      <div className="wagon-seats-above">
        {slots.map((p, i) => (
          <span key={i} className={`seat-marker ${p ? 'filled' : ''}`} />
        ))}
      </div>
      <img src={COLOR_IMAGE[color]} alt={COLOR_NAME[color]} className="wagon-img" />
    </div>
  )
}

function TrainView({ train, compact }: { train: Train; compact?: boolean }) {
  const statusClass = train.status === 'arriving' ? 'arriving' : train.status === 'departing' ? 'departing' : ''
  const dirClass = train.platform === 0 ? 'dir-rtl' : train.platform === 1 ? 'dir-ltr' : ''
  return (
    <div className={`train track-train ${compact ? 'compact' : ''} ${statusClass} ${dirClass}`}>
      <img src={HEAD_IMAGE} alt="Головной вагон" className="train-front-img" />
      {train.wagons.map((w, i) => (
        <WagonView key={i} color={w.color} passengers={w.passengers} compact={compact} />
      ))}
    </div>
  )
}

function canShowKick(state: GameState): boolean {
  const t = state.platforms[0]
  if (!t || t.status !== 'boarding' || state.levelStatus !== 'playing') return false
  if (t.boardingStartTick == null) return false
  if (state.tick - t.boardingStartTick < 4) return false // ~3 seconds
  // show only if there is an "extra/useless" wagon: has free seats but no matching passengers available
  const waiting = state.platformPassengers
  for (let wi = 0; wi < t.wagons.length; wi++) {
    const w = t.wagons[wi]
    const limit = w.color === 'bonus' ? 2 : WAGON_CAPACITY
    const freeSeats = limit - w.passengers.length - w.boarding
    if (freeSeats <= 0) continue
    let hasMatching = false
    if (w.color === 'bonus') {
      const groupColor = w.passengers[0]?.color ?? (w.boarding > 0 ? waiting.find(p => p.boardingTo?.wagonIndex === wi)?.color : undefined)
      hasMatching = groupColor ? waiting.some(p => p.color === groupColor) : waiting.length > 0
    } else {
      hasMatching = waiting.some(p => p.color === w.color)
    }
    if (!hasMatching) return true
  }
  return false
}

const BUBBLE_TEXTS = [
  'Эй, ну где поезд?',
  'Быстрей!',
  'Я на работу опаздываю',
  'Долго ещё ждать?',
  'Скорее бы поехали!',
  'Ну когда же?',
]

const PRAISES = ['Молодец', 'Красавчик', 'Умница', 'Супер', 'Отлично', 'Так держать', 'Здорово', 'Браво']

const PROGRESS_KEY = 'metroparty_progress_v1'

function loadUnlockedLevel(): number {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return 1
    const data = JSON.parse(raw) as { unlockedLevel?: number }
    const n = Number(data.unlockedLevel)
    if (!Number.isFinite(n)) return 1
    return Math.min(MAX_LEVEL, Math.max(1, Math.floor(n)))
  } catch {
    return 1
  }
}

function saveUnlockedLevel(level: number) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ unlockedLevel: Math.min(MAX_LEVEL, Math.max(1, Math.floor(level))) }))
  } catch {
    // ignore
  }
}

function Celebration() {
  const pieces = Array.from({ length: 28 }, (_, i) => i)
  const colors = ['#ff5b5b', '#ffd93d', '#43c96b', '#4d7cff', '#a66bff', '#ff9f43', '#46d6e8']
  return (
    <div className="celebration" aria-hidden="true">
      <div className="fireworks">
        <span className="burst b1" />
        <span className="burst b2" />
        <span className="burst b3" />
      </div>
      <div className="confetti">
        {pieces.map((i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${(i * 37) % 100}%`,
              background: colors[i % colors.length],
              animationDelay: `${(i % 10) * 0.12}s`,
              animationDuration: `${1.6 + (i % 5) * 0.25}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

type Bounds = { minX: number; maxX: number; minY: number; maxY: number }

type PState = {
  x: number
  y: number
  vx: number
  vy: number
  stage: 'entering0' | 'entering1' | 'entering2' | 'waiting' | 'boarding'
  phaseA: number
  phaseT: number
  rng: number
  spawnMs: number
  releaseMs: number
  seed: number
}

function clamp(v: number, min: number, max: number) { return v < min ? min : v > max ? max : v }

function nextRand01(state: number) {
  // LCG, deterministic per passenger
  let x = (Math.imul(state, 1664525) + 1013904223) >>> 0
  if (x === 0) x = 1
  return { value: x / 0x100000000, state: x }
}

function WaitingPassengers({ platformPassengers, overcrowded, onFinalizeBoarding }: { platformPassengers: Passenger[]; overcrowded: boolean; onFinalizeBoarding: (id: number) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [bubbles, setBubbles] = useState<{ id: number; passengerId: number; text: string }[]>([])
  const idRef = useRef(1)
  const passengersRef = useRef(platformPassengers)
  passengersRef.current = platformPassengers
  const posRef = useRef<Map<number, PState>>(new Map())
  const spawnOrderRef = useRef(0)
  const onFinalizeRef = useRef(onFinalizeBoarding)
  onFinalizeRef.current = onFinalizeBoarding
  const boundsRef = useRef<Bounds>({ minX: 5, maxX: 90, minY: 12, maxY: 82 })
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number | null>(null)
  const bubbleRngRef = useRef(123456789)
  const [, setRenderTick] = useState(0)

  const allPassengers = platformPassengers
  const allRef = useRef(allPassengers)
  allRef.current = allPassengers

  const SPAWN_POINT = { x: 5, y: 35 }
  const ENTRY1 = { x: 7, y: 35 }
  const ENTRY2 = { x: 25, y: 80 }

  const nowMs = performance.now()
  const ids = new Set(allPassengers.map(p => p.id))
  for (const id of Array.from(posRef.current.keys())) {
    if (!ids.has(id)) posRef.current.delete(id)
  }
  const newlySeen = allPassengers.filter(p => !posRef.current.has(p.id)).sort((a, b) => a.id - b.id)
  for (const p of newlySeen) {
    const computedSeed = (((p.id * 2654435761) ^ ((p.spawnTick ?? 0) * 1013904223)) >>> 0) || 1
    const seed = p.seed ?? computedSeed
    let rng = seed >>> 0 || 1
    const r1 = nextRand01(rng); rng = r1.state
    const r2 = nextRand01(rng); rng = r2.state
    const spawnMs = nowMs
    const startDelayMs = 300 + r1.value * 900 // individual deterministic delay (300–1200ms), independent of others
    posRef.current.set(p.id, {
      x: SPAWN_POINT.x,
      y: SPAWN_POINT.y,
      vx: 0,
      vy: 0,
      stage: 'entering0',
      phaseA: r1.value * Math.PI * 2,
      phaseT: r2.value * 100,
      rng,
      spawnMs,
      releaseMs: spawnMs + startDelayMs,
      seed,
    })
  }

  // dynamic bounds based on real container size (entity and bubble safety, keep away from bottom/depot)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth || 1
      const h = el.clientHeight || 1
      const passengerPx = 42
      const bubblePx = 54
      const bottomSafePx = 10
      const topSafePx = 6
      const mx = (passengerPx / 2 / w) * 100
      const myBottom = ((passengerPx / 2 + bottomSafePx) / h) * 100
      const myTop = ((passengerPx / 2 + topSafePx) / h) * 100
      // allow entry/boarding points while keeping full entity inside container
      const minX = Math.min(SPAWN_POINT.x, ENTRY1.x, clamp(mx, 2, 10))
      const maxX = Math.max(90, 100 - mx)
      const minY = Math.min(12, clamp(myTop, 6, 20))
      const maxY = Math.min(95, 100 - myBottom)
      boundsRef.current = { minX, maxX, minY, maxY }
      // clamp existing logical positions to new bounds (no teleport jumps beyond necessary correction)
      for (const ps of posRef.current.values()) {
        ps.x = clamp(ps.x, minX, maxX)
        ps.y = clamp(ps.y, minY, maxY)
      }
    }
    update()
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => update())
      ro.observe(el)
    }
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  useEffect(() => {
    const step = (ts: number) => {
      const last = lastTsRef.current ?? ts
      let dt = (ts - last) / 1000
      lastTsRef.current = ts
      // clamp dt to keep movement stable and avoid jumps after pause/tab switches
      dt = Math.max(0.001, Math.min(dt, 0.05))
      const timeScale = dt * 60 // normalize so speeds are roughly per-frame-at-60fps equivalent

      const list = allRef.current
      const items = list.map(p => ({ p, ps: posRef.current.get(p.id)! })).filter(x => x.ps)
      const bounds = boundsRef.current
      const toFinalize: number[] = []

      // boarding queues per wagon (game interaction order), movement remains per-entity
      const boardingQueues = new Map<number, typeof items>()
      for (const item of items) {
        if (item.p.boardingTo) {
          const wi = item.p.boardingTo.wagonIndex
          if (!boardingQueues.has(wi)) boardingQueues.set(wi, [])
          boardingQueues.get(wi)!.push(item)
        }
      }
      for (const [, q] of boardingQueues) q.sort((a, b) => (a.p.boardingSinceTick ?? 0) - (b.p.boardingSinceTick ?? 0) || a.p.id - b.p.id)
      const qIndexById = new Map<number, number>()
      for (const [, q] of boardingQueues) q.forEach((it, i) => qIndexById.set(it.p.id, i))

      for (const { p, ps } of items) {
        if (p.boardingTo) ps.stage = 'boarding'
        else if (ps.stage === 'boarding') ps.stage = 'waiting'

        let ax = 0, ay = 0

        if (ps.stage === 'entering0') {
          if (ts < ps.releaseMs) {
            ps.x = SPAWN_POINT.x
            ps.y = SPAWN_POINT.y
            ps.vx = 0
            ps.vy = 0
          } else {
            // start from spawn point independently
            ps.x = SPAWN_POINT.x
            ps.y = SPAWN_POINT.y
            ps.vx = 0
            ps.vy = 0
            ps.stage = 'entering1'
          }
        } else if (ps.stage === 'entering1' || ps.stage === 'entering2') {
          const target = ps.stage === 'entering1' ? ENTRY1 : ENTRY2
          let dx = target.x - ps.x
          let dy = target.y - ps.y
          const dist = Math.hypot(dx, dy) || 1
          dx /= dist; dy /= dist
          const maxSpeed = 1.7
          ax += dx * 1.0
          ay += dy * 1.0
          ps.vx += (ax * maxSpeed - ps.vx) * 0.25 * timeScale
          ps.vy += (ay * maxSpeed - ps.vy) * 0.25 * timeScale
          const sp = Math.hypot(ps.vx, ps.vy) || 1
          const lim = maxSpeed * timeScale
          if (sp > lim) { ps.vx = (ps.vx / sp) * lim; ps.vy = (ps.vy / sp) * lim }
          if (dist < 4) {
            if (ps.stage === 'entering1') ps.stage = 'entering2'
            else ps.stage = 'waiting'
          }
        } else if (ps.stage === 'boarding' && p.boardingTo) {
          const qIdx = qIndexById.get(p.id) ?? 0
          const wi = p.boardingTo.wagonIndex
          const doorX = clamp(wi === 0 ? 22 : wi === 1 ? 32 : 42, bounds.minX, bounds.maxX)
          const doorY = clamp(10, bounds.minY, bounds.maxY)
          const tx = doorX
          const ty = qIdx === 0 ? doorY : clamp(doorY + qIdx * 7, bounds.minY, bounds.maxY)
          let dx = tx - ps.x
          let dy = ty - ps.y
          const dist = Math.hypot(dx, dy) || 1
          dx /= dist; dy /= dist
          const maxSpeed = qIdx === 0 ? (dist < 18 ? 2.6 : 2.0) : 1.4
          ax += dx * (qIdx === 0 ? 1.15 : 0.85)
          ay += dy * (qIdx === 0 ? 1.15 : 0.85)
          ps.vx += (ax * maxSpeed - ps.vx) * 0.28 * timeScale
          ps.vy += (ay * maxSpeed - ps.vy) * 0.28 * timeScale
          const sp = Math.hypot(ps.vx, ps.vy) || 1
          const lim = maxSpeed * timeScale
          if (sp > lim) { ps.vx = (ps.vx / sp) * lim; ps.vy = (ps.vy / sp) * lim }
          if (qIdx === 0 && dist < 4.5) toFinalize.push(p.id)
        } else {
          // waiting / wandering: independent seeded randomness per passenger
          ps.phaseT += 0.08 * timeScale
          const r = nextRand01(ps.rng || ps.seed || 1)
          ps.rng = r.state
          ps.phaseA += (r.value - 0.5) * 0.22 * timeScale
          const wanderX = Math.cos(ps.phaseA + Math.sin(ps.phaseT) * 0.7)
          const wanderY = Math.sin(ps.phaseA * 1.1 + Math.cos(ps.phaseT * 0.9) * 0.7)
          ax += wanderX * 0.3
          ay += wanderY * 0.3

          // keep chaotic movement inside allowed area (avoid sticking to outer edges and exclusion zone border)
          const edgePad = 10
          const edgeK = 0.018
          if (ps.x < bounds.minX + edgePad) ax += (bounds.minX + edgePad - ps.x) * edgeK
          if (ps.x > bounds.maxX - edgePad) ax -= (ps.x - (bounds.maxX - edgePad)) * edgeK
          if (ps.y < bounds.minY + edgePad) ay += (bounds.minY + edgePad - ps.y) * edgeK
          if (ps.y > bounds.maxY - edgePad) ay -= (ps.y - (bounds.maxY - edgePad)) * edgeK
          // soft repulsion from exclusion zone border (forbidden: x<=31 && y<=81)
          if (ps.x > 31 && ps.x < 31 + edgePad && ps.y <= 81) ax += (31 + edgePad - ps.x) * edgeK
          if (ps.y > 81 && ps.y < 81 + edgePad && ps.x <= 31) ay += (81 + edgePad - ps.y) * edgeK

          ps.vx += (ax - ps.vx * 0.06) * timeScale
          ps.vy += (ay - ps.vy * 0.06) * timeScale
          const maxSpeed = 0.448
          const sp = Math.hypot(ps.vx, ps.vy) || 1
          const lim = maxSpeed * timeScale
          if (sp > lim) { ps.vx = (ps.vx / sp) * lim; ps.vy = (ps.vy / sp) * lim }
        }

        // integrate logical position
        if (!(ps.stage === 'entering0')) {
          ps.x += ps.vx
          ps.y += ps.vy
        }

        // enforce bounds (separate safe area for waiting/wandering; boarding can reach doorY)
        if (ps.stage === 'boarding') {
          ps.x = clamp(ps.x, bounds.minX, bounds.maxX)
          ps.y = clamp(ps.y, Math.min(bounds.minY, 10), bounds.maxY)
        } else {
          ps.x = clamp(ps.x, bounds.minX, bounds.maxX)
          ps.y = clamp(ps.y, bounds.minY, bounds.maxY)
        }

        // exclusion zone for chaotic movement only: rectangle (0,0)-(31,81) is forbidden
        if (ps.stage === 'waiting') {
          const ex1 = 31, ey1 = 81
          if (ps.x <= ex1 && ps.y <= ey1) {
            const dxOut = ex1 - ps.x
            const dyOut = ey1 - ps.y
            if (dxOut < dyOut) {
              ps.x = Math.min(bounds.maxX, ex1 + 0.5)
              if (ps.vx < 0) ps.vx = 0
            } else {
              ps.y = Math.min(bounds.maxY, ey1 + 0.5)
              if (ps.vy < 0) ps.vy = 0
            }
          }
          // prevent rubbing/sliding along outer edges
          const edgeEps = 0.6
          if (ps.x <= bounds.minX + edgeEps && ps.vx < 0) ps.vx = Math.abs(ps.vx) * 0.3
          if (ps.x >= bounds.maxX - edgeEps && ps.vx > 0) ps.vx = -Math.abs(ps.vx) * 0.3
          if (ps.y <= bounds.minY + edgeEps && ps.vy < 0) ps.vy = Math.abs(ps.vy) * 0.3
          if (ps.y >= bounds.maxY - edgeEps && ps.vy > 0) ps.vy = -Math.abs(ps.vy) * 0.3
        }
      }

      // pinball-like collisions: passengers bounce off each other
      for (let i = 0; i < items.length; i++) {
        const a = items[i].ps
        if (a.stage === 'entering0') continue
        for (let j = i + 1; j < items.length; j++) {
          const b = items[j].ps
          if (b.stage === 'entering0') continue
          let dx = b.x - a.x
          let dy = b.y - a.y
          let dist2 = dx * dx + dy * dy
          const minDist = 6.2
          if (dist2 === 0) { dx = 0.1; dy = 0; dist2 = dx * dx + dy * dy }
          if (dist2 < minDist * minDist) {
            const dist = Math.sqrt(dist2) || 1
            const nx = dx / dist
            const ny = dy / dist
            const overlap = minDist - dist
            const sep = overlap / 2
            a.x -= nx * sep
            a.y -= ny * sep
            b.x += nx * sep
            b.y += ny * sep
            const dvx = b.vx - a.vx
            const dvy = b.vy - a.vy
            const dvn = dvx * nx + dvy * ny
            if (dvn < 0) {
              const imp = dvn
              a.vx += imp * nx
              a.vy += imp * ny
              b.vx -= imp * nx
              b.vy -= imp * ny
            }
          }
        }
      }

      // keep within bounds after collisions
      for (const { ps } of items) {
        if (ps.stage === 'boarding') {
          ps.x = clamp(ps.x, bounds.minX, bounds.maxX)
          ps.y = clamp(ps.y, Math.min(bounds.minY, 10), bounds.maxY)
        } else if (ps.stage !== 'entering0') {
          ps.x = clamp(ps.x, bounds.minX, bounds.maxX)
          ps.y = clamp(ps.y, bounds.minY, bounds.maxY)
          if (ps.stage === 'waiting') {
            const ex1 = 31, ey1 = 81
            if (ps.x <= ex1 && ps.y <= ey1) {
              if (ex1 - ps.x < ey1 - ps.y) ps.x = Math.min(bounds.maxX, ex1 + 0.5)
              else ps.y = Math.min(bounds.maxY, ey1 + 0.5)
            }
          }
        }
      }

      if (toFinalize.length) {
        const uniq = Array.from(new Set(toFinalize))
        for (const idp of uniq) onFinalizeRef.current(idp)
      }

      setRenderTick(t => (t + 1) % 1000000)
      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      lastTsRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!overcrowded) {
      setBubbles([])
      return
    }
    const spawn = () => {
      const list = allRef.current.length > 0 ? allRef.current : passengersRef.current
      if (list.length === 0) return
      setBubbles((prev) => {
        const alive = prev.filter((b) => list.some((p) => p.id === b.passengerId))
        const filtered = alive.length >= 2 ? alive.slice(1) : alive
        const r1 = nextRand01(bubbleRngRef.current); bubbleRngRef.current = r1.state
        const r2 = nextRand01(bubbleRngRef.current); bubbleRngRef.current = r2.state
        const p = list[Math.floor(r1.value * list.length)]
        const text = BUBBLE_TEXTS[Math.floor(r2.value * BUBBLE_TEXTS.length)]
        const bid = idRef.current++
        const next = [...filtered, { id: bid, passengerId: p.id, text }]
        window.setTimeout(() => {
          setBubbles((cur) => cur.filter((b) => b.id !== bid))
        }, 3500)
        return next
      })
    }
    spawn()
    const t = window.setInterval(spawn, 2600)
    return () => window.clearInterval(t)
  }, [overcrowded])

  const posMap = posRef.current
  const idsNow = new Set(allPassengers.map(p => p.id))
  const bubbleByPassenger = new Map<number, string>()
  for (const b of bubbles) if (idsNow.has(b.passengerId) && !bubbleByPassenger.has(b.passengerId)) bubbleByPassenger.set(b.passengerId, b.text)

  return (
    <div className="waiting-layout">
      <div className="platform-rows free-move" ref={containerRef}>
        {allPassengers.map((p) => {
          const text = bubbleByPassenger.get(p.id)
          const pos = posMap.get(p.id)
          const style = pos ? { left: `${pos.x}%`, top: `${pos.y}%` } : undefined
          return (
            <div key={p.id} className={`passenger-wrap dense free-passenger ${p.boardingTo ? 'boarding-target' : ''}`} style={style as any}>
              {text && <div className="speech-bubble">{text}</div>}
              <PassengerChar p={p} platform mood={text ? 'impatient' : 'happy'} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function App() {
  const [started, setStarted] = useState(false)
  const [unlockedLevel, setUnlockedLevel] = useState<number>(() => loadUnlockedLevel())
  const [showLevelSelect, setShowLevelSelect] = useState(false)
  const [state, setState] = useState<GameState>(() => createInitialState(loadUnlockedLevel()))
  const [passingTrainKey, setPassingTrainKey] = useState(0)
  const [passingTrain, setPassingTrain] = useState<Color[] | null>(null)
  const [depotArriveKey, setDepotArriveKey] = useState(0)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    if (!started) return
    const id = setInterval(() => {
      const next = cloneState(stateRef.current)
      tick(next)
      setState(next)
    }, 700)
    return () => clearInterval(id)
  }, [started])

  useEffect(() => {
    if (state.levelStatus === 'won') {
      const nextUnlock = Math.min(MAX_LEVEL, state.level + 1)
      setUnlockedLevel((prev) => {
        const u = Math.max(prev, nextUnlock)
        if (u !== prev) saveUnlockedLevel(u)
        return u
      })
    } else if (state.levelStatus === 'complete') {
      setUnlockedLevel((prev) => {
        const u = Math.max(prev, MAX_LEVEL)
        if (u !== prev) saveUnlockedLevel(u)
        else saveUnlockedLevel(u)
        return u
      })
    }
  }, [state.levelStatus, state.level])

  const startLevel = (level: number) => {
    const lvl = Math.min(unlockedLevel, Math.max(1, Math.floor(level)))
    setState(createInitialState(lvl))
    setShowLevelSelect(false)
  }

  const onPick = (color: Color | 'bonus') => {
    setState((prev) => {
      const next = cloneState(prev)
      selectDepotWagon(next, color)
      return next
    })
  }

  const onClear = () => {
    setState((prev) => {
      const next = cloneState(prev)
      clearDepotSelection(next)
      return next
    })
  }

  const onKick = () => {
    setState((prev) => {
      const next = cloneState(prev)
      kickTrain(next)
      return next
    })
  }

  const onFinalizeBoarding = (passengerId: number) => {
    setState((prev) => {
      const next = cloneState(prev)
      finalizeBoarding(next, passengerId)
      return next
    })
  }

  const onRestart = () => setState((prev) => createInitialState(prev.level))
  const onNext = () => setState((prev) => nextLevel(prev))
  const onRetry = () => setState((prev) => retryLevel(prev))
  const onOpenLevels = () => setShowLevelSelect(true)
  const onCloseLevels = () => setShowLevelSelect(false)
  const onTogglePause = () => {
    setState((prev) => {
      const next = cloneState(prev)
      togglePause(next)
      return next
    })
  }

  const idleSinceRef = useRef(Date.now())
  const prevSelectionRef = useRef(0)
  const prevLaunchingRef = useRef(false)
  const prevLevelRef = useRef(state.level)

  // after a train is launched from depot, bring next empty depot train in from the right
  useEffect(() => {
    const wasLaunching = prevLaunchingRef.current
    const isLaunching = !!state.launchingTrain
    if (wasLaunching && !isLaunching) setDepotArriveKey(k => k + 1)
  }, [state.launchingTrain])

  // decorative passing train if user idle in depot for 5s
  useEffect(() => {
    const check = window.setInterval(() => {
      const s = stateRef.current
      if (s.level !== prevLevelRef.current) {
        prevLevelRef.current = s.level
        idleSinceRef.current = Date.now()
      }
      if (s.depotSelection.length !== prevSelectionRef.current || !!s.launchingTrain !== prevLaunchingRef.current) {
        prevSelectionRef.current = s.depotSelection.length
        prevLaunchingRef.current = !!s.launchingTrain
        idleSinceRef.current = Date.now()
      }
      if (s.launchingTrain || s.platforms[0] || s.levelStatus !== 'playing') {
        idleSinceRef.current = Date.now()
        return
      }
      if (!passingTrain && Date.now() - idleSinceRef.current >= 3000) {
        idleSinceRef.current = Date.now()
        setPassingTrain([...COLORS])
        setPassingTrainKey(k => k + 1)
      }
    }, 500)
    return () => window.clearInterval(check)
  }, [passingTrain])

  const selection = state.depotSelection
  const slots: (Color | 'bonus' | null)[] = state.launchingTrain
    ? [...state.launchingTrain.colors]
    : [selection[0] ?? null, selection[1] ?? null, selection[2] ?? null]
  const bonusSelected = selection.includes('bonus')
  const canPickBonus = !state.bonusUsedThisLevel && !bonusSelected && !state.launchingTrain && state.levelStatus === 'playing' && selection.length < 3
  const overcrowded = state.platformPassengers.length >= 12

  const secondsLeft = Math.max(0, Math.ceil(state.levelTicksLeft * 0.7))
  const sent = state.sentThisLevel
  const target = state.levelTarget

  return (
    <div className="app">
      {!started && (
        <div className="start-screen" role="dialog" aria-label="Заставка">
          <img src={TITLE_IMAGE} alt="МетроПати" className="start-title-image" />
          <button
            type="button"
            className="start-play-btn"
            onClick={() => setStarted(true)}
            aria-label="Играть"
          >
            <img src={PLAY_BUTTON_IMAGE} alt="Играть" className="start-play-image" />
          </button>
        </div>
      )}
      <main className="scene">
        <div className="control-bar">
          <button
            className={`control-btn hud-timer hud-pause-btn ${secondsLeft <= 5 ? 'urgent' : ''} ${state.paused ? 'paused' : ''}`}
            onClick={onTogglePause}
            type="button"
            aria-label={state.paused ? 'Продолжить таймер' : 'Пауза таймера'}
            title={state.paused ? 'Продолжить таймер' : 'Пауза таймера'}
          >
            {state.paused ? '▶' : '⏸'} {secondsLeft}с
          </button>
          <button className="control-btn hud-level hud-level-btn" onClick={onOpenLevels} type="button" title="Выбор уровня" aria-label="Выбор уровня">Ур. {state.level}/{MAX_LEVEL}</button>
          <div className="control-btn hud-count">{sent}/{target}</div>
          <button className="restart control-btn hud-restart" onClick={onRestart} type="button" aria-label="Начать уровень заново" title="Начать уровень заново">↻</button>
        </div>

        <div className="station-back">
          <img
            src={STATIONS[(state.level - 1) % STATIONS.length].image}
            alt={`Станция ${STATIONS[(state.level - 1) % STATIONS.length].name}`}
            className="station-bg-img"
          />
        </div>

        <section className="platforms single">
          <PlatformLine
            train={state.platforms[0]}
            passingTrain={passingTrain}
            passingTrainKey={passingTrainKey}
            onPassingEnd={() => setPassingTrain(null)}
          />
          <div className="waiting-area">
            <img src={ESCALATOR_IMAGE} alt="" className="escalator-decor" aria-hidden="true" />
            <div className="waiting-floor" />
            <WaitingPassengers
              platformPassengers={state.platformPassengers}
              overcrowded={overcrowded}
              onFinalizeBoarding={onFinalizeBoarding}
            />
          </div>
          {canShowKick(state) && (
            <button className="kick-btn kick-btn-global" onClick={onKick} type="button" title="Дать поезду пинка — отправить" aria-label="Дать поезду пинка">
              <img src="/MetroNikitki/wagons/%D0%9F%D0%B8%D0%BD%D0%BE%D0%BA.png" alt="Пинок" className="kick-icon kick-img" />
            </button>
          )}
          {state.queueTrains.length > 0 && (
            <div className="queue floating-queue" aria-label="Следующий поезд в очереди">
              <div className="queue-trains">
                <TrainView train={state.queueTrains[0]} compact />
              </div>
            </div>
          )}
        </section>

        <section className="depot">
          <div className="depot-title">Депо — собери поезд</div>
          <div className="depot-hint">3 вагона (бонус занимает 1 место, 1 раз за уровень)</div>
          <div className="depot-build">
            <div
              key={state.launchingTrain ? 'launching' : `idle-${depotArriveKey}`}
              className={`build-train ${state.launchingTrain ? `launching ${state.launchingTrain.dir}` : depotArriveKey > 0 ? 'arriving-in' : ''}`}
            >
              <img src={HEAD_IMAGE} alt="Головной вагон" className="train-front-img" />
              {slots.map((c, i) => <WagonView key={i} color={c} ghost={!!c} />)}
            </div>
            {selection.length > 0 && !state.launchingTrain && state.levelStatus === 'playing' && (
              <button className="clear-build" onClick={onClear} type="button" aria-label="Сбросить состав" title="Сбросить состав">✕</button>
            )}
          </div>
          <div className="depot-palette rows">
            <div className="depot-row">
              {COLORS.slice(0, 4).map((c) => (
                <button
                  key={c}
                  className="depot-wagon-btn image-btn"
                  onClick={() => onPick(c)}
                  type="button"
                  aria-label={COLOR_NAME[c]}
                  title={COLOR_NAME[c]}
                  disabled={state.levelStatus !== 'playing' || !!state.launchingTrain || selection.length >= 3}
                >
                  <img src={COLOR_IMAGE[c]} alt={COLOR_NAME[c]} className="depot-wagon-img" />
                </button>
              ))}
            </div>
            <div className="depot-row">
              {COLORS.slice(4).map((c) => (
                <button
                  key={c}
                  className="depot-wagon-btn image-btn"
                  onClick={() => onPick(c)}
                  type="button"
                  aria-label={COLOR_NAME[c]}
                  title={COLOR_NAME[c]}
                  disabled={state.levelStatus !== 'playing' || !!state.launchingTrain || selection.length >= 3}
                >
                  <img src={COLOR_IMAGE[c]} alt={COLOR_NAME[c]} className="depot-wagon-img" />
                </button>
              ))}
              <button
                className={`depot-wagon-btn bonus-btn image-btn ${bonusSelected ? 'selected' : ''}`}
                onClick={() => onPick('bonus')}
                type="button"
                aria-label="Бонусный вагон"
                title="Бонусный вагон (1 раз за уровень)"
                disabled={!canPickBonus}
              >
                <img src={BONUS_IMAGE} alt="Бонусный вагон" className="depot-wagon-img" />
              </button>
            </div>
          </div>
        </section>

        {state.levelStatus !== 'playing' && (
          <div className="overlay">
            <div className="overlay-card">
              {state.levelStatus === 'won' && (
                <>
                  <Celebration />
                  <div className="overlay-title praise">{PRAISES[state.level % PRAISES.length]}!</div>
                  <div className="overlay-subtitle">Уровень {state.level} пройден</div>
                  <div className="overlay-text">{sent}/{target}</div>
                  <button className="overlay-btn" onClick={onNext} type="button">Следующий уровень</button>
                  <button className="overlay-btn secondary" onClick={onOpenLevels} type="button">Выбор уровня</button>
                </>
              )}
              {state.levelStatus === 'lost' && (
                <>
                  <div className="overlay-title">Время вышло</div>
                  <div className="overlay-text">Отправлено {sent} из {target}</div>
                  <button className="overlay-btn" onClick={onRetry} type="button">Попробовать ещё</button>
                  <button className="overlay-btn secondary" onClick={onOpenLevels} type="button">Выбор уровня</button>
                </>
              )}
              {state.levelStatus === 'complete' && (
                <>
                  <div className="overlay-title">Все уровни пройдены!</div>
                  <div className="overlay-text">Отличная работа!</div>
                  <button className="overlay-btn" onClick={() => startLevel(1)} type="button">Играть сначала</button>
                  <button className="overlay-btn secondary" onClick={onOpenLevels} type="button">Выбор уровня</button>
                </>
              )}
            </div>
          </div>
        )}

        {showLevelSelect && (
          <div className="overlay level-select-overlay" onClick={onCloseLevels}>
            <div className="overlay-card level-select-card" onClick={(e) => e.stopPropagation()}>
              <div className="overlay-title">Выбор уровня</div>
              <div className="overlay-text">Доступны открытые уровни</div>
              <div className="level-grid">
                {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((lvl) => {
                  const unlocked = lvl <= unlockedLevel
                  const current = lvl === state.level
                  return (
                    <button
                      key={lvl}
                      type="button"
                      className={`level-pick ${unlocked ? 'unlocked' : 'locked'} ${current ? 'current' : ''}`}
                      onClick={() => unlocked && startLevel(lvl)}
                      disabled={!unlocked}
                      aria-label={unlocked ? `Уровень ${lvl}` : `Уровень ${lvl} закрыт`}
                    >
                      {unlocked ? lvl : '🔒'}
                    </button>
                  )
                })}
              </div>
              <button className="overlay-btn secondary" onClick={onCloseLevels} type="button">Закрыть</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function PassingTrain({ colors, animKey, onEnd }: { colors: Color[]; animKey: number; onEnd: () => void }) {
  return (
    <div key={animKey} className="passing-train train" onAnimationEnd={onEnd}>
      <img src={HEAD_IMAGE} alt="" className="train-front-img" />
      {colors.map((c, i) => (
        <div key={i} className="wagon image-wagon">
          <img src={COLOR_IMAGE[c]} alt={COLOR_NAME[c]} className="wagon-img" />
        </div>
      ))}
    </div>
  )
}

function PlatformLine({ train, passingTrain, passingTrainKey, onPassingEnd }: { train: Train | null; passingTrain?: Color[] | null; passingTrainKey?: number; onPassingEnd?: () => void }) {
  return (
    <div className="platform-line top">
      <div className="track">
        <div className="track-header" />
        <div className="track-bed" />
        <div className="track-slot">
          {train ? <TrainView train={train} /> : <div className="empty-slot-placeholder" />}
          {!train && passingTrain && onPassingEnd && (
            <PassingTrain colors={passingTrain} animKey={passingTrainKey ?? 0} onEnd={onPassingEnd} />
          )}
        </div>
      </div>
    </div>
  )
}
