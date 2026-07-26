import { type ReactNode } from 'react'
import { TeacherDockContext, type TeacherDockContextValue } from './teacherDockContextValue'

export type { TeacherDockContextValue } from './teacherDockContextValue'

export function TeacherDockProvider({
  value,
  children,
}: {
  value: TeacherDockContextValue
  children: ReactNode
}) {
  return (
    <TeacherDockContext.Provider value={value}>{children}</TeacherDockContext.Provider>
  )
}
