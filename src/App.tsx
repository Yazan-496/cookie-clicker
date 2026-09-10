import { useCallback, useMemo } from 'react'
import { BakeHistory } from './components/BakeHistory'
import { ConnectButton } from './components/ConnectButton'
import { Cookie } from './components/Cookie'
import { LevelBar } from './components/LevelBar'
import { Shop } from './components/Shop'
import { TxStatus } from './components/TxStatus'
import { useBake } from './hooks/useBake'
import { useGame } from './hooks/useGame'
import { useGasBalance } from './hooks/useGasBalance'
import { useNightly } from './hooks/useNightly'
import { formatScore } from './lib/format'
import { GAS_TOKEN, IS_COOKIE_CHAIN, NETWORK_NAME } from './lib/chain'

export default function App() {
  const { publicKey, connecting, error: walletError, installed, connect, disconnect } =
    useNightly()
  const game = useGame()
  const bakeState = useBake(publicKey)
  const gas = useGasBalance(publicKey)

  const address = publicKey?.toBase58() ?? null
  const outOfGas = gas.balance === 0
  const canBake =
    Boolean(address) && game.totalBaked > 0 && !bakeState.busy && !outOfGas

  // The authoritative score: the highest total ever written to Cookie Chain.
  const onChainScore = useMemo(
    () => bakeState.history.reduce((max, record) => Math.max(max, record.score), 0),
    [bakeState.history],
  )

  const handleBake = useCallback(async () => {
    await bakeState.bake(game.totalBaked)
    // Baking spends gas — pull the fresh balance.
    void gas.refresh()
  }, [bakeState, game.totalBaked, gas])

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
            : outOfGas
              ? `No ${GAS_TOKEN} for gas`
              : `Bake ${formatScore(game.totalBaked)} on Cookie Chain`}
        </button>

        {!address && (
          <p className="hint">Connect Nightly to record your score on Cookie Chain.</p>
        )}
        {address && outOfGas && (
          <p className="hint hint-error">
            This wallet holds no {GAS_TOKEN}. A bake costs about 0.000005{' '}
            {GAS_TOKEN} — ask for a little in the{' '}
            <a href="https://t.me/TheCookieNetChain" target="_blank" rel="noreferrer">
              Cookie Chain Telegram
            </a>
            .
          </p>
        )}
        {address && gas.balance !== null && gas.balance > 0 && (
          <p className="hint">
            {gas.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}{' '}
            {GAS_TOKEN} available for gas
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

        <Shop
          owned={game.owned}
          prices={game.prices}
          score={game.score}
          onBuy={game.buy}
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
