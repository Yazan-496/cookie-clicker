import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'cookie-clicker:theme'

export type Theme = 'system' | 'light' | 'dark'

function load(): Theme {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system'
  } catch {
    return 'system'
  }
}

/**
 * Three states, not two. "system" is the default so the app matches whatever
 * the device is already doing; an explicit choice stamps data-theme on the
 * root and wins over the media query in both directions.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(load)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', theme)
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* storage blocked */
    }
  }, [theme])

  const cycle = useCallback(() => {
    setTheme((current) =>
      current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system',
    )
  }, [])

  return { theme, setTheme, cycle }
}
