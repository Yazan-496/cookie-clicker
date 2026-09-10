import { useCallback, useMemo, useState } from 'react'
import { BakeHistory } from './components/BakeHistory'
import { ConnectButton } from './components/ConnectButton'
import { Cookie } from './components/Cookie'
import { Leaderboard } from './components/Leaderboard'
import { LevelBar } from './components/LevelBar'
import { Shop } from './components/Shop'
import { TxStatus } from './components/TxStatus'
import { useBake } from './hooks/useBake'
import { useGame } from './hooks/useGame'
import { useGasBalance } from './hooks/useGasBalance'
import { useLeaderboard } from './hooks/useLeaderboard'
import { useNightly } from './hooks/useNightly'
import { formatScore } from './lib/format'
import { GAS_TOKEN, IS_COOKIE_CHAIN, NETWORK_NAME } from './lib/chain'

export default function App() {
  const { publicKey, connecting, error: walletError, installed, connect, disconnect } =
    useNightly()
  const game = useGame()
  const bakeState = useBake(publicKey)
  const gas = useGasBalance(publicKey)
  const board = useLeaderboard()

  const [showGasHelp, setShowGasHelp] = useState(false)

  const address = publicKey?.toBase58() ?? null
  const outOfGas = gas.balance === 0
  // Deliberately not gated on gas — a first-time visitor should be able to
  // play and press the button without being met by a warning they can't act on.
  const canBake = Boolean(address) && game.totalBaked > 0 && !bakeState.busy

  // The authoritative score: the highest total ever written to Cookie Chain.
  const onChainScore = useMemo(
    () => bakeState.history.reduce((max, record) => Math.max(max, record.score), 0),
    [bakeState.history],
  )

  const handleBake = useCallback(async () => {
    // Explain gas at the moment it is needed, not before.
    if (outOfGas) {
      setShowGasHelp(true)
      return
    }
    setShowGasHelp(false)
    await bakeState.bake(game.totalBaked)
    // Baking spends gas and changes the standings — refresh both.
    void gas.refresh()
    void board.refresh()
  }, [bakeState, game.totalBaked, gas, board, outOfGas])

  return (
    <div className="app">
      {!IS_COOKIE_CHAIN && (
        <div className="network-banner" role="alert">
          Testing against {NETWORK_NAME} — not Cookie Chain
        </div>
      )}

      <header className="header">
        <div className="brand">
          <span className="level-badge">LV {game.progress.level}</span>
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
          <span className="score-value" title={game.score.toLocaleString()}>
            {formatScore(game.score)}
          </span>
          <span className="score-label">cookies</span>

          <div className="score-rates">
            <span className="rate">+{formatScore(game.tapValue)} / tap</span>
            {game.cps > 0 && (
              <span className="rate rate-passive">
                +{formatScore(game.cps)} / sec
              </span>
            )}
          </div>
        </div>

        <LevelBar progress={game.progress} />

        <Cookie onTap={game.tap} />

        <span className="score-verified">
          {onChainScore > 0
            ? `${formatScore(onChainScore)} verified on Cookie Chain`
            : 'not yet verified on-chain'}
        </span>

        <button className="btn btn-primary" onClick={handleBake} disabled={!canBake}>
          {bakeState.busy
            ? 'Baking…'
            : `Bake ${formatScore(game.totalBaked)} on Cookie Chain`}
        </button>

        {!address && (
          <p className="hint">Connect Nightly to record your score on Cookie Chain.</p>
        )}

        {showGasHelp && (
          <div className="gas-card">
            <div className="gas-head">
              <span className="gas-icon" aria-hidden="true">
                ⛽
              </span>
              <span>A little {GAS_TOKEN} is needed to write to the chain</span>
              <button
                className="tx-close"
                onClick={() => setShowGasHelp(false)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
            <p className="gas-body">
              Baking is a real Cookie Chain transaction. One {GAS_TOKEN} covers
              hundreds of thousands of them.
            </p>
            <div className="gas-links">
              <a
                className="btn btn-ghost"
                href="https://hyperlane.cookiescan.io"
                target="_blank"
                rel="noreferrer"
              >
                Cookie Chain Bridge ↗
              </a>
              <a
                className="btn btn-ghost"
                href="https://t.me/TheCookieNetChain"
                target="_blank"
                rel="noreferrer"
              >
                Ask in Telegram ↗
              </a>
            </div>
          </div>
        )}

        {walletError && <p className="hint hint-error">{walletError}</p>}

        <TxStatus
          status={bakeState.status}
          label={bakeState.statusLabel}
          error={bakeState.error}
          signature={bakeState.signature}
          onDismiss={bakeState.reset}
        />

        <Shop
          owned={game.owned}
          prices={game.prices}
          score={game.score}
          onBuy={game.buy}
        />

        <Leaderboard
          entries={board.entries}
          players={board.players}
          totalBaked={board.totalBaked}
          bakes={board.bakes}
          loading={board.loading}
          error={board.error}
          currentPlayer={address}
          onRefresh={board.refresh}
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
