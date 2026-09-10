const compact = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 2,
})

/**
 * Keeps the score readable at any magnitude. Exact below 100k (players want to
 * see every cookie early on), compact above it so the layout can't overflow.
 */
export function formatScore(value: number): string {
  if (!Number.isFinite(value)) return '0'
  if (value < 100_000) return Math.floor(value).toLocaleString()
  return compact.format(value)
}
