import { useCallback, useState } from 'react'
import type { PublicKey } from '@solana/web3.js'
import { buildBakeTransaction, connection, describeError } from '../lib/chain'
import { getNightlyProvider } from '../lib/nightly'

export type BakeStatus =
  | 'idle'
  | 'signing'
  | 'sending'
  | 'confirming'
  | 'confirmed'
  | 'error'

export interface BakeRecord {
  signature: string
  score: number
  at: number
}

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
          throw new Error(`Transaction failed on-chain: ${JSON.stringify(result.value.err)}`)
        }

        setStatus('confirmed')
        setHistory((prev) => [{ signature: sig, score, at: Date.now() }, ...prev])
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
    busy: status === 'signing' || status === 'sending' || status === 'confirming',
  }
}
