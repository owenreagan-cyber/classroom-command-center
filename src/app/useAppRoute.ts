import { useSyncExternalStore } from 'react'
import { getAppRoute, type AppRoute } from './appRoute'

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener('popstate', onStoreChange)
  return () => window.removeEventListener('popstate', onStoreChange)
}

function getSnapshot(): AppRoute {
  return getAppRoute(window.location.pathname)
}

function getServerSnapshot(): AppRoute {
  return 'root'
}

export function useAppRoute(): AppRoute {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
