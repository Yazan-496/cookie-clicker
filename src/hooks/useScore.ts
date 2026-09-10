import { useCallback, useEffect, useRef, useState } from 'react'
import { purgeLegacyKeys, secureGet, secureSet } from '../lib/secureStorage'

const STORAGE_NAME = 'progress'

/** Plaintext keys written before storage was encrypted. */
const LEGACY_KEYS = ['cookie-clicker:progress', 'cookie-clicker:score']

/**
 * No human taps faster than this. Any stored score above what the elapsed
 * time physically allows was tampered with, so it gets clamped back down.
 */
const MAX_TAPS_PER_SECOND = 25

interface Progress {
  score: number
  since: number
}

function ceilingFor(since: number): number {
  const elapsedSeconds = Math.max(1, (Date.now() - since) / 1000)
  return Math.floor(elapsedSeconds * MAX_TAPS_PER_SECOND)
}

function clamp(progress: Progress): Progress {
  const ceiling = ceilingFor(progress.since)
  const score = Math.max(0, Math.min(Math.floor(progress.score), ceiling))
  if (score !== progress.score) {
    console.warn(
      `[cookie-clicker] stored score ${progress.score} exceeds the ${ceiling} ` +
        'possible in the elapsed time — clamped.',
    )
  }
  return { score, since: progress.since }
}

function isValid(value: unknown): value is Progress {
  const p = value as Partial<Progress> | null
  return (
    !!p &&
    typeof p.score === 'number' &&
    typeof p.since === 'number' &&
    Number.isFinite(p.score) &&
    Number.isFinite(p.since) &&
    p.since <= Date.now()
  )
}

/**
 * The local tap counter, persisted in encrypted, tamper-evident storage.
 *
 * This is a client-side buffer only — never authoritative. The authoritative
 * score is whatever has been written to Cookie Chain, which costs gas and is
 * publicly auditable.
 */
export function useScore() {
  const [progress, setProgress] = useState<Progress>({ score: 0, since: Date.now() })
  const loaded = useRef(false)

  // Load once on mount. Until this completes we must not write, or we would
  // overwrite the stored value with the empty default.
  useEffect(() => {
    let cancelled = false

    purgeLegacyKeys(LEGACY_KEYS)

    secureGet<Progress>(STORAGE_NAME)
      .then((stored) => {
        if (cancelled) return
        if (isValid(stored)) {
          setProgress(clamp(stored))
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
    void secureSet(STORAGE_NAME, progress)
  }, [progress])

  // Re-clamp when the tab regains focus, in case storage was edited meanwhile.
  useEffect(() => {
    const recheck = () => setProgress((p) => clamp(p))
    window.addEventListener('focus', recheck)
    return () => window.removeEventListener('focus', recheck)
  }, [])

  const tap = useCallback(() => {
    setProgress((p) => ({
      ...p,
      score: Math.min(p.score + 1, ceilingFor(p.since)),
    }))
  }, [])

  const clear = useCallback(() => {
    setProgress({ score: 0, since: Date.now() })
  }, [])

  return { score: progress.score, tap, clear }
}
