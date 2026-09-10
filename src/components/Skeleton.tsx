interface Props {
  width?: string
  height?: string
  radius?: string
  className?: string
}

// Shaped like the content it replaces, so nothing shifts when data lands.
export function Skeleton({
  width = '100%',
  height = '1em',
  radius = '6px',
  className = '',
}: Props) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  )
}

/** Placeholder rows matching the leaderboard's shape. */
export function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <ul className="board-list" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <li className="board-row is-skeleton" key={index}>
          <Skeleton width="12px" height="12px" />
          <Skeleton width="26px" height="26px" radius="50%" />
          <Skeleton width={`${45 + ((index * 13) % 30)}%`} height="12px" />
          <Skeleton width="44px" height="12px" />
        </li>
      ))}
    </ul>
  )
}

/** Placeholder tiles matching the stats grid. */
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="stats" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className="stat" key={index}>
          <Skeleton width="58%" height="1.3rem" />
          <Skeleton width="72%" height="0.6rem" />
        </div>
      ))}
    </div>
  )
}
