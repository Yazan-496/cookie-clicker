import type { JSX } from 'react'
import { BakeryIcon, BoardIcon, CookieIcon, ProfileIcon } from './icons'

export type Tab = 'bake' | 'shop' | 'board' | 'profile'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
  /** Shown as a dot on the shop tab when something is affordable. */
  shopAlert?: boolean
}

const TABS: { id: Tab; label: string; Icon: () => JSX.Element }[] = [
  { id: 'bake', label: 'Bake', Icon: CookieIcon },
  { id: 'shop', label: 'Bakery', Icon: BakeryIcon },
  { id: 'board', label: 'Board', Icon: BoardIcon },
  { id: 'profile', label: 'Profile', Icon: ProfileIcon },
]

export function TabBar({ active, onChange, shopAlert }: Props) {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`tab ${active === id ? 'is-active' : ''}`}
          onClick={() => onChange(id)}
          aria-current={active === id ? 'page' : undefined}
        >
          <span className="tab-icon">
            <Icon />
            {id === 'shop' && shopAlert && <span className="tab-dot" />}
          </span>
          <span className="tab-label">{label}</span>
        </button>
      ))}
    </nav>
  )
}
