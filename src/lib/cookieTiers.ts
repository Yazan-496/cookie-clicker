export type CookieShape = 'circle' | 'soft' | 'organic' | 'scalloped' | 'craggy'

export interface CookieTier {
  id: string
  name: string
  minLevel: number
  /** Dough gradient: centre → mid → edge. Always in the baked-brown family. */
  dough: [string, string, string]
  rim: string
  chip: [string, string]
  chipCount: number
  shape: CookieShape
  /** Baked detail drawn over the dough. */
  detail: 'none' | 'cracks' | 'drizzle' | 'flecks'
  idle: 'float' | 'wobble' | 'breathe' | 'spin-drift'
  glow: string
}

// Progression is shape, not colour — every tier stays baked-brown. A plain
// disc at the start, then softer edges, hand-shaped irregularity, scalloped
// rims, finally a craggy bake.
export const COOKIE_TIERS: CookieTier[] = [
  {
    id: 'dough',
    name: 'Plain Dough',
    minLevel: 1,
    dough: ['#f4dcb6', '#dcb87f', '#b8904f'],
    rim: '#96703b',
    chip: ['#b98d5c', '#8a6238'],
    chipCount: 3,
    shape: 'circle',
    detail: 'none',
    idle: 'float',
    glow: 'rgba(232, 190, 130, 0.24)',
  },
  {
    id: 'classic',
    name: 'Chocolate Chip',
    minLevel: 5,
    dough: ['#f0be82', '#d59a55', '#a96c31'],
    rim: '#7d4d20',
    chip: ['#7a4e28', '#331d0d'],
    chipCount: 7,
    shape: 'soft',
    detail: 'none',
    idle: 'wobble',
    glow: 'rgba(255, 168, 61, 0.28)',
  },
  {
    id: 'double',
    name: 'Double Chocolate',
    minLevel: 12,
    dough: ['#a2714a', '#6f4830', '#42281a'],
    rim: '#2c1a10',
    chip: ['#e0b077', '#9a6a3c'],
    chipCount: 9,
    shape: 'organic',
    detail: 'none',
    idle: 'breathe',
    glow: 'rgba(200, 148, 92, 0.3)',
  },
  {
    id: 'artisan',
    name: 'Artisan Bake',
    minLevel: 22,
    dough: ['#f2c584', '#cb8f47', '#8f5c26'],
    rim: '#6b431a',
    chip: ['#6b451f', '#2e1a0b'],
    chipCount: 10,
    shape: 'scalloped',
    detail: 'cracks',
    idle: 'wobble',
    glow: 'rgba(232, 160, 74, 0.32)',
  },
  {
    id: 'golden',
    name: 'Golden Bake',
    minLevel: 35,
    dough: ['#ffe6ab', '#e0aa4e', '#a8761f'],
    rim: '#7e5711',
    chip: ['#7a4e28', '#2e1a0b'],
    chipCount: 11,
    shape: 'scalloped',
    detail: 'drizzle',
    idle: 'breathe',
    glow: 'rgba(255, 200, 90, 0.4)',
  },
  {
    id: 'legendary',
    name: 'Legendary Bake',
    minLevel: 50,
    dough: ['#d9a86a', '#8a5630', '#3f2413'],
    rim: '#26150a',
    chip: ['#ffd98a', '#b07a2e'],
    chipCount: 12,
    shape: 'craggy',
    detail: 'flecks',
    idle: 'spin-drift',
    glow: 'rgba(255, 190, 100, 0.45)',
  },
]

export function tierFor(level: number): CookieTier {
  let match = COOKIE_TIERS[0]
  for (const tier of COOKIE_TIERS) {
    if (level >= tier.minLevel) match = tier
  }
  return match
}

export function nextTier(level: number): CookieTier | null {
  return COOKIE_TIERS.find((tier) => tier.minLevel > level) ?? null
}

const SHAPE_SETTINGS: Record<CookieShape, { lobes: number; amplitude: number }> = {
  circle: { lobes: 0, amplitude: 0 },
  soft: { lobes: 5, amplitude: 0.9 },
  organic: { lobes: 7, amplitude: 2.1 },
  scalloped: { lobes: 13, amplitude: 2.6 },
  craggy: { lobes: 9, amplitude: 3.4 },
}

// Sweeps a circle and perturbs the radius with a sine wave. More lobes gives
// a finer scalloped rim, more amplitude a rougher edge.
export function cookiePath(shape: CookieShape, radius = 46): string {
  const { lobes, amplitude } = SHAPE_SETTINGS[shape]
  if (lobes === 0) {
    return `M50 ${50 - radius}a${radius} ${radius} 0 1 0 0.01 0Z`
  }

  const steps = 96
  let d = ''
  for (let i = 0; i <= steps; i += 1) {
    const t = (i / steps) * Math.PI * 2
    // A second, slower wave keeps scalloped rims from looking machine-cut.
    const r =
      radius + Math.sin(t * lobes) * amplitude + Math.sin(t * 3 + 1.2) * (amplitude * 0.3)
    const x = 50 + Math.cos(t) * r
    const y = 50 + Math.sin(t) * r
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
  }
  return `${d}Z`
}

/** Deterministic chip placement so a tier always looks the same. */
export function chipLayout(count: number) {
  const chips: { cx: number; cy: number; r: number }[] = []
  const golden = 2.39996
  for (let i = 0; i < count; i += 1) {
    const radius = 10 + 25 * Math.sqrt((i + 0.6) / count)
    const angle = i * golden
    chips.push({
      cx: 50 + Math.cos(angle) * radius,
      cy: 50 + Math.sin(angle) * radius,
      r: 3.2 + ((i * 7) % 5) * 0.7,
    })
  }
  return chips
}

/** Baked cracks, placed deterministically per tier. */
export const CRACK_PATHS = [
  'M32 38c5 4 3 9 8 12s9-1 12 4',
  'M64 32c-3 5 1 8-2 12s-8 3-9 8',
  'M38 68c4-2 8 2 12-1',
]
