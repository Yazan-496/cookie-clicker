import { useCallback, useEffect, useState } from 'react'
import type { PublicKey } from '@solana/web3.js'
import { describeError } from '../lib/chain'
import { getNightlyProvider, isNightlyInstalled } from '../lib/nightly'

export function useNightly() {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [installed, setInstalled] = useState(false)

  // The extension injects asynchronously, so poll briefly on mount.
  useEffect(() => {
    let attempts = 0
    const timer = setInterval(() => {
      attempts += 1
      if (isNightlyInstalled()) {
        setInstalled(true)
        clearInterval(timer)
      } else if (attempts > 20) {
        clearInterval(timer)
      }
    }, 100)
    return () => clearInterval(timer)
  }, [])

  // Reconnect silently if the user already trusted this site.
  useEffect(() => {
    if (!installed) return
    const provider = getNightlyProvider()
    if (!provider) return
    provider
      .connect({ onlyIfTrusted: true })
      .then((res) => setPublicKey(res.publicKey))
      .catch(() => {
        /* not previously trusted — user must click Connect */
      })
  }, [installed])

  const connect = useCallback(async () => {
    setError(null)
    const provider = getNightlyProvider()
    if (!provider) {
      setError('Nightly was not detected. Install it, then reload this page.')
      return
    }
    setConnecting(true)
    try {
      const res = await provider.connect()
      setPublicKey(res.publicKey)
    } catch (err) {
      setError(describeError(err))
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(async () => {
    const provider = getNightlyProvider()
    try {
      await provider?.disconnect()
    } catch {
      /* ignore — clear local state regardless */
    }
    setPublicKey(null)
  }, [])

  return { publicKey, connecting, error, installed, connect, disconnect }
}
