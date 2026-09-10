export type Tab = 'bake' | 'shop' | 'board' | 'profile'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
  /** Shown as a dot on the shop tab when something is affordable. */
  shopAlert?: boolean
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'bake', label: 'Bake', icon: '🍪' },
  { id: 'shop', label: 'Bakery', icon: '🛒' },
  { id: 'board', label: 'Board', icon: '🏆' },
  { id: 'profile', label: 'Profile', icon: '👤' },
]

export function TabBar({ active, onChange, shopAlert }: Props) {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`tab ${active === tab.id ? 'is-active' : ''}`}
          onClick={() => onChange(tab.id)}
          aria-current={active === tab.id ? 'page' : undefined}
        >
          <span className="tab-icon" aria-hidden="true">
            {tab.icon}
            {tab.id === 'shop' && shopAlert && <span className="tab-dot" />}
          </span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
