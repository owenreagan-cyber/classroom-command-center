import { createContext } from 'react'
import type { WidgetCategory } from './studioWidgets'
import type { InspectorSectionId } from './displayStudioTypes'

export interface DisplayStudioUIContextValue {
  isOpen: boolean
  selectedScreenId: string | null
  expandedInspectorSections: InspectorSectionId[]
  widgetLibraryOpen: boolean
  widgetLibraryCategory: WidgetCategory | null
  presenterMode: boolean
  open: () => void
  close: () => void
  selectScreen: (id: string) => void
  toggleInspectorSection: (section: InspectorSectionId) => void
  expandInspectorSection: (section: InspectorSectionId) => void
  collapseInspectorSection: (section: InspectorSectionId) => void
  toggleWidgetLibrary: (category?: WidgetCategory) => void
  closeWidgetLibrary: () => void
  togglePresenterMode: () => void
}

export const DisplayStudioUIContext = createContext<DisplayStudioUIContextValue | null>(null)
