import { useMemo, useState, type ReactNode, type CSSProperties } from 'react'
import { ArrowDownToLine, CheckCheck, CircleAlert, Activity, CircleDashed, Pause, ScanLine, Settings2, Tag, Globe2, Network, Folder, ChevronRight, X, ChartNoAxesCombined, type LucideIcon } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { cn } from '@/lib/utils'
import { bytes, duration, trackerHost } from '@/lib/format'
import { buildDirectoryTree, matchesStatus, withinDirectory, type DirectoryNode, type TaskFilters } from '@/lib/filters'
import { useSidebarWidth } from '@/hooks/use-sidebar-width'
import { readStored, writeStored } from '@/lib/storage'
import type { SessionStats, Torrent } from '@/lib/types'

export const filters = [
  { key: 'all', label: '全部', icon: Network }, { key: 'downloading', label: '下载中', icon: ArrowDownToLine },
  { key: 'paused', label: '已暂停', icon: Pause }, { key: 'completed', label: '已完成', icon: CheckCheck },
  { key: 'checking', label: '校验中', icon: ScanLine }, { key: 'active', label: '活动中', icon: Activity },
  { key: 'inactive', label: '未活动', icon: CircleDashed }, { key: 'error', label: '错误', icon: CircleAlert },
]

function FilterSection({ title, icon: Icon, selected, onClear, children }: { title: string; icon: LucideIcon; selected?: string | null; onClear?: () => void; children: ReactNode }) {
  const [open, setOpen] = useState(() => readStored(`sidebar.${title}`, true))
  return <Collapsible open={open} onOpenChange={value => { setOpen(value); writeStored(`sidebar.${title}`, value) }} className="filter-section">
    <CollapsibleTrigger className="section-trigger" aria-label={`${open ? '收起' : '展开'}${title}`}><Icon /><span>{title}</span>{selected !== undefined && selected !== null ? <Badge variant="secondary">已筛选</Badge> : null}<ChevronRight className={cn('section-chevron', open && 'expanded')} /></CollapsibleTrigger>
    {selected !== undefined && selected !== null ? <div className="section-selection"><span className="truncate" title={selected || '未知目录'}>{selected || '未知目录'}</span><Button size="icon-sm" variant="ghost" aria-label={`清除${title}筛选`} onClick={onClear}><X /></Button></div> : null}
    <CollapsibleContent>{children}</CollapsibleContent>
  </Collapsible>
}

function DirectoryBranch({ node, selected, onSelect }: { node: DirectoryNode; selected: string | null; onSelect: (path: string) => void }) {
  const [open, setOpen] = useState(true)
  const hasChildren = node.children.size > 0
  const activeChild = selected !== null && selected !== node.path && withinDirectory(selected, node.path)
  return <li><Collapsible open={open} onOpenChange={setOpen}>
    <div className={cn('directory-row', selected === node.path && 'active')}>
      {hasChildren ? <CollapsibleTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`${open ? '收起' : '展开'}目录 ${node.path}`}><ChevronRight className={cn(open && 'expanded')} /></Button></CollapsibleTrigger> : <span className="directory-spacer" />}
      <button className="directory-select" title={node.path || '未知目录'} aria-label={`筛选目录 ${node.path || '未知目录'}`} aria-pressed={selected === node.path} onClick={() => onSelect(node.path)}><Folder /><span className="truncate">{node.name}</span>{activeChild ? <span className="filter-dot" title="子目录有选中筛选" /> : null}<span className="nav-count">{node.count}</span></button>
    </div>
    {hasChildren ? <CollapsibleContent><ul className="directory-children">{sortedNodes(node.children).map(child => <DirectoryBranch key={child.path} node={child} selected={selected} onSelect={onSelect} />)}</ul></CollapsibleContent> : null}
  </Collapsible></li>
}
const sortedNodes = (nodes: Map<string, DirectoryNode>) => [...nodes.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN', { numeric: true }))

function SidebarStatistics({ stats, failed, connected, totalSize }: { stats?: SessionStats; failed: boolean; connected: boolean; totalSize: number }) {
  return <FilterSection title="传输统计" icon={ChartNoAxesCombined}>
    {!connected || failed || !stats ? <p className="sidebar-hint">{failed ? '统计暂不可用，稍后重试' : connected ? '正在读取统计…' : '连接后显示统计'}</p> : <>
      <table className="sidebar-stats" aria-label="传输统计"><thead><tr><th scope="col">流量</th><th scope="col">本次</th><th scope="col">累计</th></tr></thead><tbody>{[['downloaded_bytes', '下载'], ['uploaded_bytes', '上传']].map(([key, label]) => <tr key={key}><th scope="row">{label}</th><td>{bytes(Number(stats.current_stats?.[key]))}</td><td>{bytes(Number(stats.cumulative_stats?.[key]))}</td></tr>)}</tbody></table>
      <dl className="sidebar-stat-summary"><div><dt>任务总大小</dt><dd>{bytes(totalSize)}</dd></div><div><dt>本次运行</dt><dd>{duration(Number(stats.current_stats?.seconds_active))}</dd></div></dl>
    </>}
  </FilterSection>
}

export function Sidebar({ torrents, filter, onFilter, onSettings, connected, open, stats, statsFailed }: { torrents: Torrent[]; filter: TaskFilters; onFilter: (filter: TaskFilters) => void; onSettings: () => void; connected: boolean; open: boolean; stats?: SessionStats; statsFailed: boolean }) {
  const resize = useSidebarWidth()
  const { labels, trackers, directories, counts, totalSize } = useMemo(() => {
    const labels = new Map<string, number>(), trackers = new Map<string, number>()
    const counts = Object.fromEntries(filters.map(item => [item.key, 0]))
    let totalSize = 0
    for (const torrent of torrents) {
      for (const label of new Set(torrent.labels ?? [])) labels.set(label, (labels.get(label) ?? 0) + 1)
      for (const host of new Set(torrent.trackers?.map(tracker => trackerHost(tracker.announce)) ?? [])) trackers.set(host, (trackers.get(host) ?? 0) + 1)
      for (const item of filters) if (matchesStatus(torrent, item.key)) counts[item.key]++
      totalSize += torrent.total_size
    }
    return { labels: [...labels].sort(), trackers: [...trackers].sort(), directories: buildDirectoryTree(torrents), counts, totalSize }
  }, [torrents])
  const select = (key: 'label' | 'tracker' | 'directory', value: string) => onFilter({ ...filter, [key]: filter[key] === value ? null : value })
  return <aside className={cn('sidebar', open && 'sidebar-open')} style={{ '--sidebar-width': `${resize.width}px` } as CSSProperties}>
    <div className="brand"><div className="brand-mark"><Network /></div><span>Cove<span className="brand-subtitle">TRANSMISSION UI</span></span></div>
    <div className="sidebar-scroll"><div className="sidebar-heading">任务库</div>
      <nav aria-label="任务筛选">{filters.map(item => <button key={item.key} className={cn('nav-item', filter.status === item.key && 'active')} aria-pressed={filter.status === item.key} onClick={() => onFilter({ ...filter, status: item.key })}><item.icon className={`status-${item.key}`} /><span>{item.label}</span><span className="nav-count">{counts[item.key]}</span></button>)}</nav>
      <Separator className="my-3" />
      <FilterSection title="目录分布" icon={Folder} selected={filter.directory} onClear={() => onFilter({ ...filter, directory: null })}><ul aria-label="目录筛选" className="directory-tree">{sortedNodes(directories).map(node => <DirectoryBranch key={node.path} node={node} selected={filter.directory} onSelect={path => select('directory', path)} />)}</ul>{!directories.size ? <p className="sidebar-hint">暂无下载目录</p> : null}</FilterSection>
      <FilterSection title="标签" icon={Tag} selected={filter.label} onClear={() => onFilter({ ...filter, label: null })}><nav aria-label="标签筛选">{labels.map(([label, count]) => <button key={label} className={cn('nav-item', filter.label === label && 'active')} aria-pressed={filter.label === label} onClick={() => select('label', label)}><span className="label-dot" /><span className="truncate">{label}</span><span className="nav-count">{count}</span></button>)}</nav>{!labels.length ? <p className="sidebar-hint">选择任务后可添加标签</p> : null}</FilterSection>
      <FilterSection title="Tracker" icon={Globe2} selected={filter.tracker} onClear={() => onFilter({ ...filter, tracker: null })}><nav aria-label="Tracker 筛选">{trackers.map(([host, count]) => <button key={host} className={cn('nav-item', filter.tracker === host && 'active')} aria-pressed={filter.tracker === host} onClick={() => select('tracker', host)}><span className="tracker-dot" /><span className="truncate" title={host}>{host}</span><span className="nav-count">{count}</span></button>)}</nav>{!trackers.length ? <p className="sidebar-hint">暂无 Tracker</p> : null}</FilterSection>
      <Separator className="my-3" /><SidebarStatistics stats={stats} failed={statsFailed} connected={connected} totalSize={totalSize} />
    </div>
    <div className="sidebar-footer"><Button variant="ghost" className="w-full justify-start" disabled={!connected} onClick={onSettings}><Settings2 data-icon="inline-start" />设置</Button></div>
    <div className="sidebar-resizer" role="separator" aria-label="调整侧栏宽度" aria-orientation="vertical" aria-valuemin={200} aria-valuemax={460} aria-valuenow={resize.width} tabIndex={0} onPointerDown={resize.start} onPointerMove={resize.move} onDoubleClick={() => resize.update(256)} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); resize.update(event.key === 'Home' ? 200 : event.key === 'End' ? 460 : resize.width + (event.key === 'ArrowRight' ? 10 : -10)) } }} />
  </aside>
}
