import { Buffer } from 'buffer'
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'

// Overridable so the transaction path can be tested against Solana devnet,
// where SOL is free. Default is always Cookie Chain.
export const COOKIE_CHAIN_RPC =
  import.meta.env.VITE_RPC_URL ?? 'https://rpc.cookiescan.io'

export const EXPLORER_URL =
  import.meta.env.VITE_EXPLORER_URL ?? 'https://cookiescan.io'

// Solana explorer needs ?cluster=devnet; cookiescan needs nothing.
export const EXPLORER_SUFFIX = import.meta.env.VITE_EXPLORER_SUFFIX ?? ''

export const NETWORK_NAME = import.meta.env.VITE_NETWORK_NAME ?? 'Cookie Chain'
export const IS_COOKIE_CHAIN = !import.meta.env.VITE_RPC_URL

export const MEMO_PROGRAM_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
)

// Set to false if the Memo program is ever unavailable; falls back to a
// zero-value self transfer.
export const USE_MEMO = true

// Every bake references this address so the leaderboard can query one place
// and get only Cookie Clicker transactions. The Memo program is shared with
// other apps, so querying it directly would mix in their traffic and
// eventually push ours out of the recent history.
//
// It's a PDA, so nobody holds a key for it. Referenced, never signed for.
export const APP_MARKER = PublicKey.findProgramAddressSync(
  [Buffer.from('cookie-clicker')],
  MEMO_PROGRAM_ID,
)[0]

export const GAS_TOKEN = 'COOK'
const DECIMALS = 1_000_000_000

export const connection = new Connection(COOKIE_CHAIN_RPC, 'confirmed')

export function explorerTxUrl(signature: string): string {
  return `${EXPLORER_URL}/tx/${signature}${EXPLORER_SUFFIX}`
}

export function shortAddress(address: string, size = 4): string {
  if (address.length <= size * 2 + 1) return address
  return `${address.slice(0, size)}…${address.slice(-size)}`
}

export function buildBakeTransaction(
  player: PublicKey,
  score: number,
): Transaction {
  const tx = new Transaction()

  if (USE_MEMO) {
    tx.add(
      new TransactionInstruction({
        keys: [{ pubkey: player, isSigner: true, isWritable: false }],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(
          `cookie-clicker|score:${score}|ts:${Date.now()}`,
          'utf8',
        ),
      }),
    )
  } else {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: player,
        toPubkey: player,
        lamports: 0,
      }),
    )
  }

  // The Memo program requires every account passed to it to be a signer, so
  // the marker can't ride on the memo instruction. Same signature count.
  tx.add(
    SystemProgram.transfer({
      fromPubkey: player,
      toPubkey: APP_MARKER,
      lamports: 0,
    }),
  )

  return tx
}

export async function fetchGasBalance(player: PublicKey): Promise<number> {
  const lamports = await connection.getBalance(player, 'confirmed')
  return lamports / DECIMALS
}

export interface BakeRecord {
  signature: string
  score: number
  at: number
}

export function parseScoreFromMemo(memo: string | null | undefined): number | null {
  if (!memo) return null
  const match = memo.match(/cookie-clicker\|score:(\d+)/)
  return match ? Number(match[1]) : null
}

// Memos ride along with the signature list, so one call is enough here.
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

export interface LeaderboardEntry {
  player: string
  score: number
  signature: string
  at: number
}

export interface LeaderboardStats {
  entries: LeaderboardEntry[]
  players: number
  totalBaked: number
  bakes: number
}

export async function fetchLeaderboard(limit = 200): Promise<LeaderboardStats> {
  const signatures = await connection.getSignaturesForAddress(APP_MARKER, {
    limit,
  })

  // Filter on the memo first — it's free — so we only fetch transactions we
  // actually need.
  const candidates = signatures.filter(
    (info) => !info.err && parseScoreFromMemo(info.memo) !== null,
  )

  if (candidates.length === 0) {
    return { entries: [], players: 0, totalBaked: 0, bakes: 0 }
  }

  const transactions = await connection.getParsedTransactions(
    candidates.map((c) => c.signature),
    { maxSupportedTransactionVersion: 0 },
  )

  // Credit the fee payer, not anything claimed in the memo text — a memo can
  // say anything, but only one wallet signed and paid for it.
  const best = new Map<string, LeaderboardEntry>()

  transactions.forEach((tx, index) => {
    const info = candidates[index]
    const score = parseScoreFromMemo(info.memo)
    if (!tx || score === null) return

    const payer = tx.transaction.message.accountKeys.find((key) => key.signer)
    if (!payer) return

    const player = payer.pubkey.toBase58()
    const current = best.get(player)
    if (!current || score > current.score) {
      best.set(player, {
        player,
        score,
        signature: info.signature,
        at: (info.blockTime ?? 0) * 1000,
      })
    }
  })

  const entries = [...best.values()].sort((a, b) => b.score - a.score)

  return {
    entries,
    players: entries.length,
    totalBaked: entries.reduce((sum, entry) => sum + entry.score, 0),
    bakes: candidates.length,
  }
}

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
    return 'The Memo program is unavailable on this chain.'
  }
  return raw || 'Something went wrong. Please try again.'
}
