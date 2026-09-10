import { useState } from 'react'
import { BakeHistory } from '../components/BakeHistory'
import { ConnectButton } from '../components/ConnectButton'
import type { useBake } from '../hooks/useBake'
import type { useGame } from '../hooks/useGame'
import type { useGasBalance } from '../hooks/useGasBalance'
import { formatScore } from '../lib/format'
import { APP_MARKER, EXPLORER_URL, GAS_TOKEN, NETWORK_NAME } from '../lib/chain'

interface Props {
  address: string | null
  connecting: boolean
  installed: boolean
  onConnect: () => void
  onDisconnect: () => void
  game: ReturnType<typeof useGame>
  gas: ReturnType<typeof useGasBalance>
  bakeState: ReturnType<typeof useBake>
  rank: number
}

export function ProfilePage({
  address,
  connecting,
  installed,
  onConnect,
  onDisconnect,
  game,
  gas,
  bakeState,
  rank,
}: Props) {
  const [copied, setCopied] = useState(false)

  const copyAddress = async () => {
    if (!address) return
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard blocked — the address is visible to select manually */
    }
  }

  return (
    <section className="page">
      <div className="page-head">
        <h1 className="page-title">Profile</h1>
        <span className="page-sub">{NETWORK_NAME}</span>
      </div>

      {!address ? (
        <div className="empty">
          <span className="empty-icon" aria-hidden="true">
            👤
          </span>
          <p className="empty-title">No wallet connected</p>
          <p className="empty-body">
            Connect Nightly to record scores on Cookie Chain and appear on the
            leaderboard. You can play without it.
          </p>
          <ConnectButton
            address={address}
            connecting={connecting}
            installed={installed}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
          />
        </div>
      ) : (
        <>
          <div className="wallet-card">
            <span className="wallet-label">Wallet</span>
            <button
              className="wallet-address"
              onClick={copyAddress}
              title="Copy address"
            >
              {address}
            </button>
            <span className="wallet-copied">{copied ? 'Copied' : ''}</span>

            <div className="wallet-row">
              <span>
                {gas.loading
                  ? 'checking…'
                  : gas.balance === null
                    ? `${GAS_TOKEN} balance unavailable`
                    : `${gas.balance.toLocaleString(undefined, {
                        maximumFractionDigits: 6,
                      })} ${GAS_TOKEN}`}
              </span>
              <button className="wallet-refresh" onClick={() => void gas.refresh()}>
                ↻
              </button>
            </div>
          </div>

          <div className="stats">
            <div className="stat">
              <span className="stat-value">{game.progress.level}</span>
              <span className="stat-label">level</span>
            </div>
            <div className="stat">
              <span className="stat-value">{formatScore(game.totalBaked)}</span>
              <span className="stat-label">lifetime</span>
            </div>
            <div className="stat">
              <span className="stat-value">{formatScore(game.cps)}</span>
              <span className="stat-label">per sec</span>
            </div>
            <div className="stat">
              <span className="stat-value">{rank >= 0 ? `#${rank + 1}` : '—'}</span>
              <span className="stat-label">rank</span>
            </div>
          </div>

          <BakeHistory records={bakeState.history} />

          {bakeState.history.length === 0 && (
            <p className="page-note">
              No bakes yet. Your on-chain history is read back from Cookie Chain,
              so it follows this wallet on any device.
            </p>
          )}

          <div className="profile-actions">
            <a
              className="btn btn-ghost"
              href={`${EXPLORER_URL}/address/${address}`}
              target="_blank"
              rel="noreferrer"
            >
              View on Cookiescan ↗
            </a>
            <button className="btn btn-ghost" onClick={onDisconnect}>
              Disconnect
            </button>
          </div>
        </>
      )}

      <p className="page-note">
        App marker:{' '}
        <a
          href={`${EXPLORER_URL}/address/${APP_MARKER.toBase58()}`}
          target="_blank"
          rel="noreferrer"
        >
          {APP_MARKER.toBase58()}
        </a>
        <br />
        Every bake references this address, giving the game its own namespace on
        Cookie Chain.
      </p>
    </section>
  )
}
