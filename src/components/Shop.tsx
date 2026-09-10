import { UPGRADES, type Owned } from '../lib/game'
import { formatScore } from '../lib/format'

interface Props {
  owned: Owned
  prices: Record<string, number>
  score: number
  onBuy: (id: string) => void
}

export function Shop({ owned, prices, score, onBuy }: Props) {
  return (
    <section className="shop">
      <h2 className="shop-title">Bakery</h2>
      <div className="shop-grid">
        {UPGRADES.map((def) => {
          const price = prices[def.id] ?? def.baseCost
          const count = owned[def.id] ?? 0
          const affordable = score >= price

          return (
            <button
              key={def.id}
              className={`upgrade ${affordable ? 'is-affordable' : ''}`}
              onClick={() => onBuy(def.id)}
              disabled={!affordable}
              title={`${def.name} — ${def.blurb}`}
            >
              {count > 0 && <span className="upgrade-count">{count}</span>}
              <span className="upgrade-icon" aria-hidden="true">
                {def.icon}
              </span>
              <span className="upgrade-name">{def.name}</span>
              <span className="upgrade-blurb">{def.blurb}</span>
              <span className="upgrade-price">🍪 {formatScore(price)}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
