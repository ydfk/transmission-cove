import { useState, type PointerEvent } from 'react'
import { readStored, writeStored } from '@/lib/storage'

export function useSidebarWidth() {
  const [width, setWidth] = useState(() => {
    const stored = readStored('sidebar.width', 256)
    return typeof stored === 'number' && Number.isFinite(stored) ? Math.min(460, Math.max(200, stored)) : 256
  })
  function update(value: number) {
    const next = Math.min(460, Math.max(200, value))
    setWidth(next); writeStored('sidebar.width', next)
  }
  function start(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId)
  }
  function move(event: PointerEvent<HTMLElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) update(event.clientX)
  }
  return { width, update, start, move }
}
