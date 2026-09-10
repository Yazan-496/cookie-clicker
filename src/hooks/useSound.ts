import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'cookie-clicker:audio'

export type SoundName = 'tap' | 'buy' | 'success' | 'error'

interface AudioPrefs {
  muted: boolean
  volume: number
}

const DEFAULTS: AudioPrefs = { muted: false, volume: 0.45 }

function loadPrefs(): AudioPrefs {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<AudioPrefs>
    return {
      muted: typeof parsed.muted === 'boolean' ? parsed.muted : DEFAULTS.muted,
      volume:
        typeof parsed.volume === 'number' && parsed.volume >= 0 && parsed.volume <= 1
          ? parsed.volume
          : DEFAULTS.volume,
    }
  } catch {
    return DEFAULTS
  }
}

/**
 * Sounds are synthesised with the Web Audio API rather than loaded as files.
 * No assets to host, nothing to download, and the tap can be pitch-varied per
 * press — the same sample fired repeatedly is what makes clicker audio grating.
 */
export function useSound() {
  const [prefs, setPrefs] = useState<AudioPrefs>(loadPrefs)
  const ctxRef = useRef<AudioContext | null>(null)
  const tapCount = useRef(0)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    } catch {
      /* storage blocked */
    }
  }, [prefs])

  // Browsers only allow audio to start inside a user gesture.
  const context = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctor) return null

    if (!ctxRef.current) ctxRef.current = new Ctor()
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume()
    return ctxRef.current
  }, [])

  const tone = useCallback(
    (
      ctx: AudioContext,
      freq: number,
      startAt: number,
      duration: number,
      type: OscillatorType,
      peak: number,
    ) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = type
      osc.frequency.setValueAtTime(freq, startAt)

      // Fast attack, exponential decay — reads as a percussive hit.
      gain.gain.setValueAtTime(0.0001, startAt)
      gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.008)
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(startAt)
      osc.stop(startAt + duration + 0.02)
    },
    [],
  )

  const play = useCallback(
    (name: SoundName) => {
      if (prefs.muted || prefs.volume <= 0) return
      const ctx = context()
      if (!ctx) return

      const now = ctx.currentTime
      const v = prefs.volume

      switch (name) {
        case 'tap': {
          // Cycle through a small set of pitches so rapid tapping stays musical.
          const steps = [0, 2, 4, 5, 7]
          const semitone = steps[tapCount.current % steps.length]
          tapCount.current += 1
          const freq = 420 * Math.pow(2, semitone / 12)
          tone(ctx, freq, now, 0.09, 'triangle', 0.16 * v)
          tone(ctx, freq * 2, now, 0.05, 'sine', 0.05 * v)
          break
        }
        case 'buy':
          tone(ctx, 523.25, now, 0.1, 'triangle', 0.16 * v)
          tone(ctx, 659.25, now + 0.07, 0.12, 'triangle', 0.16 * v)
          break
        case 'success':
          tone(ctx, 523.25, now, 0.13, 'triangle', 0.16 * v)
          tone(ctx, 659.25, now + 0.1, 0.13, 'triangle', 0.16 * v)
          tone(ctx, 783.99, now + 0.2, 0.24, 'triangle', 0.18 * v)
          break
        case 'error':
          tone(ctx, 180, now, 0.16, 'sawtooth', 0.1 * v)
          tone(ctx, 140, now + 0.11, 0.2, 'sawtooth', 0.1 * v)
          break
      }
    },
    [context, prefs.muted, prefs.volume, tone],
  )

  const setVolume = useCallback((volume: number) => {
    setPrefs((p) => ({ ...p, volume, muted: volume === 0 ? p.muted : false }))
  }, [])

  const toggleMute = useCallback(() => {
    setPrefs((p) => ({ ...p, muted: !p.muted }))
  }, [])

  return { play, volume: prefs.volume, muted: prefs.muted, setVolume, toggleMute }
}
