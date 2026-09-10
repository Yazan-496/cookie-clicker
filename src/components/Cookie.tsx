import { useCallback, useRef, useState } from 'react'

interface Props {
  onTap: () => void
}

interface Crumb {
  id: number
  x: number
  y: number
}

export function Cookie({ onTap }: Props) {
  const [crumbs, setCrumbs] = useState<Crumb[]>([])
  const [pressed, setPressed] = useState(false)
  const nextId = useRef(0)

  const handleTap = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const crumb: Crumb = {
        id: nextId.current++,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
      setCrumbs((prev) => [...prev, crumb])
      setTimeout(() => {
        setCrumbs((prev) => prev.filter((c) => c.id !== crumb.id))
      }, 700)

      setPressed(true)
      setTimeout(() => setPressed(false), 90)

      onTap()
    },
    [onTap],
  )

  return (
    <button
      className={`cookie ${pressed ? 'cookie-pressed' : ''}`}
      onPointerDown={handleTap}
      aria-label="Tap to bake a cookie"
    >
      <svg viewBox="0 0 100 100" className="cookie-art" aria-hidden="true">
        <circle cx="50" cy="50" r="46" fill="#c98a4b" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#a86d36" strokeWidth="3" />
        <circle cx="34" cy="33" r="6.5" fill="#5c3317" />
        <circle cx="64" cy="30" r="5" fill="#5c3317" />
        <circle cx="70" cy="58" r="6" fill="#5c3317" />
        <circle cx="43" cy="62" r="7" fill="#5c3317" />
        <circle cx="27" cy="55" r="4.5" fill="#5c3317" />
        <circle cx="55" cy="45" r="4" fill="#5c3317" />
        <circle cx="52" cy="76" r="4.5" fill="#5c3317" />
      </svg>

      {crumbs.map((crumb) => (
        <span
          key={crumb.id}
          className="crumb"
          style={{ left: crumb.x, top: crumb.y }}
        >
          +1
        </span>
      ))}
    </button>
  )
}
