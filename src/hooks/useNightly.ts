import { useCallback, useEffect, useState } from 'react'
import type { PublicKey } from '@solana/web3.js'
import { describeError } from '../lib/chain'
import { getNightlyProvider, isNightlyInstalled } from '../lib/nightly'

const LOG = '[cookie-clicker]'

/** Nightly may return the key on the result or leave it on the provider. */
function extractPublicKey(
  result: unknown,
  provider: { publicKey?: PublicKey | null },
): PublicKey | null {
  const fromResult = (result as { publicKey?: PublicKey } | undefined)?.publicKey
  return fromResult ?? provider.publicKey ?? null
}

export function useNightly() {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [installed, setInstalled] = useState(false)

  // The extension injects asynchronously, so poll briefly on mount. Giving up
  // is a normal outcome — the game is fully playable without a wallet.
  useEffect(() => {
    let attempts = 0
    const timer = setInterval(() => {
      attempts += 1
      if (isNightlyInstalled()) {
        setInstalled(true)
        clearInterval(timer)
      } else if (attempts > 30) {
        clearInterval(timer)
      }
    }, 100)
    return () => clearInterval(timer)
  }, [])

  // No eager reconnect: connecting a wallet is the user's decision every
  // session, and a page that silently attaches itself on load is worse than
  // one extra click.

  const connect = useCallback(async () => {
    setError(null)
    const provider = getNightlyProvider()

    if (!provider) {
      setError('Nightly was not detected. Install it, then reload this page.')
      return
    }
    if (typeof provider.connect !== 'function') {
      console.error(`${LOG} provider has no connect(). Keys:`, Object.keys(provider))
      setError('This Nightly build does not expose connect(). Please update Nightly.')
      return
    }

    setConnecting(true)
    console.log(`${LOG} calling provider.connect()…`)

    try {
      const result = await provider.connect()
      console.log(`${LOG} connect() resolved:`, result)

      const key = extractPublicKey(result, provider)
      if (!key) {
        throw new Error('Nightly connected but returned no public key.')
      }

      console.log(`${LOG} connected as ${key.toString()}`)
      setPublicKey(key)
    } catch (err) {
      console.error(`${LOG} connect() failed:`, err)
      setError(describeError(err))
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(async () => {
    const provider = getNightlyProvider()
    try {
      await provider?.disconnect?.()
    } catch {
      /* ignore — clear local state regardless */
    }
    setPublicKey(null)
  }, [])

  return { publicKey, connecting, error, installed, connect, disconnect }
}
