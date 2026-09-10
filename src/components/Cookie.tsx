import { useCallback, useRef, useState } from 'react'

interface Props {
  onTap: () => void
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

const CHIPS = [
  { cx: 33, cy: 31, r: 6.5 },
  { cx: 64, cy: 28, r: 5 },
  { cx: 71, cy: 57, r: 6 },
  { cx: 42, cy: 63, r: 7 },
  { cx: 26, cy: 54, r: 4.5 },
  { cx: 55, cy: 44, r: 4 },
  { cx: 52, cy: 78, r: 4.5 },
  { cx: 78, cy: 40, r: 3.5 },
]

const SPECKLES = [
  { cx: 46, cy: 22, r: 1.4 },
  { cx: 60, cy: 68, r: 1.6 },
  { cx: 30, cy: 44, r: 1.2 },
  { cx: 68, cy: 47, r: 1.3 },
  { cx: 38, cy: 74, r: 1.5 },
  { cx: 22, cy: 66, r: 1.1 },
]

const CRUMBS_PER_TAP = 4
const PARTICLE_MS = 750
const SQUASH_MS = 280

export function Cookie({ onTap }: Props) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [squashing, setSquashing] = useState(false)
  const nextId = useRef(0)
  const squashTimer = useRef<number | null>(null)

  const handleTap = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // One "+1" that floats straight up, plus crumbs scattering outward.
      const batch: Particle[] = [
        { id: nextId.current++, x, y, dx: 0, dy: -78, rotate: 0, scale: 1 },
      ]
      for (let i = 0; i < CRUMBS_PER_TAP; i += 1) {
        const angle = (Math.PI * 2 * i) / CRUMBS_PER_TAP + Math.random() * 0.9
        const distance = 34 + Math.random() * 30
        batch.push({
          id: nextId.current++,
          x,
          y,
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance - 18,
          rotate: (Math.random() - 0.5) * 320,
          scale: 0.5 + Math.random() * 0.5,
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

      // Restart the squash animation cleanly on every tap.
      setSquashing(false)
      if (squashTimer.current) window.clearTimeout(squashTimer.current)
      requestAnimationFrame(() => setSquashing(true))
      squashTimer.current = window.setTimeout(() => setSquashing(false), SQUASH_MS)

      onTap()
    },
    [onTap],
  )

  return (
    <button
      className="cookie"
      onPointerDown={handleTap}
      aria-label="Tap to bake a cookie"
    >
      <span className="cookie-glow" aria-hidden="true" />

      <span
        className={`cookie-body ${squashing ? 'is-squashing' : ''}`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 100 100" className="cookie-art">
          <defs>
            <radialGradient id="dough" cx="34%" cy="28%" r="78%">
              <stop offset="0%" stopColor="#f0be82" />
              <stop offset="55%" stopColor="#d59a55" />
              <stop offset="100%" stopColor="#a96c31" />
            </radialGradient>
            <radialGradient id="chipFill" cx="34%" cy="28%" r="80%">
              <stop offset="0%" stopColor="#7a4e28" />
              <stop offset="100%" stopColor="#331d0d" />
            </radialGradient>
            <linearGradient id="sheen" x1="0" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.34" />
              <stop offset="70%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>

          <circle cx="50" cy="50" r="47" fill="#7d4d20" opacity="0.55" />
          <circle cx="50" cy="50" r="46" fill="url(#dough)" />
          <ellipse cx="42" cy="34" rx="30" ry="24" fill="url(#sheen)" />

          {SPECKLES.map((s) => (
            <circle
              key={`s-${s.cx}-${s.cy}`}
              cx={s.cx}
              cy={s.cy}
              r={s.r}
              fill="#a4682f"
              opacity="0.5"
            />
          ))}

          {CHIPS.map((chip) => (
            <g key={`c-${chip.cx}-${chip.cy}`}>
              <circle
                cx={chip.cx}
                cy={chip.cy + 0.8}
                r={chip.r}
                fill="#8a5a2b"
                opacity="0.45"
              />
              <circle cx={chip.cx} cy={chip.cy} r={chip.r} fill="url(#chipFill)" />
              <circle
                cx={chip.cx - chip.r * 0.3}
                cy={chip.cy - chip.r * 0.35}
                r={chip.r * 0.24}
                fill="#fff"
                opacity="0.22"
              />
            </g>
          ))}
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

      {particles.map((particle, index) => (
        <span
          key={particle.id}
          className={index === 0 || particle.dx === 0 ? 'pop' : 'crumb'}
          style={
            {
              left: particle.x,
              top: particle.y,
              '--dx': `${particle.dx}px`,
              '--dy': `${particle.dy}px`,
              '--rot': `${particle.rotate}deg`,
              '--scale': particle.scale,
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
