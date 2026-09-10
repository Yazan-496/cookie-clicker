import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'

/** Cookie Chain community RPC — from https://docs.cookiechain.wtf */
export const COOKIE_CHAIN_RPC = 'https://rpc.cookiescan.io'

/** Block explorer used for transaction links. */
export const EXPLORER_URL = 'https://cookiescan.io'

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
  return `${EXPLORER_URL}/tx/${signature}`
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
