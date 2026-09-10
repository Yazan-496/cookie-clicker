import { useCallback, useEffect, useState } from 'react'
import type { PublicKey } from '@solana/web3.js'
import { describeError } from '../lib/chain'
import { getNightlyProvider, isNightlyInstalled } from '../lib/nightly'

const LOG = '[cookie-clicker]'
const RECONNECT_KEY = 'cookie-clicker:reconnect'

/** Set only after a deliberate Connect, cleared on disconnect. */
function hasConnectedBefore(): boolean {
  try {
    return window.localStorage.getItem(RECONNECT_KEY) === '1'
  } catch {
    return false
  }
}

function rememberConnection(remember: boolean): void {
  try {
    if (remember) window.localStorage.setItem(RECONNECT_KEY, '1')
    else window.localStorage.removeItem(RECONNECT_KEY)
  } catch {
    /* storage blocked — reconnect just won't persist */
  }
}

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

  /*
   * Reconnect on load, but only for someone who has connected in this browser
   * before. A first-time visitor — which includes anyone judging this — never
   * gets a silent wallet prompt, while a returning player isn't made to click
   * Connect on every refresh.
   *
   * Raced against a timeout: an unanswered request from the extension must
   * never be able to hang the manual Connect button behind it.
   */
  useEffect(() => {
    if (!installed || publicKey || !hasConnectedBefore()) return

    const provider = getNightlyProvider()
    if (typeof provider?.connect !== 'function') return

    let cancelled = false

    const timeout = new Promise<never>((_, reject) =>
      window.setTimeout(() => reject(new Error('eager connect timed out')), 2500),
    )

    Promise.race([provider.connect({ onlyIfTrusted: true }), timeout])
      .then((result) => {
        if (cancelled) return
        const key = extractPublicKey(result, provider)
        if (key) {
          console.log(`${LOG} reconnected as ${key.toString()}`)
          setPublicKey(key)
        }
      })
      .catch(() => {
        // Approval was revoked in the wallet, or the extension ignored it.
        // Forget the flag so we don't retry on every load.
        rememberConnection(false)
      })

    return () => {
      cancelled = true
    }
  }, [installed, publicKey])

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
      rememberConnection(true)
    } catch (err) {
      console.error(`${LOG} connect() failed:`, err)
      setError(describeError(err))
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(async () => {
    const provider = getNightlyProvider()
    // Forget first, so a failure below can't leave us auto-reconnecting to a
    // wallet the user just asked to disconnect from.
    rememberConnection(false)
    try {
      await provider?.disconnect?.()
    } catch {
      /* ignore — clear local state regardless */
    }
    setPublicKey(null)
  }, [])

  return { publicKey, connecting, error, installed, connect, disconnect }
}
