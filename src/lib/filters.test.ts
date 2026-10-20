import { describe, expect, it } from 'vitest'
import { buildDirectoryTree, emptyFilters, matches, matchesStatus, normalizeDirectory, withinDirectory } from './filters'
import type { Torrent } from './types'
import { limitText } from './limits'

const torrent = { status: 0, percent_done: 1, rate_download: 0, rate_upload: 0, error: 0, labels: ['电影'], trackers: [{ announce: 'https://tracker.example.org/announce' }], download_dir: '/volume1/downloads/电影/经典' } as Torrent
describe('任务筛选语义', () => {
  it('完成、暂停与活动互不混淆', () => {
    expect(matchesStatus(torrent, 'completed')).toBe(true)
    expect(matchesStatus(torrent, 'paused')).toBe(true)
    expect(matchesStatus(torrent, 'active')).toBe(false)
    expect(matchesStatus(torrent, 'seeding')).toBe(false)
    expect(matchesStatus({ ...torrent, status: 6, rate_upload: 100 }, 'active')).toBe(true)
    expect(matchesStatus({ ...torrent, status: 6 }, 'seeding')).toBe(true)
    for (const status of [1, 2]) expect(matchesStatus({ ...torrent, status }, 'checking')).toBe(true)
    for (const status of [3, 4]) expect(matchesStatus({ ...torrent, status }, 'downloading')).toBe(true)
    expect(matchesStatus({ ...torrent, error: 2 }, 'error')).toBe(true)
  })
  it('做种只按 daemon 状态判断，包含零速与上传中的做种任务', () => {
    for (const rate_upload of [0, 100]) expect(matchesStatus({ ...torrent, status: 6, rate_upload }, 'seeding')).toBe(true)
    for (const status of [0, 1, 2, 3, 4, 5]) expect(matchesStatus({ ...torrent, status, percent_done: 1 }, 'seeding')).toBe(false)
  })
  it('目录按分隔符匹配后代，避免前缀误选', () => {
    expect(withinDirectory('/a/b/c', '/a/b')).toBe(true)
    expect(withinDirectory('/a/b2', '/a/b')).toBe(false)
    expect(withinDirectory('/a', '/')).toBe(true)
    expect(withinDirectory('', '')).toBe(true)
    expect(normalizeDirectory('C:\\Downloads\\')).toBe('C:/Downloads')
  })
  it('状态、目录、标签和 Tracker 取交集', () => {
    const filters = { ...emptyFilters, status: 'completed', directory: '/volume1/downloads', label: '电影', tracker: 'tracker.example.org' }
    expect(matches(torrent, filters)).toBe(true)
    expect(matches(torrent, { ...filters, label: '动画' })).toBe(false)
    expect(matches(torrent, { ...filters, status: 'active' })).toBe(false)
  })
  it('多层目录累计计数且同名不同路径不合并', () => {
    const tree = buildDirectoryTree([torrent, { ...torrent, download_dir: '/volume1/downloads/电影' }, { ...torrent, download_dir: '/volume1/downloads2/电影' }])
    const volume = tree.get('/volume1')!
    expect(volume.count).toBe(3)
    expect(volume.children.get('/volume1/downloads')!.count).toBe(2)
    expect(volume.children.get('/volume1/downloads')!.children.get('/volume1/downloads/电影')!.children.get('/volume1/downloads/电影/经典')!.count).toBe(1)
    expect(volume.children.get('/volume1/downloads2')!.count).toBe(1)
    const rooted = buildDirectoryTree([torrent, { ...torrent, download_dir: '/' }])
    expect(rooted.get('/')!.count).toBe(2)
    expect(rooted.get('/')!.children.has('/volume1')).toBe(true)
  })
})
it('底部限速优先显示备用值，关闭后显示普通限速', () => {
  expect(limitText(undefined, 'down')).toBe('—')
  expect(limitText({ speed_limit_down_enabled: false }, 'down')).toBe('不限速')
  expect(limitText({ speed_limit_down_enabled: true, speed_limit_down: 200 }, 'down')).toBe('200 kB/s')
  expect(limitText({ alt_speed_enabled: true, alt_speed_down: 0, speed_limit_down_enabled: true, speed_limit_down: 200 }, 'down')).toBe('0 kB/s')
})
