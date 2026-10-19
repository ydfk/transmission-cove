import { describe, expect, it } from 'vitest'
import { createDemoTorrents } from './demo'
import { columnSorts, compareTorrents, fullColumns, trackerCount, validColumns } from './torrent-columns'
import { legacyParams, normalize } from './protocol'
import { LIST_FIELDS } from './types'

describe('任务列表完整列', () => {
  it('Tracker 不重复累加、保留真实零值并区分未知', () => {
    const tracker = createDemoTorrents(1)[0].tracker_stats![0]
    expect(trackerCount([{ ...tracker, seeder_count: 12 }, { ...tracker, seeder_count: 18 }], 'seeder_count')).toBe(18)
    expect(trackerCount([{ ...tracker, seeder_count: -1 }], 'seeder_count')).toBeUndefined()
    expect(trackerCount([{ ...tracker, seeder_count: 0 }], 'seeder_count')).toBe(0)
    expect(trackerCount(undefined, 'leecher_count')).toBeUndefined()
  })
  it('排序使用数值、未知始终置后，优先级 -1 和无限分享率有效', () => {
    const [a, b] = createDemoTorrents(2)
    expect(compareTorrents({ ...a, have_valid: 1000 }, { ...b, have_valid: 99 }, 'have_valid', true)).toBeLessThan(0)
    for (const descending of [true, false]) expect(compareTorrents({ ...a, seconds_seeding: undefined }, { ...b, seconds_seeding: 0 }, 'seconds_seeding', descending)).toBeGreaterThan(0)
    expect(compareTorrents({ ...a, bandwidth_priority: -1 }, { ...b, bandwidth_priority: 0 }, 'bandwidth_priority', false)).toBeLessThan(0)
    expect(compareTorrents({ ...a, upload_ratio: -2 }, { ...b, upload_ratio: 99 }, 'upload_ratio', true)).toBeLessThan(0)
  })
  it('旧列偏好可保留、异常值清理，独立列避免重复合并表头', () => {
    expect(validColumns(['rate_download', 'bogus', 'rate_download', 'name'])).toEqual(['rate_download'])
    expect(validColumns(null)).toEqual(fullColumns)
    expect(columnSorts('rate_download', ['rate_download', 'rate_upload'])).toEqual([['rate_download', '下载速度']])
    expect(columnSorts('rate_download', ['rate_download'])).toHaveLength(2)
  })
  it('新增字段兼容 4.0 的命名与 4.1 的响应', () => {
    expect(legacyParams('torrent_get', { fields: LIST_FIELDS }).fields).toEqual(expect.arrayContaining(['haveValid', 'downloadedEver', 'uploadedEver', 'bandwidthPriority', 'secondsSeeding', 'doneDate']))
    expect(normalize({ haveValid: 42, secondsSeeding: 172800, trackerStats: [{ seederCount: -1, leecherCount: 0 }] })).toEqual({ have_valid: 42, seconds_seeding: 172800, tracker_stats: [{ seeder_count: -1, leecher_count: 0 }] })
  })
})
