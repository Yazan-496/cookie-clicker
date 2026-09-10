import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'

/**
 * Cookie Chain community RPC — from https://docs.cookiechain.wtf
 *
 * Overridable so the transaction path can be exercised against Solana devnet,
 * where SOL is free. Cookie Chain is SVM-compatible, so the same code, the same
 * Memo program and the same RPC methods apply to both. The default is always
 * Cookie Chain — a plain `npm run build` can never produce a devnet build.
 */
export const COOKIE_CHAIN_RPC =
  import.meta.env.VITE_RPC_URL ?? 'https://rpc.cookiescan.io'

/** Block explorer used for transaction links. */
export const EXPLORER_URL =
  import.meta.env.VITE_EXPLORER_URL ?? 'https://cookiescan.io'

/** Appended to explorer links (Solana explorer needs ?cluster=devnet). */
export const EXPLORER_SUFFIX = import.meta.env.VITE_EXPLORER_SUFFIX ?? ''

export const NETWORK_NAME = import.meta.env.VITE_NETWORK_NAME ?? 'Cookie Chain'

/** False when pointed anywhere other than Cookie Chain. */
export const IS_COOKIE_CHAIN = !import.meta.env.VITE_RPC_URL

/**
 * SPL Memo program. Cookie Chain is SVM-compatible, so standard SPL programs
 * are expected to work. If a bake transaction fails with "program not found",
 * flip USE_MEMO to false to use the self-transfer fallback below.
 */
export const MEMO_PROGRAM_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
)

export const USE_MEMO = true

export const connection = new Connection(COOKIE_CHAIN_RPC, 'confirmed')

export function explorerTxUrl(signature: string): string {
  return `${EXPLORER_URL}/tx/${signature}${EXPLORER_SUFFIX}`
}

export function shortAddress(address: string, size = 4): string {
  if (address.length <= size * 2 + 1) return address
  return `${address.slice(0, size)}…${address.slice(-size)}`
}

/**
 * Writes the player's score on-chain as a memo. This is the "meaningful
 * interaction with Cookie Chain" the bounty asks for — the score becomes a
 * permanent, publicly verifiable record on the explorer.
 */
export function buildBakeTransaction(
  player: PublicKey,
  score: number,
): Transaction {
  const tx = new Transaction()

  if (USE_MEMO) {
    const payload = `cookie-clicker|score:${score}|ts:${Date.now()}`
    tx.add(
      new TransactionInstruction({
        keys: [{ pubkey: player, isSigner: true, isWritable: false }],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(payload, 'utf8'),
      }),
    )
  } else {
    // Fallback: a zero-value self transfer still produces a real, confirmable
    // on-chain transaction if the Memo program is unavailable.
    tx.add(
      SystemProgram.transfer({
        fromPubkey: player,
        toPubkey: player,
        lamports: 0,
      }),
    )
  }

  return tx
}

/** Native token of Cookie Chain, used for fees. */
export const GAS_TOKEN = 'COOK'
const DECIMALS = 1_000_000_000

/**
 * Reads the player's COOK balance. Fees run about 0.000005 COOK per signature,
 * so any non-zero balance is plenty — but zero means a bake would fail, and it
 * is better to say so before asking the wallet to sign.
 */
export async function fetchGasBalance(player: PublicKey): Promise<number> {
  const lamports = await connection.getBalance(player, 'confirmed')
  return lamports / DECIMALS
}

export interface BakeRecord {
  signature: string
  score: number
  at: number
}

/** Pulls the score back out of a memo written by buildBakeTransaction. */
export function parseScoreFromMemo(memo: string | null | undefined): number | null {
  if (!memo) return null
  const match = memo.match(/cookie-clicker\|score:(\d+)/)
  return match ? Number(match[1]) : null
}

/**
 * Reads this player's past bakes back off Cookie Chain.
 *
 * getSignaturesForAddress returns the memo alongside each signature, so the
 * full history comes back in a single RPC call — no per-transaction fetches.
 * This is what makes bakes survive a refresh: the history lives on-chain,
 * not in browser state.
 */
export async function fetchBakeHistory(
  player: PublicKey,
  limit = 20,
): Promise<BakeRecord[]> {
  const signatures = await connection.getSignaturesForAddress(player, { limit })

  return signatures.flatMap((info) => {
    const score = parseScoreFromMemo(info.memo)
    if (score === null || info.err) return []
    return [
      {
        signature: info.signature,
        score,
        at: (info.blockTime ?? 0) * 1000,
      },
    ]
  })
}

/** Human-readable messages for the failures players actually hit. */
export function describeError(err: unknown): string {
  const raw =
    err instanceof Error ? err.message : typeof err === 'string' ? err : ''

  if (/User rejected|rejected the request|declined/i.test(raw)) {
    return 'You cancelled the transaction in Nightly.'
  }
  if (/insufficient|0x1\b/i.test(raw)) {
    return 'Not enough COOK for gas. Ask for a top-up in the Cookie Chain Telegram.'
  }
  if (/blockhash|expired/i.test(raw)) {
    return 'The transaction expired before confirming. Try baking again.'
  }
  if (/failed to fetch|network|timeout/i.test(raw)) {
    return 'Could not reach the Cookie Chain RPC. Check your connection.'
  }
  if (/program.*not found|invalid program/i.test(raw)) {
    return 'The Memo program is unavailable on this chain. Set USE_MEMO to false in src/lib/chain.ts.'
  }
  return raw || 'Something went wrong. Please try again.'
}
