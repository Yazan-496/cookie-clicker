import { useCallback, useRef, useState } from 'react'
import { chipLayout, type CookieTier } from '../lib/cookieTiers'

interface Props {
  onTap: () => void
  tier: CookieTier
}

interface Particle {
  id: number
  x: number
  y: number
  dx: number
  dy: number
  rotate: number
  scale: number
}

interface Ripple {
  id: number
  x: number
  y: number
}

const CRUMBS_PER_TAP = 3
const PARTICLE_MS = 620
const SQUASH_MS = 200

export function Cookie({ onTap, tier }: Props) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [squashing, setSquashing] = useState(false)
  const nextId = useRef(0)
  const squashTimer = useRef<number | null>(null)

  const chips = chipLayout(tier.chipCount)

  const handleTap = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      const batch: Particle[] = [
        { id: nextId.current++, x, y, dx: 0, dy: -54, rotate: 0, scale: 1 },
      ]
      for (let i = 0; i < CRUMBS_PER_TAP; i += 1) {
        const angle = (Math.PI * 2 * i) / CRUMBS_PER_TAP + Math.random() * 0.9
        const distance = 22 + Math.random() * 18
        batch.push({
          id: nextId.current++,
          x,
          y,
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance - 12,
          rotate: (Math.random() - 0.5) * 140,
          scale: 0.45 + Math.random() * 0.35,
        })
      }

      const ripple: Ripple = { id: nextId.current++, x, y }

      setParticles((prev) => [...prev, ...batch])
      setRipples((prev) => [...prev, ripple])

      const ids = new Set(batch.map((p) => p.id))
      window.setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !ids.has(p.id)))
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id))
      }, PARTICLE_MS)

      setSquashing(false)
      if (squashTimer.current) window.clearTimeout(squashTimer.current)
      requestAnimationFrame(() => setSquashing(true))
      squashTimer.current = window.setTimeout(() => setSquashing(false), SQUASH_MS)

      onTap()
    },
    [onTap],
  )

  const gid = `t-${tier.id}`

  return (
    <button
      className="cookie"
      onPointerDown={handleTap}
      aria-label={`Tap to bake a cookie — ${tier.name}`}
      style={{ '--tier-glow': tier.glow } as React.CSSProperties}
    >
      <span className="cookie-glow" aria-hidden="true" />

      <span
        className={`cookie-body idle-${tier.idle} ${squashing ? 'is-squashing' : ''}`}
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

          <circle cx="50" cy="50" r="47" fill={tier.rim} />
          <circle cx="50" cy="50" r="46" fill={`url(#${gid}-dough)`} />
          <ellipse cx="42" cy="34" rx="30" ry="24" fill={`url(#${gid}-sheen)`} />

          {tier.flourish === 'frosting' && (
            <path
              d="M14 42c9-9 20 6 30-2s18 6 27-3 12 4 15 1"
              fill="none"
              stroke="#fff"
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.85"
            />
          )}

          {tier.flourish === 'glaze' && (
            <path
              d="M12 54c10 8 20-8 30 0s18-10 28-2 14-4 18-1"
              fill="none"
              stroke="#ffe9a8"
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.6"
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
              <circle
                cx={chip.cx}
                cy={chip.cy}
                r={chip.r}
                fill={`url(#${gid}-chip)`}
              />
              <circle
                cx={chip.cx - chip.r * 0.3}
                cy={chip.cy - chip.r * 0.35}
                r={chip.r * 0.24}
                fill="#fff"
                opacity="0.22"
              />
            </g>
          ))}

          {tier.flourish === 'sparkle' && (
            <g className="cookie-sparkles" fill="#fffdf0">
              <path d="M28 26 29.2 22 30.4 26 34 27.2 30.4 28.4 29.2 32 28 28.4 24.4 27.2Z" />
              <path d="M70 62 71 59 72 62 75 63 72 64 71 67 70 64 67 63Z" />
              <path d="M58 22 58.9 19.5 59.8 22 62.3 22.9 59.8 23.8 58.9 26.3 58 23.8 55.5 22.9Z" />
            </g>
          )}
        </svg>
      </span>

      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ripple"
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
          {particle.dx === 0 ? '+1' : ''}
        </span>
      ))}
    </button>
  )
}
