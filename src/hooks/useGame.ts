import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { purgeLegacyKeys, secureGet, secureSet } from '../lib/secureStorage'
import {
  cpsOf,
  costOf,
  levelProgress,
  tapValueOf,
  UPGRADES,
  type Owned,
} from '../lib/game'

const STORAGE_NAME = 'progress'
const LEGACY_KEYS = ['cookie-clicker:progress', 'cookie-clicker:score']

/** No human taps faster than this — used to bound a tampered save. */
const MAX_TAPS_PER_SECOND = 25
/** Slack so honest saves are never clipped by clock drift or a slow tab. */
const CLAMP_SLACK = 1.5
const TICK_MS = 100

interface GameState {
  /** Spendable cookies. */
  score: number
  /** Lifetime cookies, drives level. Never decreases. */
  totalBaked: number
  since: number
  owned: Owned
}

function freshState(): GameState {
  return { score: 0, totalBaked: 0, since: Date.now(), owned: {} }
}

function sanitiseOwned(raw: unknown): Owned {
  const owned: Owned = {}
  if (!raw || typeof raw !== 'object') return owned
  for (const def of UPGRADES) {
    const count = (raw as Owned)[def.id]
    if (typeof count === 'number' && Number.isFinite(count) && count > 0) {
      owned[def.id] = Math.floor(count)
    }
  }
  return owned
}

/**
 * Bounds a loaded save by what the elapsed time could physically have produced:
 * tapping flat out, plus whatever the owned upgrades generate passively.
 */
function clamp(state: GameState): GameState {
  const elapsedSeconds = Math.max(1, (Date.now() - state.since) / 1000)
  const perSecond =
    MAX_TAPS_PER_SECOND * tapValueOf(state.owned) + cpsOf(state.owned)
  const ceiling = Math.floor(elapsedSeconds * perSecond * CLAMP_SLACK)

  const totalBaked = Math.min(Math.floor(state.totalBaked), ceiling)
  const score = Math.min(Math.floor(state.score), totalBaked)

  if (totalBaked !== Math.floor(state.totalBaked)) {
    console.warn(
      `[cookie-clicker] save claims ${state.totalBaked} lifetime cookies but ` +
        `only ${ceiling} were possible in the elapsed time — clamped.`,
    )
  }

  return { ...state, score, totalBaked }
}

function isValid(value: unknown): value is GameState {
  const s = value as Partial<GameState> | null
  return (
    !!s &&
    typeof s.score === 'number' &&
    typeof s.totalBaked === 'number' &&
    typeof s.since === 'number' &&
    Number.isFinite(s.score) &&
    Number.isFinite(s.totalBaked) &&
    Number.isFinite(s.since) &&
    s.since <= Date.now()
  )
}

export function useGame() {
  const [state, setState] = useState<GameState>(freshState)
  const loaded = useRef(false)

  useEffect(() => {
    let cancelled = false
    purgeLegacyKeys(LEGACY_KEYS)

    secureGet<GameState>(STORAGE_NAME)
      .then((stored) => {
        if (cancelled) return
        if (isValid(stored)) {
          setState(clamp({ ...stored, owned: sanitiseOwned(stored.owned) }))
        } else if (stored !== null) {
          console.warn('[cookie-clicker] stored progress was invalid — reset.')
        }
      })
      .catch(() => {
        /* unreadable storage — start fresh */
      })
      .finally(() => {
        if (!cancelled) loaded.current = true
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!loaded.current) return
    void secureSet(STORAGE_NAME, state)
  }, [state])

  const cps = useMemo(() => cpsOf(state.owned), [state.owned])
  const tapValue = useMemo(() => tapValueOf(state.owned), [state.owned])

  // Passive production. Ticks ten times a second so the counter moves smoothly
  // rather than jumping once per second.
  useEffect(() => {
    if (cps <= 0) return
    const id = window.setInterval(() => {
      const gain = (cps * TICK_MS) / 1000
      setState((s) => ({
        ...s,
        score: s.score + gain,
        totalBaked: s.totalBaked + gain,
      }))
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [cps])

  const tap = useCallback(() => {
    setState((s) => {
      const gain = tapValueOf(s.owned)
      return { ...s, score: s.score + gain, totalBaked: s.totalBaked + gain }
    })
  }, [])

  const buy = useCallback((id: string) => {
    setState((s) => {
      const def = UPGRADES.find((u) => u.id === id)
      if (!def) return s
      const price = costOf(def, s.owned[id] ?? 0)
      if (s.score < price) return s
      return {
        ...s,
        score: s.score - price,
        owned: { ...s.owned, [id]: (s.owned[id] ?? 0) + 1 },
      }
    })
  }, [])

  const prices = useMemo(
    () =>
      Object.fromEntries(
        UPGRADES.map((def) => [def.id, costOf(def, state.owned[def.id] ?? 0)]),
      ) as Record<string, number>,
    [state.owned],
  )

  return {
    score: Math.floor(state.score),
    totalBaked: Math.floor(state.totalBaked),
    owned: state.owned,
    prices,
    cps,
    tapValue,
    progress: levelProgress(state.totalBaked),
    tap,
    buy,
  }
}
