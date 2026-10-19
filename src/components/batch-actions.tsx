import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpToLine, ChevronsRight, FolderInput, MoreHorizontal, Pause, Play, Radio, ScanLine, Tag, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'

const actions = [
  { name: 'torrent_start', label: '开始', icon: Play, priority: 'essential' },
  { name: 'torrent_stop', label: '暂停', icon: Pause, priority: 'essential' },
  { name: 'remove', label: '删除', ariaLabel: '删除选中任务', icon: Trash2, priority: 'essential' },
  { name: 'torrent_verify', label: '校验', ariaLabel: '重新校验', icon: ScanLine, priority: 'essential' },
  { name: 'torrent_start_now', label: '立即开始', icon: ChevronsRight, priority: 'secondary' },
  { name: 'torrent_reannounce', label: '通告', ariaLabel: '重新通告', icon: Radio, priority: 'secondary' },
  { name: 'location', label: '下载目录', ariaLabel: '更改下载目录', icon: FolderInput, priority: 'secondary' },
  { name: 'labels', label: '标签', ariaLabel: '编辑标签', icon: Tag, priority: 'secondary' },
  { name: 'queue_move_top', label: '队首', ariaLabel: '移到队首', icon: ArrowUpToLine, priority: 'queue' },
  { name: 'queue_move_up', label: '上移', icon: ArrowUp, priority: 'queue' },
  { name: 'queue_move_down', label: '下移', icon: ArrowDown, priority: 'queue' },
  { name: 'queue_move_bottom', label: '队尾', ariaLabel: '移到队尾', icon: ArrowDownToLine, priority: 'queue' },
]

export function BatchActions({ disabled, onAction }: { disabled: boolean; onAction: (action: string) => void }) {
  const container = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const element = container.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const visible = actions.filter(action => action.priority === 'essential' || width >= (action.priority === 'queue' ? 1050 : 700))
  const overflow = actions.filter(action => !visible.includes(action))
  return <div ref={container} className="selection-actions" role="group" aria-label="任务操作">
    {visible.map(({ name, label, ariaLabel, icon: Icon }) => <Button key={name} variant="outline" size="sm" aria-label={ariaLabel} title={ariaLabel} disabled={disabled} onClick={() => onAction(name)}><Icon data-icon="inline-start" />{label}</Button>)}
    {overflow.length ? <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm" aria-label="更多批量操作" disabled={disabled}><MoreHorizontal data-icon="inline-start" />更多</Button></DropdownMenuTrigger>
      <DropdownMenuContent align="start"><DropdownMenuGroup>{overflow.map(({ name, label, ariaLabel, icon: Icon }) => <DropdownMenuItem key={name} onSelect={() => onAction(name)}><Icon />{ariaLabel ?? label}</DropdownMenuItem>)}</DropdownMenuGroup></DropdownMenuContent>
    </DropdownMenu> : null}
  </div>
}
