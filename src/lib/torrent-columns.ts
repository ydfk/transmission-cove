import type { Torrent, Tracker } from './types'

export const columns = [
  { key: 'name', label: '任务名称', width: 280 },
  { key: 'total_size', label: '总大小', width: 100 },
  { key: 'have_valid', label: '有效数据', width: 100 },
  { key: 'downloaded_ever', label: '已下载', width: 100 },
  { key: 'uploaded_ever', label: '已上传', width: 100 },
  { key: 'percent_done', label: '进度', width: 168 },
  { key: 'rate_download', label: '下载速度', width: 130 },
  { key: 'rate_upload', label: '上传速度', width: 130 },
  { key: 'status', label: '状态', width: 100 },
  { key: 'added_date', label: '添加时间', width: 180 },
  { key: 'seeders', label: '种子数', width: 100 },
  { key: 'leechers', label: '下载者数', width: 100 },
  { key: 'upload_ratio', label: '分享率', width: 120 },
  { key: 'bandwidth_priority', label: '优先级', width: 90 },
  { key: 'labels', label: '用户标签', width: 160 },
  { key: 'seconds_seeding', label: '做种时长', width: 140 },
  { key: 'eta', label: '剩余时间', width: 110 },
  { key: 'peers_connected', label: '连接数', width: 90 },
  { key: 'queue_position', label: '队列', width: 76 },
  { key: 'download_dir', label: '下载目录', width: 240 },
  { key: 'done_date', label: '完成时间', width: 180 },
]

export const compactColumns = ['percent_done', 'rate_download', 'upload_ratio', 'eta']
export const fullColumns = columns.slice(1, 16).map(column => column.key)
export function validColumns(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((key): key is string => typeof key === 'string' && key !== 'name' && columns.some(column => column.key === key)))] : [...fullColumns]
}

// 不同 Tracker 可能统计同一群体，取最大报告值而不是累加；负数代表未知。
export function trackerCount(trackers: Tracker[] | undefined, key: 'seeder_count' | 'leecher_count'): number | undefined {
  const values = trackers?.map(tracker => tracker[key]).filter(value => typeof value === 'number' && Number.isFinite(value) && value >= 0) ?? []
  return values.length ? Math.max(...values) : undefined
}

export function columnValue(torrent: Torrent, key: string): unknown {
  if (key === 'seeders' || key === 'leechers') return trackerCount(torrent.tracker_stats, key === 'seeders' ? 'seeder_count' : 'leecher_count')
  if (key === 'status') return torrent.error ? 8 : torrent.status
  if (key === 'labels') return torrent.labels?.join(', ')
  if (key === 'upload_ratio') return torrent.upload_ratio === -2 ? Infinity : torrent.upload_ratio < 0 ? undefined : torrent.upload_ratio
  const value = torrent[key]
  if (typeof value === 'number' && (!Number.isFinite(value) || (value < 0 && key !== 'bandwidth_priority') || (value === 0 && ['added_date', 'done_date'].includes(key)))) return undefined
  return value
}

export function compareTorrents(left: Torrent, right: Torrent, key: string, descending: boolean) {
  const a = columnValue(left, key), b = columnValue(right, key)
  if (a == null || b == null) return a == null ? b == null ? 0 : 1 : -1
  const comparison = a === b ? 0 : typeof a === 'number' && typeof b === 'number' ? a < b ? -1 : 1 : String(a).localeCompare(String(b), 'zh-CN', { numeric: true })
  return comparison * (descending ? -1 : 1)
}

export function columnSorts(key: string, visible: string[]): string[][] {
  if (key === 'percent_done' && !visible.includes('total_size')) return [['percent_done', '进度'], ['total_size', '大小']]
  if (key === 'rate_download' && !visible.includes('rate_upload')) return [['rate_download', '下载'], ['rate_upload', '上传']]
  if (key === 'upload_ratio' && !visible.includes('peers_connected') && !visible.includes('seeders') && !visible.includes('leechers')) return [['upload_ratio', '分享率'], ['peers_connected', 'Peers']]
  return [[key, columns.find(column => column.key === key)?.label ?? key]]
}
