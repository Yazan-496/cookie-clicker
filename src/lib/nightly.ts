import type { PublicKey, Transaction } from '@solana/web3.js'

/**
 * Nightly injects a Solana provider at window.nightly.solana.
 * Cookie Chain requires Nightly — MetaMask cannot add a custom SVM RPC.
 */
export interface NightlyProvider {
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: PublicKey }>
  disconnect(): Promise<void>
  signTransaction(transaction: Transaction): Promise<Transaction>
  publicKey?: PublicKey | null
  on?(event: string, handler: (...args: unknown[]) => void): void
  off?(event: string, handler: (...args: unknown[]) => void): void
}

declare global {
  interface Window {
    nightly?: { solana?: NightlyProvider }
  }
}

export const NIGHTLY_INSTALL_URL = 'https://nightly.app'

export function getNightlyProvider(): NightlyProvider | null {
  if (typeof window === 'undefined') return null
  return window.nightly?.solana ?? null
}

export function isNightlyInstalled(): boolean {
  return getNightlyProvider() !== null
}
