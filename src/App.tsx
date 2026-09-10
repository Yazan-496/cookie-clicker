import { useCallback, useState } from 'react'
import { BakeHistory } from './components/BakeHistory'
import { ConnectButton } from './components/ConnectButton'
import { Cookie } from './components/Cookie'
import { TxStatus } from './components/TxStatus'
import { useBake } from './hooks/useBake'
import { useNightly } from './hooks/useNightly'

export default function App() {
  const { publicKey, connecting, error: walletError, installed, connect, disconnect } =
    useNightly()
  const [score, setScore] = useState(0)
  const bakeState = useBake(publicKey)

  const address = publicKey?.toBase58() ?? null
  const canBake = Boolean(address) && score > 0 && !bakeState.busy

  const handleTap = useCallback(() => setScore((n) => n + 1), [])

  const handleBake = useCallback(async () => {
    await bakeState.bake(score)
  }, [bakeState, score])

  return (
    <div className="app">
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
          <span className="score-value">{score.toLocaleString()}</span>
          <span className="score-label">cookies baked</span>
        </div>

        <Cookie onTap={handleTap} />

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
        Built on Cookie Chain · <a href="https://cookiescan.io" target="_blank" rel="noreferrer">Cookiescan</a>
      </footer>
    </div>
  )
}
