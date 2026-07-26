import { useContext } from 'react'
import { TeacherDockContext, type TeacherDockContextValue } from './teacherDockContextValue'

export function useTeacherDockContext(): TeacherDockContextValue {
  const ctx = useContext(TeacherDockContext)
  if (!ctx) {
    throw new Error('useTeacherDockContext must be used within TeacherDockProvider')
  }
  return ctx
}
