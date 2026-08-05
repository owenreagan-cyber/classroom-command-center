import { useState, useCallback, useMemo, type ReactNode } from 'react'
import type { WidgetCategory } from './studioWidgets'
import type { InspectorSectionId } from './displayStudioTypes'
import { DisplayStudioUIContext, type DisplayStudioUIContextValue } from './displayStudioUIContext'

const DEFAULT_EXPANDED_SECTIONS: InspectorSectionId[] = ['screen']

export function DisplayStudioUIProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null)
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null)
  const [expandedInspectorSections, setExpandedInspectorSections] = useState<InspectorSectionId[]>(
    DEFAULT_EXPANDED_SECTIONS,
  )
  const [widgetLibraryOpen, setWidgetLibraryOpen] = useState(false)
  const [widgetLibraryCategory, setWidgetLibraryCategory] = useState<WidgetCategory | null>(null)
  const [presenterMode, setPresenterMode] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => {
    setIsOpen(false)
    setSelectedWidgetId(null)
  }, [])

  const selectScreen = useCallback((id: string) => {
    setSelectedScreenId(id)
    setSelectedWidgetId(null)
  }, [])

  const selectWidget = useCallback((id: string | null) => {
    setSelectedWidgetId(id)
  }, [])

  const toggleInspectorSection = useCallback((section: InspectorSectionId) => {
    setExpandedInspectorSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section],
    )
  }, [])

  const expandInspectorSection = useCallback((section: InspectorSectionId) => {
    setExpandedInspectorSections((prev) => (prev.includes(section) ? prev : [...prev, section]))
  }, [])

  const collapseInspectorSection = useCallback((section: InspectorSectionId) => {
    setExpandedInspectorSections((prev) => prev.filter((s) => s !== section))
  }, [])

  const toggleWidgetLibrary = useCallback((category?: WidgetCategory) => {
    setWidgetLibraryOpen((prev) => {
      const next = !prev
      if (next && category) setWidgetLibraryCategory(category)
      if (!next) setWidgetLibraryCategory(null)
      return next
    })
    if (category) setWidgetLibraryCategory(category)
  }, [])

  const closeWidgetLibrary = useCallback(() => {
    setWidgetLibraryOpen(false)
    setWidgetLibraryCategory(null)
  }, [])

  const togglePresenterMode = useCallback(() => {
    setPresenterMode((prev) => !prev)
  }, [])

  const value = useMemo<DisplayStudioUIContextValue>(
    () => ({
      isOpen,
      selectedScreenId,
      selectedWidgetId,
      expandedInspectorSections,
      widgetLibraryOpen,
      widgetLibraryCategory,
      presenterMode,
      open,
      close,
      selectScreen,
      selectWidget,
      toggleInspectorSection,
      expandInspectorSection,
      collapseInspectorSection,
      toggleWidgetLibrary,
      closeWidgetLibrary,
      togglePresenterMode,
    }),
    [
      isOpen,
      selectedScreenId,
      selectedWidgetId,
      expandedInspectorSections,
      widgetLibraryOpen,
      widgetLibraryCategory,
      presenterMode,
      open,
      close,
      selectScreen,
      selectWidget,
      toggleInspectorSection,
      expandInspectorSection,
      collapseInspectorSection,
      toggleWidgetLibrary,
      closeWidgetLibrary,
      togglePresenterMode,
    ],
  )

  return <DisplayStudioUIContext.Provider value={value}>{children}</DisplayStudioUIContext.Provider>
}
