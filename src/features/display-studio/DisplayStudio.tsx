import { useDisplayStudioUI } from './useDisplayStudioUI'
import { DisplayStudioShell } from './DisplayStudioShell'
import { DisplayStudioThumbnailRail } from './DisplayStudioThumbnailRail'
import { DisplayStudioCanvas } from './DisplayStudioCanvas'
import { DisplayStudioInspector } from './DisplayStudioInspector'
import { DisplayStudioWidgetLibrary } from './DisplayStudioWidgetLibrary'
import { DisplayStudioTemplatePicker } from './DisplayStudioTemplatePicker'
import { DisplayStudioCommandBar } from './DisplayStudioCommandBar'
import { DisplayStudioPresenter } from './DisplayStudioPresenter'
import { DisplayStudioQuickStart } from './DisplayStudioQuickStart'

/**
 * Display Studio — PowerPoint/Classroomscreen-style classroom display builder.
 *
 * Must be mounted inside a DisplayStudioUIProvider (provided by TeacherControlShell).
 * Opens as a full-screen overlay when isOpen is true in the display studio UI context.
 */
export function DisplayStudio() {
  const { isOpen } = useDisplayStudioUI()

  if (!isOpen) return null

  return (
    <>
      <DisplayStudioShell
        leftRail={<DisplayStudioThumbnailRail />}
        canvas={<DisplayStudioCanvas />}
        inspector={<DisplayStudioInspector />}
        commandBar={<DisplayStudioCommandBar />}
        widgetLibrary={<DisplayStudioWidgetLibrary />}
        templatePicker={<DisplayStudioTemplatePicker />}
        quickStart={<DisplayStudioQuickStart />}
      />
      <DisplayStudioPresenter />
    </>
  )
}
