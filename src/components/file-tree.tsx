import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, File, Folder, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Input } from './ui/input'
import { Choice, Modal, TextField } from './forms'
import { bytes } from '@/lib/format'
import type { RpcValues, Torrent } from '@/lib/types'

interface TreeNode { name: string; path: string; indices: number[]; children: Map<string, TreeNode> }
function buildTree(torrent: Torrent, search: string) {
  const root: TreeNode = { name: '', path: '', indices: [], children: new Map() }
  torrent.files?.forEach((file, index) => {
    if (!file.name.toLowerCase().includes(search.toLowerCase())) return
    let node = root
    file.name.split('/').forEach((name, part, segments) => {
      if (!node.children.has(name)) node.children.set(name, { name, path: segments.slice(0, part + 1).join('/'), indices: [], children: new Map() })
      node = node.children.get(name)!; node.indices.push(index)
    })
  })
  return root
}
export function FileTree({ torrent, execute, pending }: { torrent: Torrent; execute: (method: string, params: RpcValues) => Promise<unknown>; pending: boolean }) {
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState(new Set<string>())
  const [rename, setRename] = useState<TreeNode | null>(null)
  const [name, setName] = useState('')
  const root = useMemo(() => buildTree(torrent, search), [torrent.files, search])
  const setFiles = (key: string, indices: number[]) => { if (indices.length) void execute('torrent_set', { ids: [torrent.hash_string], [key]: indices }).catch(() => {}) }
  function render(node: TreeNode, depth = 0): React.ReactNode {
    const isFolder = node.children.size > 0
    const wanted = node.indices.filter(i => torrent.file_stats?.[i]?.wanted).length
    const length = node.indices.reduce((sum, i) => sum + (torrent.files?.[i].length ?? 0), 0)
    const completed = node.indices.reduce((sum, i) => sum + (torrent.files?.[i].bytes_completed ?? 0), 0)
    const priorities = new Set(node.indices.map(i => torrent.file_stats?.[i]?.priority ?? 0))
    return <div key={node.path}><div className="file-row" style={{ paddingLeft: depth * 18 + 8 }}><Button size="icon-xs" variant="ghost" disabled={!isFolder} aria-label={`${collapsed.has(node.path) ? '展开' : '收起'} ${node.name}`} onClick={() => setCollapsed(previous => { const next = new Set(previous); if (next.has(node.path)) next.delete(node.path); else next.add(node.path); return next })}>{isFolder ? collapsed.has(node.path) ? <ChevronRight /> : <ChevronDown /> : <File />}</Button><Checkbox disabled={pending} aria-label={`下载 ${node.path}`} checked={wanted === node.indices.length ? true : wanted ? 'indeterminate' : false} onCheckedChange={checked => setFiles(checked ? 'files_wanted' : 'files_unwanted', node.indices)} />{isFolder ? <Folder className="size-4 muted" /> : null}<span className="file-name" title={node.path}>{node.name}</span><span className="file-size">{bytes(length)}</span><span className="file-percent">{length ? Math.round(completed / length * 100) : 100}%</span><div className="file-priority"><Choice label={`${node.name} 优先级`} value={priorities.size > 1 ? 'mixed' : String([...priorities][0])} options={[['mixed', '混合'], ['1', '高'], ['0', '普通'], ['-1', '低']]} onChange={value => { if (value !== 'mixed' && !pending) setFiles(value === '1' ? 'priority_high' : value === '-1' ? 'priority_low' : 'priority_normal', node.indices) }} /></div><Button size="icon-xs" variant="ghost" disabled={pending} aria-label={`重命名 ${node.name}`} onClick={() => { setRename(node); setName(node.name) }}><Pencil /></Button></div>{isFolder && !collapsed.has(node.path) ? [...node.children.values()].map(child => render(child, depth + 1)) : null}</div>
  }
  return <><div className="detail-toolbar"><Input aria-label="搜索文件" placeholder="搜索文件或文件夹…" value={search} onChange={event => setSearch(event.target.value)} className="max-w-sm" /><span className="muted text-xs">{torrent.files?.length ?? 0} 个文件</span></div><div className="file-tree">{[...root.children.values()].map(node => render(node))}</div>{rename ? <Modal title="重命名" description="更改服务器上的文件或文件夹名称。" onClose={() => setRename(null)}><form onSubmit={async event => { event.preventDefault(); if (!name.trim() || /[\\/]/.test(name) || ['.', '..'].includes(name)) { toast.error('名称不能包含路径分隔符'); return } try { await execute('torrent_rename_path', { ids: [torrent.hash_string], path: rename.path, name: name.trim() }); setRename(null) } catch {} }}><TextField label="新名称" required value={name} onChange={event => setName(event.target.value)} /><div className="form-footer"><span /><Button disabled={pending}>保存名称</Button></div></form></Modal> : null}</>
}
