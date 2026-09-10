import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ConnectButton } from './components/ConnectButton'
import { Controls } from './components/Controls'
import { Leaderboard } from './components/Leaderboard'
import { TabBar, type Tab } from './components/TabBar'
import { TierUp } from './components/TierUp'
import { BakePage } from './pages/BakePage'
import { BoardPage } from './pages/BoardPage'
import { ProfilePage } from './pages/ProfilePage'
import { ShopPage } from './pages/ShopPage'
import { useBake } from './hooks/useBake'
import { useGame } from './hooks/useGame'
import { useGasBalance } from './hooks/useGasBalance'
import { useLeaderboard } from './hooks/useLeaderboard'
import { useNightly } from './hooks/useNightly'
import { useSound } from './hooks/useSound'
import { useTheme } from './hooks/useTheme'
import { UPGRADES } from './lib/game'
import { tierFor } from './lib/cookieTiers'
import { IS_COOKIE_CHAIN, NETWORK_NAME } from './lib/chain'

export default function App() {
  const { publicKey, connecting, error: walletError, installed, connect, disconnect } =
    useNightly()

  // All game and chain state lives here so switching tabs never resets it.
  const game = useGame()
  const bakeState = useBake(publicKey)
  const gas = useGasBalance(publicKey)
  const board = useLeaderboard()

  const sound = useSound()
  const theme = useTheme()

  const [tab, setTab] = useState<Tab>('bake')
  const [showGasHelp, setShowGasHelp] = useState(false)

  const tier = useMemo(() => tierFor(game.progress.level), [game.progress.level])

  // Announce a tier change. The ref starts at the loaded tier, so restoring a
  // high-level save doesn't fire a false unlock on page load.
  const [tierUp, setTierUp] = useState<typeof tier | null>(null)
  const seenTier = useRef<string | null>(null)

  useEffect(() => {
    if (seenTier.current === null) {
      seenTier.current = tier.id
      return
    }
    if (seenTier.current === tier.id) return

    seenTier.current = tier.id
    setTierUp(tier)
    sound.play('success')

    const timer = window.setTimeout(() => setTierUp(null), 4200)
    return () => window.clearTimeout(timer)
  }, [tier, sound])

  const handleTap = useCallback(
    (ring: number) => {
      game.tap()
      sound.playNote(ring)
    },
    [game, sound],
  )

  const handleBuy = useCallback(
    (id: string) => {
      game.buy(id)
      sound.play('buy')
    },
    [game, sound],
  )

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

  // Sound follows the transaction outcome rather than the click.
  useEffect(() => {
    if (bakeState.status === 'confirmed') sound.play('success')
    if (bakeState.status === 'error') sound.play('error')
  }, [bakeState.status, sound])

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
        <div className="header-right">
          <Controls
            theme={theme.theme}
            onCycleTheme={theme.cycle}
            muted={sound.muted}
            volume={sound.volume}
            onToggleMute={sound.toggleMute}
            onVolume={sound.setVolume}
          />
          <ConnectButton
            address={address}
            connecting={connecting}
            installed={installed}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        </div>
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
                onTap={handleTap}
                tier={tier}
                celebrating={tierUp !== null}
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

        {tab === 'shop' && <ShopPage game={game} onBuy={handleBuy} />}

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

      {tierUp && <TierUp tier={tierUp} onDismiss={() => setTierUp(null)} />}

      <TabBar active={tab} onChange={setTab} shopAlert={shopAlert} />
    </div>
  )
}
