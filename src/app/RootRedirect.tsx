import { useEffect } from 'react'
import { redirectRootToControl } from './appRoute'

/** Sends `/` and other unknown paths to the teacher control route. */
export function RootRedirect() {
  useEffect(() => {
    redirectRootToControl()
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, [])

  return null
}
