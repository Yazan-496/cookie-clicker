import { Cookie } from '../components/Cookie'
import { LevelBar } from '../components/LevelBar'
import { TxStatus } from '../components/TxStatus'
import type { useBake } from '../hooks/useBake'
import type { useGame } from '../hooks/useGame'
import { formatScore } from '../lib/format'
import { GAS_TOKEN } from '../lib/chain'
import { nextTier, type CookieTier } from '../lib/cookieTiers'

interface Props {
  game: ReturnType<typeof useGame>
  bakeState: ReturnType<typeof useBake>
  address: string | null
  onChainScore: number
  canBake: boolean
  showGasHelp: boolean
  onBake: () => void
  onTap: () => void
  tier: CookieTier
  onDismissGasHelp: () => void
  walletError: string | null
}

export function BakePage({
  game,
  bakeState,
  address,
  onChainScore,
  canBake,
  showGasHelp,
  onBake,
  onTap,
  tier,
  onDismissGasHelp,
  walletError,
}: Props) {
  const upcoming = nextTier(game.progress.level)

  return (
    <>
      <div className="score" aria-live="polite">
        <span className="score-value" title={game.score.toLocaleString()}>
          {formatScore(game.score)}
        </span>
        <span className="score-label">cookies</span>

        <div className="score-rates">
          <span className="rate">+{formatScore(game.tapValue)} / tap</span>
          {game.cps > 0 && (
            <span className={`rate rate-passive ${game.idle ? 'is-idle' : ''}`}>
              {game.idle
                ? 'paused — tap to resume'
                : `+${formatScore(game.cps)} / sec`}
            </span>
          )}
        </div>
      </div>

      <LevelBar progress={game.progress} />

      <Cookie onTap={onTap} tier={tier} tapValue={game.tapValue} />

      <span className="tier-name">
        {tier.name}
        {upcoming && (
          <span className="tier-next"> · {upcoming.name} at level {upcoming.minLevel}</span>
        )}
      </span>

      <span className="score-verified">
        {onChainScore > 0
          ? `${formatScore(onChainScore)} verified on Cookie Chain`
          : 'not yet verified on-chain'}
      </span>

      <button className="btn btn-primary" onClick={onBake} disabled={!canBake}>
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
              onClick={onDismissGasHelp}
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
    </>
  )
}
