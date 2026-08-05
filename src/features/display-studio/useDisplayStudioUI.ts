import { useContext } from 'react'
import { DisplayStudioUIContext } from './displayStudioUIContext'

export function useDisplayStudioUI() {
  const ctx = useContext(DisplayStudioUIContext)
  if (!ctx) throw new Error('useDisplayStudioUI must be used within DisplayStudioUIProvider')
  return ctx
}
