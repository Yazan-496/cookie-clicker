import { useCallback, useMemo } from 'react'
import { BakeHistory } from './components/BakeHistory'
import { ConnectButton } from './components/ConnectButton'
import { Cookie } from './components/Cookie'
import { TxStatus } from './components/TxStatus'
import { useBake } from './hooks/useBake'
import { useNightly } from './hooks/useNightly'
import { useScore } from './hooks/useScore'
import { formatScore } from './lib/format'
import { IS_COOKIE_CHAIN, NETWORK_NAME } from './lib/chain'

export default function App() {
  const { publicKey, connecting, error: walletError, installed, connect, disconnect } =
    useNightly()
  const { score, tap } = useScore()
  const bakeState = useBake(publicKey)

  const address = publicKey?.toBase58() ?? null
  const canBake = Boolean(address) && score > 0 && !bakeState.busy

  // The authoritative score: the highest total ever written to Cookie Chain.
  const onChainScore = useMemo(
    () => bakeState.history.reduce((max, record) => Math.max(max, record.score), 0),
    [bakeState.history],
  )

  const handleBake = useCallback(async () => {
    await bakeState.bake(score)
  }, [bakeState, score])

  return (
    <div className="app">
      {!IS_COOKIE_CHAIN && (
        <div className="network-banner" role="alert">
          Testing against {NETWORK_NAME} — not Cookie Chain
        </div>
      )}

      <header className="header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            🍪
          </span>
          <span className="brand-name">Cookie Clicker</span>
        </div>
        <ConnectButton
          address={address}
          connecting={connecting}
          installed={installed}
          onConnect={connect}
          onDisconnect={disconnect}
        />
      </header>

      <main className="main">
        <div className="score" aria-live="polite">
          <span className="score-value" title={score.toLocaleString()}>
            {formatScore(score)}
          </span>
          <span className="score-label">cookies baked</span>

          <span className="score-verified">
            {onChainScore > 0
              ? `${formatScore(onChainScore)} verified on Cookie Chain`
              : 'not yet verified on-chain'}
          </span>
        </div>

        <Cookie onTap={tap} />

        <button className="btn btn-primary" onClick={handleBake} disabled={!canBake}>
          {bakeState.busy ? 'Baking…' : 'Bake on Cookie Chain'}
        </button>

        {!address && (
          <p className="hint">
            Connect Nightly to record your score on Cookie Chain.
          </p>
        )}
        {walletError && <p className="hint hint-error">{walletError}</p>}

        <TxStatus
          status={bakeState.status}
          label={bakeState.statusLabel}
          error={bakeState.error}
          signature={bakeState.signature}
          onDismiss={bakeState.reset}
        />

        <BakeHistory records={bakeState.history} />
      </main>

      <footer className="footer">
        Built on Cookie Chain ·{' '}
        <a href="https://cookiescan.io" target="_blank" rel="noreferrer">
          Cookiescan
        </a>
      </footer>
    </div>
  )
}
