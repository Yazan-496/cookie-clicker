export interface CookieTier {
  id: string
  name: string
  minLevel: number
  /** Dough gradient: centre → mid → edge. */
  dough: [string, string, string]
  rim: string
  chip: [string, string]
  chipCount: number
  /** Extra flourish drawn over the dough. */
  flourish: 'none' | 'frosting' | 'sparkle' | 'glaze'
  /** Which looping idle animation this tier uses. */
  idle: 'float' | 'wobble' | 'breathe' | 'spin-drift'
  glow: string
}

/**
 * The cookie changes as you level, so progress is visible on the thing you're
 * actually looking at rather than only in a number. Each tier also swaps the
 * idle animation — the same loop for an hour is what makes it read as static.
 */
export const COOKIE_TIERS: CookieTier[] = [
  {
    id: 'dough',
    name: 'Plain Dough',
    minLevel: 1,
    dough: ['#f2cd9c', '#dcb078', '#b8894c'],
    rim: '#8f6635',
    chip: ['#8a6238', '#5b3d1d'],
    chipCount: 4,
    flourish: 'none',
    idle: 'float',
    glow: 'rgba(255, 200, 130, 0.22)',
  },
  {
    id: 'classic',
    name: 'Chocolate Chip',
    minLevel: 5,
    dough: ['#f0be82', '#d59a55', '#a96c31'],
    rim: '#7d4d20',
    chip: ['#7a4e28', '#331d0d'],
    chipCount: 8,
    flourish: 'none',
    idle: 'wobble',
    glow: 'rgba(255, 168, 61, 0.28)',
  },
  {
    id: 'double',
    name: 'Double Chocolate',
    minLevel: 12,
    dough: ['#8a5a3c', '#5f3a24', '#3c2214'],
    rim: '#2a1710',
    chip: ['#d9a05f', '#8a5a2b'],
    chipCount: 10,
    flourish: 'none',
    idle: 'breathe',
    glow: 'rgba(217, 160, 95, 0.3)',
  },
  {
    id: 'frosted',
    name: 'Frosted',
    minLevel: 22,
    dough: ['#ffd9ec', '#f2a8cd', '#cf74a4'],
    rim: '#a8567f',
    chip: ['#ffffff', '#ffd9ec'],
    chipCount: 9,
    flourish: 'frosting',
    idle: 'spin-drift',
    glow: 'rgba(255, 153, 204, 0.34)',
  },
  {
    id: 'golden',
    name: 'Golden',
    minLevel: 35,
    dough: ['#fff2b8', '#ffce4d', '#d19a1a'],
    rim: '#a3760c',
    chip: ['#fff6d0', '#e0a92a'],
    chipCount: 10,
    flourish: 'sparkle',
    idle: 'breathe',
    glow: 'rgba(255, 206, 77, 0.45)',
  },
  {
    id: 'cosmic',
    name: 'Cosmic',
    minLevel: 50,
    dough: ['#c9b6ff', '#7d5bd6', '#3d2a75'],
    rim: '#251845',
    chip: ['#ffe9a8', '#ff9ad5'],
    chipCount: 12,
    flourish: 'glaze',
    idle: 'spin-drift',
    glow: 'rgba(160, 120, 255, 0.45)',
  },
]

export function tierFor(level: number): CookieTier {
  let match = COOKIE_TIERS[0]
  for (const tier of COOKIE_TIERS) {
    if (level >= tier.minLevel) match = tier
  }
  return match
}

/** The next tier and how far away it is, for the progress hint. */
export function nextTier(level: number): CookieTier | null {
  return COOKIE_TIERS.find((tier) => tier.minLevel > level) ?? null
}

/** Deterministic chip placement so a tier always looks the same. */
export function chipLayout(count: number) {
  const chips: { cx: number; cy: number; r: number }[] = []
  // Golden-angle spiral keeps chips evenly spread without overlapping.
  const golden = 2.39996
  for (let i = 0; i < count; i += 1) {
    const radius = 11 + 27 * Math.sqrt((i + 0.6) / count)
    const angle = i * golden
    chips.push({
      cx: 50 + Math.cos(angle) * radius,
      cy: 50 + Math.sin(angle) * radius,
      r: 3.4 + ((i * 7) % 5) * 0.72,
    })
  }
  return chips
}
