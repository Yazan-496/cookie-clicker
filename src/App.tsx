import { useCallback, useMemo, useState } from 'react'
import { ConnectButton } from './components/ConnectButton'
import { Leaderboard } from './components/Leaderboard'
import { TabBar, type Tab } from './components/TabBar'
import { BakePage } from './pages/BakePage'
import { BoardPage } from './pages/BoardPage'
import { ProfilePage } from './pages/ProfilePage'
import { ShopPage } from './pages/ShopPage'
import { useBake } from './hooks/useBake'
import { useGame } from './hooks/useGame'
import { useGasBalance } from './hooks/useGasBalance'
import { useLeaderboard } from './hooks/useLeaderboard'
import { useNightly } from './hooks/useNightly'
import { UPGRADES } from './lib/game'
import { IS_COOKIE_CHAIN, NETWORK_NAME } from './lib/chain'

export default function App() {
  const { publicKey, connecting, error: walletError, installed, connect, disconnect } =
    useNightly()

  // All game and chain state lives here so switching tabs never resets it.
  const game = useGame()
  const bakeState = useBake(publicKey)
  const gas = useGasBalance(publicKey)
  const board = useLeaderboard()

  const [tab, setTab] = useState<Tab>('bake')
  const [showGasHelp, setShowGasHelp] = useState(false)

  const address = publicKey?.toBase58() ?? null
  const outOfGas = gas.balance === 0
  const canBake = Boolean(address) && game.totalBaked > 0 && !bakeState.busy

  const onChainScore = useMemo(
    () => bakeState.history.reduce((max, record) => Math.max(max, record.score), 0),
    [bakeState.history],
  )

  const rank = useMemo(
    () => (address ? board.entries.findIndex((e) => e.player === address) : -1),
    [board.entries, address],
  )

  // Dot on the Bakery tab when something is newly affordable.
  const shopAlert = useMemo(
    () =>
      UPGRADES.some(
        (def) => game.score >= (game.prices[def.id] ?? def.baseCost),
      ),
    [game.score, game.prices],
  )

  const handleBake = useCallback(async () => {
    // Explain gas at the moment it is needed, not before.
    if (outOfGas) {
      setShowGasHelp(true)
      return
    }
    setShowGasHelp(false)
    await bakeState.bake(game.totalBaked)
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
        {tab === 'bake' && (
          <div className="split">
            <div className="split-main">
              <BakePage
                game={game}
                bakeState={bakeState}
                address={address}
                onChainScore={onChainScore}
                canBake={canBake}
                showGasHelp={showGasHelp}
                onBake={handleBake}
                onDismissGasHelp={() => setShowGasHelp(false)}
                walletError={walletError}
              />
            </div>

            {/* Wide screens get the standings alongside instead of dead space. */}
            <aside className="split-aside">
              <span className="board-caption">Live standings</span>
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
            </aside>
          </div>
        )}

        {tab === 'shop' && <ShopPage game={game} />}

        {tab === 'board' && <BoardPage board={board} address={address} />}

        {tab === 'profile' && (
          <ProfilePage
            address={address}
            connecting={connecting}
            installed={installed}
            onConnect={connect}
            onDisconnect={disconnect}
            game={game}
            gas={gas}
            bakeState={bakeState}
            rank={rank}
          />
        )}
      </main>

      <TabBar active={tab} onChange={setTab} shopAlert={shopAlert} />
    </div>
  )
}
