import { createContext } from 'react'
import type { WidgetCategory } from './studioWidgets'
import type { InspectorSectionId } from './displayStudioTypes'

export interface DisplayStudioUIContextValue {
  isOpen: boolean
  selectedScreenId: string | null
  selectedWidgetId: string | null
  expandedInspectorSections: InspectorSectionId[]
  widgetLibraryOpen: boolean
  widgetLibraryCategory: WidgetCategory | null
  /** Phase 15G: Template gallery mode (replaces inspector area). */
  templatePickerOpen: boolean
  /** Phase 15G: Quick Start panel visibility. */
  quickStartOpen: boolean
  presenterMode: boolean
  open: () => void
  close: () => void
  selectScreen: (id: string) => void
  selectWidget: (id: string | null) => void
  toggleInspectorSection: (section: InspectorSectionId) => void
  expandInspectorSection: (section: InspectorSectionId) => void
  collapseInspectorSection: (section: InspectorSectionId) => void
  toggleWidgetLibrary: (category?: WidgetCategory) => void
  closeWidgetLibrary: () => void
  /** Phase 15G: Open/close the template gallery. */
  toggleTemplatePicker: () => void
  closeTemplatePicker: () => void
  /** Phase 15G: Open/close the quick start panel. */
  toggleQuickStart: () => void
  closeQuickStart: () => void
  togglePresenterMode: () => void
}

export const DisplayStudioUIContext = createContext<DisplayStudioUIContextValue | null>(null)
