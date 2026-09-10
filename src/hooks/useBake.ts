import { useCallback, useEffect, useState } from 'react'
import type { PublicKey } from '@solana/web3.js'
import {
  buildBakeTransaction,
  connection,
  describeError,
  fetchBakeHistory,
} from '../lib/chain'
import type { BakeRecord } from '../lib/chain'
import { getNightlyProvider } from '../lib/nightly'

export type { BakeRecord }

export type BakeStatus =
  | 'idle'
  | 'signing'
  | 'sending'
  | 'confirming'
  | 'confirmed'
  | 'error'

const STATUS_LABEL: Record<BakeStatus, string> = {
  idle: '',
  signing: 'Approve in Nightly…',
  sending: 'Sending to Cookie Chain…',
  confirming: 'Waiting for confirmation…',
  confirmed: 'Baked on-chain!',
  error: '',
}

export function useBake(publicKey: PublicKey | null) {
  const [status, setStatus] = useState<BakeStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const [history, setHistory] = useState<BakeRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Load past bakes back off Cookie Chain whenever a wallet connects.
  // This is why history survives a refresh — it lives on-chain.
  useEffect(() => {
    if (!publicKey) {
      setHistory([])
      return
    }

    let cancelled = false
    setLoadingHistory(true)

    fetchBakeHistory(publicKey)
      .then((records) => {
        if (!cancelled) setHistory(records)
      })
      .catch((err) => {
        console.warn('[cookie-clicker] could not load on-chain history:', err)
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false)
      })

    return () => {
      cancelled = true
    }
  }, [publicKey])

  const reset = useCallback(() => {
    setStatus('idle')
    setError(null)
    setSignature(null)
  }, [])

  const bake = useCallback(
    async (score: number) => {
      const provider = getNightlyProvider()
      if (!provider || !publicKey) {
        setStatus('error')
        setError('Connect your Nightly wallet first.')
        return
      }

      setError(null)
      setSignature(null)

      try {
        const tx = buildBakeTransaction(publicKey, score)
        tx.feePayer = publicKey

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash('confirmed')
        tx.recentBlockhash = blockhash

        setStatus('signing')
        const signed = await provider.signTransaction(tx)

        setStatus('sending')
        const sig = await connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        })
        setSignature(sig)

        setStatus('confirming')
        const result = await connection.confirmTransaction(
          { signature: sig, blockhash, lastValidBlockHeight },
          'confirmed',
        )

        if (result.value.err) {
          throw new Error(
            `Transaction failed on-chain: ${JSON.stringify(result.value.err)}`,
          )
        }

        setStatus('confirmed')
        setHistory((prev) => [
          { signature: sig, score, at: Date.now() },
          ...prev.filter((r) => r.signature !== sig),
        ])
      } catch (err) {
        setStatus('error')
        setError(describeError(err))
      }
    },
    [publicKey],
  )

  return {
    bake,
    reset,
    status,
    statusLabel: STATUS_LABEL[status],
    error,
    signature,
    history,
    loadingHistory,
    busy: status === 'signing' || status === 'sending' || status === 'confirming',
  }
}
