import { useCallback, useRef, useState } from 'react'
import {
  chipLayout,
  cookiePath,
  CRACK_PATHS,
  type CookieTier,
} from '../lib/cookieTiers'
import { RING_COUNT, RING_NOTES } from '../hooks/useSound'

interface Props {
  onTap: (ring: number) => void
  tier: CookieTier
  tapValue: number
  /** Set briefly when a new tier is reached, for the unlock burst. */
  celebrating?: boolean
}

interface Particle {
  id: number
  x: number
  y: number
  dx: number
  dy: number
  rotate: number
  scale: number
  ring: number
}

interface Ripple {
  id: number
  x: number
  y: number
  ring: number
}

const CRUMBS_PER_TAP = 3
const PARTICLE_MS = 700
const HIT_MS = 320

/** Ring boundaries as a fraction of the cookie radius, centre outwards. */
const RING_EDGES = [0.22, 0.42, 0.62, 0.82, 1]

function ringAt(dx: number, dy: number, radius: number): number {
  const fraction = Math.min(1, Math.hypot(dx, dy) / radius)
  for (let i = 0; i < RING_EDGES.length; i += 1) {
    if (fraction <= RING_EDGES[i]) return i
  }
  return RING_COUNT - 1
}

export function Cookie({ onTap, tier, tapValue, celebrating }: Props) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [hitRing, setHitRing] = useState<number | null>(null)
  const [push, setPush] = useState({ x: 0, y: 0, tilt: 0 })
  const nextId = useRef(0)
  const hitTimer = useRef<number | null>(null)

  const chips = chipLayout(tier.chipCount)

  const handleTap = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      const radius = rect.width / 2
      const offsetX = x - radius
      const offsetY = y - radius
      const ring = ringAt(offsetX, offsetY, radius)

      // Where you press decides how it moves: the cookie dips away from the
      // finger and rolls toward that side, so the left edge and the right edge
      // feel like different places to hit rather than one uniform button.
      const nx = Math.max(-1, Math.min(1, offsetX / radius))
      const ny = Math.max(-1, Math.min(1, offsetY / radius))
      const strength = 0.45 + ring * 0.16
      setPush({
        x: nx * 7 * strength,
        y: ny * 7 * strength,
        tilt: nx * 7 * strength,
      })

      // Outer rings fling crumbs further; the centre press is more contained.
      const spread = 16 + ring * 9

      const batch: Particle[] = [
        { id: nextId.current++, x, y, dx: 0, dy: -54, rotate: 0, scale: 1, ring },
      ]
      for (let i = 0; i < CRUMBS_PER_TAP; i += 1) {
        const angle = (Math.PI * 2 * i) / CRUMBS_PER_TAP + Math.random() * 0.9
        const distance = spread + Math.random() * 18
        batch.push({
          id: nextId.current++,
          x,
          y,
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance - 12,
          rotate: (Math.random() - 0.5) * 140,
          scale: 0.45 + Math.random() * 0.35,
          ring,
        })
      }

      const ripple: Ripple = { id: nextId.current++, x, y, ring }

      setParticles((prev) => [...prev, ...batch])
      setRipples((prev) => [...prev, ripple])

      const ids = new Set(batch.map((p) => p.id))
      window.setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !ids.has(p.id)))
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id))
      }, PARTICLE_MS)

      setHitRing(null)
      if (hitTimer.current) window.clearTimeout(hitTimer.current)
      requestAnimationFrame(() => setHitRing(ring))
      hitTimer.current = window.setTimeout(() => setHitRing(null), HIT_MS)

      onTap(ring)
    },
    [onTap],
  )

  const gid = `t-${tier.id}`

  return (
    <button
      className="cookie"
      onPointerDown={handleTap}
      aria-label={`Tap to bake — five rings play do, re, mi, fa, sol from the centre out`}
      style={{ '--tier-glow': tier.glow } as React.CSSProperties}
    >
      <span className="cookie-glow" aria-hidden="true" />

      <span
        className={`cookie-body idle-${tier.idle} ${
          hitRing !== null ? `hit hit-${hitRing}` : ''
        }`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 100 100" className="cookie-art">
          <defs>
            <radialGradient id={`${gid}-dough`} cx="34%" cy="28%" r="78%">
              <stop offset="0%" stopColor={tier.dough[0]} />
              <stop offset="55%" stopColor={tier.dough[1]} />
              <stop offset="100%" stopColor={tier.dough[2]} />
            </radialGradient>
            <radialGradient id={`${gid}-chip`} cx="34%" cy="28%" r="80%">
              <stop offset="0%" stopColor={tier.chip[0]} />
              <stop offset="100%" stopColor={tier.chip[1]} />
            </radialGradient>
            <linearGradient id={`${gid}-sheen`} x1="0" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.32" />
              <stop offset="70%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path d={cookiePath(tier.shape, 47)} fill={tier.rim} />
          <path d={cookiePath(tier.shape, 46)} fill={`url(#${gid}-dough)`} />
          <ellipse cx="42" cy="34" rx="29" ry="23" fill={`url(#${gid}-sheen)`} />

          {tier.detail === 'cracks' &&
            CRACK_PATHS.map((d) => (
              <path
                key={d}
                d={d}
                fill="none"
                stroke={tier.rim}
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.4"
              />
            ))}

          {tier.detail === 'drizzle' && (
            <path
              d="M16 50c9 7 17-6 26 0s16-8 25-2 11-3 15 0"
              fill="none"
              stroke={tier.rim}
              strokeWidth="3.4"
              strokeLinecap="round"
              opacity="0.42"
            />
          )}

          {chips.map((chip, index) => (
            <g key={index}>
              <circle
                cx={chip.cx}
                cy={chip.cy + 0.8}
                r={chip.r}
                fill={tier.rim}
                opacity="0.45"
              />
              <circle cx={chip.cx} cy={chip.cy} r={chip.r} fill={`url(#${gid}-chip)`} />
              <circle
                cx={chip.cx - chip.r * 0.3}
                cy={chip.cy - chip.r * 0.35}
                r={chip.r * 0.24}
                fill="#fff"
                opacity="0.22"
              />
            </g>
          ))}

          {/* Ring guides — faint until struck, so the cookie reads as playable */}
          {RING_EDGES.map((edge, index) => (
            <circle
              key={edge}
              className={`ring-guide ${hitRing === index ? 'is-hit' : ''}`}
              cx="50"
              cy="50"
              r={edge * 46}
              fill="none"
              stroke="#fff"
            />
          ))}

          {tier.detail === 'flecks' && (
            <g className="cookie-sparkles" fill={tier.chip[0]}>
              <path d="M28 26 29.2 22 30.4 26 34 27.2 30.4 28.4 29.2 32 28 28.4 24.4 27.2Z" />
              <path d="M70 62 71 59 72 62 75 63 72 64 71 67 70 64 67 63Z" />
              <path d="M58 22 58.9 19.5 59.8 22 62.3 22.9 59.8 23.8 58.9 26.3 58 23.8 55.5 22.9Z" />
              <path d="M38 76 38.9 73.5 39.8 76 42.3 76.9 39.8 77.8 38.9 80.3 38 77.8 35.5 76.9Z" />
            </g>
          )}
        </svg>
      </span>

      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className={`ripple ripple-${ripple.ring}`}
          style={{ left: ripple.x, top: ripple.y }}
          aria-hidden="true"
        />
      ))}

      {particles.map((particle) => (
        <span
          key={particle.id}
          className={particle.dx === 0 ? 'pop' : 'crumb'}
          style={
            {
              left: particle.x,
              top: particle.y,
              '--dx': `${particle.dx}px`,
              '--dy': `${particle.dy}px`,
              '--rot': `${particle.rotate}deg`,
              '--scale': particle.scale,
              '--crumb-a': tier.chip[0],
              '--crumb-b': tier.chip[1],
            } as React.CSSProperties
          }
          aria-hidden="true"
        >
          {particle.dx === 0 && (
            <>
              +{tapValue.toLocaleString()}
              <span className="pop-note">{RING_NOTES[particle.ring].name}</span>
            </>
          )}
        </span>
      ))}
    </button>
  )
}
