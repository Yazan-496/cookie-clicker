import type { useGame } from '../hooks/useGame'
import { UPGRADES } from '../lib/game'
import { formatScore } from '../lib/format'

interface Props {
  game: ReturnType<typeof useGame>
  onBuy: (id: string) => void
}

export function ShopPage({ game, onBuy }: Props) {
  return (
    <section className="page">
      <div className="page-head">
        <h1 className="page-title">Bakery</h1>
        <span className="page-sub">
          🍪 {formatScore(game.score)} to spend
        </span>
      </div>

      <ul className="upgrade-list">
        {UPGRADES.map((def) => {
          const price = game.prices[def.id] ?? def.baseCost
          const count = game.owned[def.id] ?? 0
          const affordable = game.score >= price
          const contribution = def.cps
            ? `${formatScore(def.cps * count)} / sec`
            : `+${formatScore(def.tap * count)} per tap`

          return (
            <li key={def.id}>
              <button
                className={`upgrade-row ${affordable ? 'is-affordable' : ''}`}
                onClick={() => onBuy(def.id)}
                disabled={!affordable}
              >
                <span className="upgrade-row-icon" aria-hidden="true">
                  {def.icon}
                </span>

                <span className="upgrade-row-main">
                  <span className="upgrade-row-name">
                    {def.name}
                    {count > 0 && <span className="upgrade-owned">×{count}</span>}
                  </span>
                  <span className="upgrade-row-blurb">
                    {def.blurb}
                    {count > 0 && ` · producing ${contribution}`}
                  </span>
                </span>

                <span className="upgrade-row-price">
                  🍪 {formatScore(price)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <p className="page-note">
        Each purchase raises that item's price, so early buys stay valuable and
        no single upgrade runs away with the game.
      </p>
    </section>
  )
}
