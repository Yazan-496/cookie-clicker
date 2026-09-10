import { chipLayout, cookiePath, type CookieTier } from '../lib/cookieTiers'

interface Props {
  tier: CookieTier
  onDismiss: () => void
}

// Draws the new cookie rather than naming it — the reward is the thing
// itself.
export function TierUp({ tier, onDismiss }: Props) {
  const chips = chipLayout(Math.min(6, tier.chipCount))
  const gid = `up-${tier.id}`

  return (
    <div className="tierup" role="status" onClick={onDismiss}>
      <div className="tierup-card">
        <svg viewBox="0 0 100 100" className="tierup-cookie" aria-hidden="true">
          <defs>
            <radialGradient id={`${gid}-dough`} cx="34%" cy="28%" r="78%">
              <stop offset="0%" stopColor={tier.dough[0]} />
              <stop offset="55%" stopColor={tier.dough[1]} />
              <stop offset="100%" stopColor={tier.dough[2]} />
            </radialGradient>
          </defs>
          <path d={cookiePath(tier.shape, 47)} fill={tier.rim} />
          <path d={cookiePath(tier.shape, 46)} fill={`url(#${gid}-dough)`} />
          {chips.map((chip, index) => (
            <circle
              key={index}
              cx={chip.cx}
              cy={chip.cy}
              r={chip.r}
              fill={tier.chip[1]}
            />
          ))}
        </svg>

        <div className="tierup-text">
          <span className="tierup-kicker">New cookie unlocked</span>
          <span className="tierup-name">{tier.name}</span>
          <span className="tierup-level">Level {tier.minLevel}</span>
        </div>
      </div>
    </div>
  )
}
