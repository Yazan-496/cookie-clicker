const compact = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 2,
})

// Exact below 100k, compact above it so the layout can't overflow.
export function formatScore(value: number): string {
  if (!Number.isFinite(value)) return '0'
  if (value < 100_000) return Math.floor(value).toLocaleString()
  return compact.format(value)
}
