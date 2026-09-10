import { explorerTxUrl, shortAddress, type LeaderboardEntry } from '../lib/chain'
import { formatScore } from '../lib/format'

interface Props {
  entries: LeaderboardEntry[]
  players: number
  totalBaked: number
  bakes: number
  loading: boolean
  error: string | null
  currentPlayer: string | null
  onRefresh: () => void
}

/** Deterministic hue per wallet, so each player keeps a recognisable colour. */
function hueFor(address: string): number {
  let hash = 0
  for (let i = 0; i < address.length; i += 1) {
    hash = (hash * 31 + address.charCodeAt(i)) % 360
  }
  return hash
}

export function Leaderboard({
  entries,
  players,
  totalBaked,
  bakes,
  loading,
  error,
  currentPlayer,
  onRefresh,
}: Props) {
  const top = entries.slice(0, 15)
  const best = top[0]?.score ?? 1
  const rank = currentPlayer
    ? entries.findIndex((entry) => entry.player === currentPlayer)
    : -1

  return (
    <div className="board">
      <div className="stats">
        <div className="stat">
          <span className="stat-value">{formatScore(players)}</span>
          <span className="stat-label">bakers</span>
        </div>
        <div className="stat">
          <span className="stat-value">{formatScore(totalBaked)}</span>
          <span className="stat-label">cookies on-chain</span>
        </div>
        <div className="stat">
          <span className="stat-value">{formatScore(bakes)}</span>
          <span className="stat-label">bakes</span>
        </div>
        <div className="stat stat-you">
          <span className="stat-value">{rank >= 0 ? `#${rank + 1}` : '—'}</span>
          <span className="stat-label">your rank</span>
        </div>
      </div>

      <div className="board-head">
        <span className="board-caption">
          {loading ? 'Reading Cookie Chain…' : `Top ${top.length || 0}`}
        </span>
        <button
          className="board-refresh"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh leaderboard"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
            className={loading ? 'is-spinning' : ''}
          >
            <path d="M21 12a9 9 0 1 1-2.6-6.4" />
            <path d="M21 3v6h-6" />
          </svg>
        </button>
      </div>

      {error && <p className="hint hint-error">{error}</p>}

      {!error && top.length === 0 && !loading && (
        <div className="empty">
          <span className="empty-icon" aria-hidden="true">
            🏆
          </span>
          <p className="empty-title">Nobody has baked yet</p>
          <p className="empty-body">
            The first score written to Cookie Chain takes the top spot. It could
            be yours.
          </p>
        </div>
      )}

      {top.length > 0 && (
        <ol className="board-list">
          {top.map((entry, index) => {
            const isYou = entry.player === currentPlayer
            const pct = Math.max(6, (entry.score / best) * 100)

            return (
              <li
                key={entry.player}
                className={`board-row rank-${index + 1} ${isYou ? 'is-you' : ''}`}
                style={
                  {
                    '--pct': `${pct}%`,
                    '--hue': hueFor(entry.player),
                  } as React.CSSProperties
                }
              >
                <span className="board-rank">{index + 1}</span>

                <span className="board-avatar" aria-hidden="true" />

                <span className="board-who">
                  {isYou ? 'You' : shortAddress(entry.player, 4)}
                </span>

                <a
                  className="board-score"
                  href={explorerTxUrl(entry.signature)}
                  target="_blank"
                  rel="noreferrer"
                  title="View this bake on Cookiescan"
                >
                  {formatScore(entry.score)}
                </a>
              </li>
            )
          })}
        </ol>
      )}

      {rank >= top.length && rank >= 0 && (
        <p className="board-yours">
          You're #{rank + 1} of {players}. Bake a bigger score to climb.
        </p>
      )}
    </div>
  )
}
