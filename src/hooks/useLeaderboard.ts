import { useCallback, useEffect, useState } from 'react'
import { fetchLeaderboard, type LeaderboardStats } from '../lib/chain'

const EMPTY: LeaderboardStats = {
  entries: [],
  players: 0,
  totalBaked: 0,
  bakes: 0,
}

export function useLeaderboard() {
  const [stats, setStats] = useState<LeaderboardStats>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setStats(await fetchLeaderboard())
    } catch (err) {
      console.warn('[cookie-clicker] leaderboard failed:', err)
      setError('Could not reach Cookie Chain to load the leaderboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { ...stats, loading, error, refresh }
}
