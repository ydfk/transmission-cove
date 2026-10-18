import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ArrowDown, ArrowUp, ArrowUpDown, FileBox, MoreHorizontal } from 'lucide-react'
import { Checkbox } from './ui/checkbox'
import { Button } from './ui/button'
import { ContextMenu, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuTrigger } from './ui/context-menu'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Progress } from './ui/progress'
import { TorrentStatusIcon } from './torrent-status-icon'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './ui/empty'
import { bytes, duration, ratio, speed, statusText } from '@/lib/format'
import { cn } from '@/lib/utils'
import { readStored, writeStored } from '@/lib/storage'
import type { Torrent } from '@/lib/types'

export const columns = [
  { key: 'name', label: '任务名称', width: 280, sorts: [['name', '任务名称']] },
  { key: 'percent_done', label: '进度 / 大小', width: 168, sorts: [['percent_done', '进度'], ['total_size', '大小']] },
  { key: 'rate_download', label: '下载 / 上传', width: 150, sorts: [['rate_download', '下载'], ['rate_upload', '上传']] },
  { key: 'upload_ratio', label: '分享率 / Peers', width: 120, sorts: [['upload_ratio', '分享率'], ['peers_connected', 'Peers']] },
  { key: 'eta', label: '剩余时间', width: 100, sorts: [['eta', '剩余时间']] },
  { key: 'queue_position', label: '队列', width: 76, sorts: [['queue_position', '队列']] },
]
export const actionItems = [['torrent_start', '开始'], ['torrent_stop', '暂停'], ['torrent_start_now', '立即开始'], ['torrent_verify', '重新校验'], ['torrent_reannounce', '重新通告'], ['queue_move_top', '移到队首'], ['queue_move_up', '上移'], ['queue_move_down', '下移'], ['queue_move_bottom', '移到队尾'], ['location', '更改下载目录'], ['labels', '编辑标签'], ['remove', '删除任务']] as const
export type Sort = { key: string; descending: boolean }

function Cell({ column, torrent }: { column: string; torrent: Torrent }) {
  if (column === 'name') return <div className="name-cell"><TorrentStatusIcon torrent={torrent} /><div className="min-w-0"><div className="torrent-name" title={torrent.name}>{torrent.name}</div><div className={cn('torrent-meta', torrent.error && 'text-destructive')}><span>{statusText(torrent.status, torrent.error)}</span>{torrent.labels?.slice(0, 2).map(label => <span key={label} className="task-label">{label}</span>)}</div><div className="mobile-transfer"><span className="download-text">↓ {speed(torrent.rate_download)}</span><span className="upload-text">↑ {speed(torrent.rate_upload)}</span></div></div></div>
  if (column === 'percent_done') return <div className={cn('progress-cell', torrent.status === 6 && 'is-seeding')}><div className="progress-summary"><span>{(torrent.percent_done * 100).toFixed(1)}%</span><span className="size-summary">{bytes(torrent.total_size)}</span></div><Progress value={torrent.percent_done * 100} aria-label={`${torrent.name} 下载进度`} /></div>
  if (column === 'total_size') return bytes(torrent.total_size)
  if (column === 'rate_download') return <div className="transfer-cell"><span className="download-text" title="下载速度"><ArrowDown />{speed(torrent.rate_download)}</span><span className="upload-text" title="上传速度"><ArrowUp />{speed(torrent.rate_upload)}</span></div>
  if (column === 'upload_ratio') return <div className="ratio-cell"><span>{ratio(torrent.upload_ratio)}</span><span className="muted">{torrent.peers_connected} Peers</span></div>
  if (column === 'eta') return duration(torrent.eta)
  return String(torrent[column] ?? '—')
}

export function TorrentTable({ torrents, selected, onSelect, onFocus, focused, sort, onSort, visible, onAction, disabled }: { torrents: Torrent[]; selected: Set<string>; onSelect: (selection: Set<string>) => void; onFocus: (hash: string) => void; focused: string | null; sort: Sort; onSort: (sort: Sort) => void; visible: string[]; onAction: (action: string, hashes: string[]) => void; disabled: boolean }) {
  const container = useRef<HTMLDivElement>(null)
  const anchor = useRef<number | null>(null)
  const [widths, setWidths] = useState<Record<string, number>>(() => readStored('columns.compact.widths', {}))
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches)
  useEffect(() => { const media = window.matchMedia('(max-width: 760px)'); const change = () => setMobile(media.matches); media.addEventListener('change', change); return () => media.removeEventListener('change', change) }, [])
  const activeColumns = columns.filter(column => column.key === 'name' || (mobile ? column.key === 'percent_done' : visible.includes(column.key)))
  const virtual = useVirtualizer({ count: torrents.length, getScrollElement: () => container.current, estimateSize: () => mobile ? 70 : 48, overscan: 8 })
  useEffect(() => { virtual.measure() }, [mobile, virtual])
  const minWidth = mobile ? 0 : 76 + activeColumns.reduce((sum, column) => sum + (widths[column.key] ?? column.width), 0)
  const grid = `36px ${activeColumns.map(column => column.key === 'name' ? `minmax(${widths[column.key] ?? column.width}px, 1fr)` : `${widths[column.key] ?? column.width}px`).join(' ')} 40px`
  const style = { gridTemplateColumns: mobile ? '32px minmax(0, 1fr) 62px 32px' : grid, minWidth } as CSSProperties
  const shownSelected = torrents.filter(t => selected.has(t.hash_string)).length
  function choose(index: number, shift: boolean, toggle: boolean) {
    const next = toggle || shift ? new Set(selected) : new Set<string>()
    const torrent = torrents[index]
    if (shift && anchor.current !== null) for (let i = Math.min(anchor.current, index); i <= Math.max(anchor.current, index); i++) { if (torrents[i]) next.add(torrents[i].hash_string) }
    else if (toggle && next.has(torrent.hash_string)) next.delete(torrent.hash_string)
    else next.add(torrent.hash_string)
    anchor.current = index; onSelect(next); onFocus(torrent.hash_string)
  }
  function resize(event: React.PointerEvent, key: string, initial: number) {
    event.preventDefault(); event.stopPropagation()
    const start = event.clientX
    const move = (moveEvent: PointerEvent) => setWidths(previous => ({ ...previous, [key]: Math.max(key === 'name' ? 220 : 76, initial + moveEvent.clientX - start) }))
    const end = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', end); setWidths(previous => { writeStored('columns.compact.widths', previous); return previous }) }
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', end)
  }
  if (!torrents.length) return <Empty className="flex-1"><EmptyHeader><EmptyMedia variant="icon"><FileBox /></EmptyMedia><EmptyTitle>没有匹配的任务</EmptyTitle><EmptyDescription>尝试清除筛选条件，或添加一个下载任务。</EmptyDescription></EmptyHeader></Empty>
  return <div className="torrent-scroll" ref={container} role="table" aria-label="下载任务" aria-rowcount={torrents.length + 1}>
    <div className="torrent-header" role="row" style={style}><div role="columnheader"><Checkbox aria-label="选择当前页任务" checked={shownSelected === torrents.length ? true : shownSelected ? 'indeterminate' : false} onCheckedChange={checked => { const next = new Set(selected); torrents.forEach(t => checked ? next.add(t.hash_string) : next.delete(t.hash_string)); onSelect(next) }} /></div>
      {activeColumns.map(column => <div key={column.key} role="columnheader" aria-sort={column.sorts.some(([key]) => key === sort.key) ? sort.descending ? 'descending' : 'ascending' : 'none'} className="column-heading"><div className="column-sorts">{column.sorts.map(([key, label]) => <button key={key} aria-label={`按${label}排序`} onClick={() => onSort({ key, descending: sort.key === key ? !sort.descending : true })}>{label}{sort.key === key ? sort.descending ? <ArrowDown /> : <ArrowUp /> : <ArrowUpDown className="sort-idle" />}</button>)}</div><span className="column-resize" onPointerDown={event => resize(event, column.key, widths[column.key] ?? column.width)} /></div>)} <div role="columnheader" aria-label="操作" />
    </div>
    <div style={{ height: virtual.getTotalSize(), position: 'relative', minWidth }} role="rowgroup">
      {virtual.getVirtualItems().map(item => {
        const torrent = torrents[item.index]
        const targets = selected.has(torrent.hash_string) ? [...selected] : [torrent.hash_string]
        return <ContextMenu key={torrent.hash_string}><ContextMenuTrigger asChild><div role="row" aria-rowindex={item.index + 2} aria-selected={selected.has(torrent.hash_string)} tabIndex={0} className={cn('torrent-row', selected.has(torrent.hash_string) && 'is-selected', focused === torrent.hash_string && 'is-focused')} style={{ ...style, position: 'absolute', top: item.start, height: item.size }} onClick={event => choose(item.index, event.shiftKey, event.ctrlKey || event.metaKey)} onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); choose(item.index, event.shiftKey, event.ctrlKey || event.metaKey) } }}>
          <div role="cell" onClick={event => event.stopPropagation()}><Checkbox aria-label={`选择 ${torrent.name}`} checked={selected.has(torrent.hash_string)} onCheckedChange={() => choose(item.index, false, true)} /></div>
          {activeColumns.map(column => <div key={column.key} role="cell"><Cell column={column.key} torrent={torrent} /></div>)}
          <div role="cell" onClick={event => event.stopPropagation()}><DropdownMenu><DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost" aria-label={`${torrent.name} 操作`}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuGroup>{actionItems.map(([action, label]) => <DropdownMenuItem key={action} disabled={disabled} onSelect={() => onAction(action, targets)}>{label}</DropdownMenuItem>)}</DropdownMenuGroup></DropdownMenuContent></DropdownMenu></div>
        </div></ContextMenuTrigger><ContextMenuContent><ContextMenuGroup>{actionItems.map(([action, label]) => <ContextMenuItem key={action} disabled={disabled} onSelect={() => onAction(action, targets)}>{label}</ContextMenuItem>)}</ContextMenuGroup></ContextMenuContent></ContextMenu>
      })}
    </div>
  </div>
}
