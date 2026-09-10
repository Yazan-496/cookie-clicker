import type { LevelProgress } from '../lib/game'
import { formatScore } from '../lib/format'

interface Props {
  progress: LevelProgress
}

export function LevelBar({ progress }: Props) {
  return (
    <div className="levelbar">
      <div className="levelbar-meta">
        <span>Level {progress.level}</span>
        <span>{formatScore(progress.remaining)} to level {progress.level + 1}</span>
      </div>
      <div
        className="levelbar-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress.fraction * 100)}
        aria-label={`Level ${progress.level} progress`}
      >
        <div
          className="levelbar-fill"
          style={{ width: `${Math.max(2, progress.fraction * 100)}%` }}
        />
      </div>
    </div>
  )
}
