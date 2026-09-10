export interface UpgradeDef {
  id: string
  name: string
  icon: string
  /** Price of the first unit. Each further unit costs `growth` times more. */
  baseCost: number
  growth: number
  /** Cookies per second added by each unit. */
  cps: number
  /** Extra cookies per tap added by each unit. */
  tap: number
  blurb: string
}

export type Owned = Record<string, number>

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'pin',
    name: 'Rolling Pin',
    icon: '🥖',
    baseCost: 60,
    growth: 1.22,
    cps: 0,
    tap: 1,
    blurb: '+1 per tap',
  },
  {
    id: 'oven',
    name: 'Oven',
    icon: '🔥',
    baseCost: 120,
    growth: 1.15,
    cps: 1,
    tap: 0,
    blurb: '+1 / sec',
  },
  {
    id: 'mixer',
    name: 'Mixer',
    icon: '🥣',
    baseCost: 700,
    growth: 1.16,
    cps: 7,
    tap: 0,
    blurb: '+7 / sec',
  },
  {
    id: 'farm',
    name: 'Farm',
    icon: '🚜',
    baseCost: 4000,
    growth: 1.17,
    cps: 40,
    tap: 0,
    blurb: '+40 / sec',
  },
]

const BY_ID = new Map(UPGRADES.map((u) => [u.id, u]))

export function costOf(def: UpgradeDef, owned: number): number {
  return Math.floor(def.baseCost * Math.pow(def.growth, Math.max(0, owned)))
}

export function cpsOf(owned: Owned): number {
  let total = 0
  for (const [id, count] of Object.entries(owned)) {
    const def = BY_ID.get(id)
    if (def) total += def.cps * Math.max(0, count)
  }
  return total
}

/** Cookies produced by a single tap, including upgrades. */
export function tapValueOf(owned: Owned): number {
  let total = 1
  for (const [id, count] of Object.entries(owned)) {
    const def = BY_ID.get(id)
    if (def) total += def.tap * Math.max(0, count)
  }
  return total
}

/** Lifetime cookies needed to reach a level. Level 1 starts at zero. */
export function thresholdFor(level: number): number {
  return 100 * Math.pow(Math.max(1, level) - 1, 2)
}

export function levelFor(totalBaked: number): number {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, totalBaked) / 100)) + 1)
}

export interface LevelProgress {
  level: number
  /** 0–1 through the current level. */
  fraction: number
  /** Lifetime cookies still needed for the next level. */
  remaining: number
  nextAt: number
}

export function levelProgress(totalBaked: number): LevelProgress {
  const level = levelFor(totalBaked)
  const floorAt = thresholdFor(level)
  const nextAt = thresholdFor(level + 1)
  const span = Math.max(1, nextAt - floorAt)
  return {
    level,
    fraction: Math.min(1, Math.max(0, (totalBaked - floorAt) / span)),
    remaining: Math.max(0, Math.ceil(nextAt - totalBaked)),
    nextAt,
  }
}
