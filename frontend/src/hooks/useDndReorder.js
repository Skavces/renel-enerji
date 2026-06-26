import { useSensors, useSensor, PointerSensor } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'

export function useDndReorder(items, setItems, reorderFn, setSaving) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  async function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)
    setSaving?.(true)
    try {
      await reorderFn(reordered.map((item) => item.id))
    } catch {
      // UI güncel kalır, sessizce geç
    } finally {
      setSaving?.(false)
    }
  }

  return { sensors, handleDragEnd }
}
