import { trackerHost } from './format'
import type { Torrent } from './types'

export interface TaskFilters { status: string; label: string | null; tracker: string | null; directory: string | null }
export const emptyFilters: TaskFilters = { status: 'all', label: null, tracker: null, directory: null }

export function matchesStatus(torrent: Torrent, status: string) {
  switch (status) {
    case 'downloading': return [3, 4].includes(torrent.status)
    case 'paused': return torrent.status === 0
    case 'completed': return torrent.percent_done >= 1
    case 'checking': return [1, 2].includes(torrent.status)
    case 'active': return torrent.rate_download > 0 || torrent.rate_upload > 0
    case 'inactive': return torrent.status !== 0 && torrent.rate_download === 0 && torrent.rate_upload === 0
    case 'error': return torrent.error > 0
    default: return true
  }
}
export function normalizeDirectory(path: string) {
  const normalized = path.replace(/\\/g, '/').replace(/\/{2,}/g, '/')
  return normalized === '/' ? '/' : normalized.replace(/\/$/, '')
}
export function withinDirectory(path: string, parent: string) {
  const normalized = normalizeDirectory(path)
  return normalized === parent || (parent !== '' && normalized.startsWith(parent === '/' ? '/' : `${parent}/`))
}
export function matches(torrent: Torrent, filters: TaskFilters) {
  return matchesStatus(torrent, filters.status)
    && (filters.label === null || torrent.labels?.includes(filters.label))
    && (filters.tracker === null || torrent.trackers?.some(t => trackerHost(t.announce) === filters.tracker))
    && (filters.directory === null || withinDirectory(torrent.download_dir ?? '', filters.directory))
}
export interface DirectoryNode { path: string; name: string; count: number; children: Map<string, DirectoryNode> }
export function buildDirectoryTree(torrents: Torrent[]) {
  const roots = new Map<string, DirectoryNode>()
  for (const torrent of torrents) {
    const path = normalizeDirectory(torrent.download_dir ?? '')
    const parts = path.split('/').filter(Boolean)
    if (!parts.length) parts.push(path || '未知目录')
    let children = roots
    let prefix = path.startsWith('/') && path !== '/' ? '/' : ''
    parts.forEach((part, index) => {
      prefix += `${index ? '/' : ''}${part}`
      const key = path === '' ? '' : prefix
      let node = children.get(key)
      if (!node) { node = { path: key, name: part, count: 0, children: new Map() }; children.set(key, node) }
      node.count++
      children = node.children
    })
  }
  // 若存在直接下载到根目录的任务，根节点也必须包含所有绝对路径子树。
  const root = roots.get('/')
  if (root) for (const [path, node] of roots) {
    if (path !== '/' && path.startsWith('/')) { root.children.set(path, node); root.count += node.count; roots.delete(path) }
  }
  return roots
}
