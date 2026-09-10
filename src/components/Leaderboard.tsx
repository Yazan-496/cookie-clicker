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

const MEDALS = ['🥇', '🥈', '🥉']

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
  const top = entries.slice(0, 10)
  const best = top[0]?.score ?? 1
  const rank = currentPlayer
    ? entries.findIndex((entry) => entry.player === currentPlayer)
    : -1

  return (
    <section className="board">
      <div className="board-head">
        <h2 className="board-title">Global leaderboard</h2>
        <button
          className="board-refresh"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh leaderboard"
        >
          {loading ? '…' : '↻'}
        </button>
      </div>

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
        <div className="stat">
          <span className="stat-value">{rank >= 0 ? `#${rank + 1}` : '—'}</span>
          <span className="stat-label">your rank</span>
        </div>
      </div>

      {error && <p className="hint hint-error">{error}</p>}

      {!error && top.length === 0 && (
        <p className="hint">
          {loading
            ? 'Reading Cookie Chain…'
            : 'No bakes on-chain yet. Be the first.'}
        </p>
      )}

      {top.length > 0 && (
        <ol className="board-list">
          {top.map((entry, index) => {
            const isYou = entry.player === currentPlayer
            return (
              <li
                key={entry.player}
                className={`board-row ${isYou ? 'is-you' : ''}`}
              >
                <span className="board-rank">
                  {MEDALS[index] ?? `${index + 1}`}
                </span>

                <span className="board-bar-wrap">
                  <span className="board-who">
                    {isYou ? 'You' : shortAddress(entry.player, 4)}
                  </span>
                  <span className="board-track">
                    <span
                      className="board-fill"
                      style={{ width: `${Math.max(4, (entry.score / best) * 100)}%` }}
                    />
                  </span>
                </span>

                <a
                  className="board-score"
                  href={explorerTxUrl(entry.signature)}
                  target="_blank"
                  rel="noreferrer"
                  title="View the bake on Cookiescan"
                >
                  {formatScore(entry.score)}
                </a>
              </li>
            )
          })}
        </ol>
      )}

      <p className="board-note">
        Ranked by the transaction signer read from Cookie Chain — a memo can
        claim any score, but only the wallet that signed and paid for it gets
        the credit.
      </p>
    </section>
  )
}
