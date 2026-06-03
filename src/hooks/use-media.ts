import { useSyncExternalStore } from 'react'

const DESKTOP_QUERY = '(min-width: 768px)'

function subscribe(cb: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY)
  mql.addEventListener('change', cb)
  return () => mql.removeEventListener('change', cb)
}

function getSnapshot() {
  return window.matchMedia(DESKTOP_QUERY).matches
}

function getServerSnapshot() {
  return true // SSR fallback — doesn't matter since we deploy as SPA
}

/** Returns true when the viewport is >= 768px (desktop layout) */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
