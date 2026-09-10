// Emoji were the shortcut, but they render differently per platform, bring
// their own colours, and never optically align. These share a 24x24 grid and
// stroke weight.

const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function CookieIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="9.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="15" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="14.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function BakeryIcon() {
  return (
    <svg {...base}>
      <path d="M4.5 8h15l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H7.2a1.5 1.5 0 0 1-1.5-1.3L4.5 8Z" />
      <path d="M8.8 8V6.4a3.2 3.2 0 0 1 6.4 0V8" />
    </svg>
  )
}

export function BoardIcon() {
  return (
    <svg {...base}>
      <rect x="3.5" y="13" width="4.5" height="7.5" rx="1" />
      <rect x="9.75" y="8" width="4.5" height="12.5" rx="1" />
      <rect x="16" y="11" width="4.5" height="9.5" rx="1" />
      <path d="M12 5.6 12.9 3l.9 2.6 2.6.2-2 1.7.6 2.5-2.1-1.4-2.1 1.4.6-2.5-2-1.7 2.6-.2Z" />
    </svg>
  )
}

export function ProfileIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M4.8 20.2a7.4 7.4 0 0 1 14.4 0" />
    </svg>
  )
}
