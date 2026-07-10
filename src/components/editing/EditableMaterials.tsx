import type { AppMode, MaterialsLists } from '../../data/types'
import { EditableList } from './EditableList'

interface EditableMaterialsProps {
  mode: AppMode
  materials: MaterialsLists
  onChange: (materials: MaterialsLists) => void
}

export function EditableMaterials({
  mode,
  materials,
  onChange,
}: EditableMaterialsProps) {
  if (mode !== 'edit') return null

  return (
    <div className="grid w-full gap-3 md:grid-cols-2">
      <EditableList
        mode={mode}
        label="Have Out"
        items={materials.haveOut}
        onChange={(haveOut) => onChange({ ...materials, haveOut })}
        helperText="Student-facing list of materials to keep on the desk."
      />
      <EditableList
        mode={mode}
        label="Put Away"
        items={materials.putAway}
        onChange={(putAway) => onChange({ ...materials, putAway })}
        helperText="Student-facing list of materials to clear from the desk."
      />
    </div>
  )
}
