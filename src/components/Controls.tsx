import { useState } from 'react'
import type { Theme } from '../hooks/useTheme'

interface Props {
  theme: Theme
  onCycleTheme: () => void
  muted: boolean
  volume: number
  onToggleMute: () => void
  onVolume: (value: number) => void
}

const THEME_LABEL: Record<Theme, string> = {
  system: 'System theme',
  light: 'Light theme',
  dark: 'Dark theme',
}

const icon = {
  width: 17,
  height: 17,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function Controls({
  theme,
  onCycleTheme,
  muted,
  volume,
  onToggleMute,
  onVolume,
}: Props) {
  const [open, setOpen] = useState(false)
  const silent = muted || volume === 0

  return (
    <div className="controls">
      <button
        className="icon-btn"
        onClick={onCycleTheme}
        title={THEME_LABEL[theme]}
        aria-label={THEME_LABEL[theme]}
      >
        {theme === 'light' ? (
          <svg {...icon}>
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.6v2.2M12 19.2v2.2M4.2 12H2M22 12h-2.2M6.3 6.3 4.8 4.8M19.2 19.2l-1.5-1.5M17.7 6.3l1.5-1.5M4.8 19.2l1.5-1.5" />
          </svg>
        ) : theme === 'dark' ? (
          <svg {...icon}>
            <path d="M20.5 14.3A8.5 8.5 0 1 1 9.7 3.5a6.8 6.8 0 0 0 10.8 10.8Z" />
          </svg>
        ) : (
          <svg {...icon}>
            <circle cx="12" cy="12" r="8.6" />
            <path d="M12 3.4v17.2" />
            <path d="M12 3.4a8.6 8.6 0 0 1 0 17.2Z" fill="currentColor" stroke="none" />
          </svg>
        )}
      </button>

      <div className="sound-wrap">
        <button
          className="icon-btn"
          onClick={() => setOpen((v) => !v)}
          onDoubleClick={onToggleMute}
          title={silent ? 'Sound off' : 'Sound on'}
          aria-label={silent ? 'Sound off' : 'Sound on'}
          aria-expanded={open}
        >
          {silent ? (
            <svg {...icon}>
              <path d="M4.5 9.2h3.3L12 5.6v12.8l-4.2-3.6H4.5Z" />
              <path d="m16.4 9.6 4.6 4.8M21 9.6l-4.6 4.8" />
            </svg>
          ) : (
            <svg {...icon}>
              <path d="M4.5 9.2h3.3L12 5.6v12.8l-4.2-3.6H4.5Z" />
              <path d="M15.8 9.4a3.6 3.6 0 0 1 0 5.2" />
              <path d="M18.3 7a7 7 0 0 1 0 10" />
            </svg>
          )}
        </button>

        {open && (
          <div className="sound-pop">
            <button className="sound-mute" onClick={onToggleMute}>
              {muted ? 'Unmute' : 'Mute'}
            </button>
            <input
              className="sound-range"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => onVolume(Number(e.target.value))}
              aria-label="Volume"
            />
            <span className="sound-value">
              {Math.round((muted ? 0 : volume) * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
