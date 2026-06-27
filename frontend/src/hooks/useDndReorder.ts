import { useSensors, useSensor, PointerSensor } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'

export function useDndReorder<T extends { id: string }>(
  items: T[],
  setItems: (items: T[]) => void,
  reorderFn: (orderedIds: string[]) => Promise<void>,
  setSaving?: (saving: boolean) => void,
) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  async function handleDragEnd({ active, over }: { active: { id: string }; over: { id: string } | null }) {
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
