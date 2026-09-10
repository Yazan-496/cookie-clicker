import { useCallback, useEffect, useState } from 'react'
import type { PublicKey } from '@solana/web3.js'
import { fetchGasBalance } from '../lib/chain'

// So the UI can mention missing gas before a transaction is attempted,
// rather than after it fails.
export function useGasBalance(publicKey: PublicKey | null) {
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!publicKey) {
      setBalance(null)
      return
    }
    setLoading(true)
    try {
      setBalance(await fetchGasBalance(publicKey))
    } catch (err) {
      console.warn('[cookie-clicker] could not read gas balance:', err)
      setBalance(null)
    } finally {
      setLoading(false)
    }
  }, [publicKey])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { balance, loading, refresh }
}
