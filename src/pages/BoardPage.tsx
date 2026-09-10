import { Leaderboard } from '../components/Leaderboard'
import type { useLeaderboard } from '../hooks/useLeaderboard'

interface Props {
  board: ReturnType<typeof useLeaderboard>
  address: string | null
}

export function BoardPage({ board, address }: Props) {
  return (
    <section className="page">
      <div className="page-head">
        <h1 className="page-title">Leaderboard</h1>
        <span className="page-sub">read live from Cookie Chain</span>
      </div>

      <Leaderboard
        entries={board.entries}
        players={board.players}
        totalBaked={board.totalBaked}
        bakes={board.bakes}
        loading={board.loading}
        error={board.error}
        currentPlayer={address}
        onRefresh={board.refresh}
      />
    </section>
  )
}
