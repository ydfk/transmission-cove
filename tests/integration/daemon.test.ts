import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { TransmissionClient } from '../../src/lib/rpc'
import { DETAIL_FIELDS, LIST_FIELDS, type Torrent } from '../../src/lib/types'

function bencode(value: string | number | Buffer | Record<string, unknown>): Buffer {
  if (typeof value === 'number') return Buffer.from(`i${value}e`)
  if (typeof value === 'string' || Buffer.isBuffer(value)) { const buffer = Buffer.from(value); return Buffer.concat([Buffer.from(`${buffer.length}:`), buffer]) }
  return Buffer.concat([Buffer.from('d'), ...Object.keys(value).sort().flatMap(key => [bencode(key), bencode(value[key] as string)]), Buffer.from('e')])
}
// 只向测试容器添加自制、暂停、无 Tracker 的 1 字节种子，不访问公开 swarm。
const metainfo = bencode({ info: { name: 'transmission-web-fixture.txt', length: 1, 'piece length': 16384, pieces: createHash('sha1').update('x').digest(), private: 1 } }).toString('base64')

for (const [version, endpoint] of [['4.0', process.env.TR_TEST_RPC40], ['4.1', process.env.TR_TEST_RPC41]]) {
  describe.skipIf(!endpoint)(`真实 daemon ${version}`, () => {
    it('握手、添加、读取详情、文件选择、标签、设置、队列与删除', async () => {
      const client = new TransmissionClient({ id: version!, name: 'Isolated test', url: endpoint! })
      const session = await client.connect()
      expect(String(session.version)).toMatch(new RegExp(`^${version!.replace('.', '\\.')}`))
      expect(client.modern).toBe(version === '4.1')
      const added = await client.call<{ torrent_added?: Torrent; torrent_duplicate?: Torrent }>('torrent_add', { metainfo, paused: true, download_dir: '/tmp/downloads', labels: ['web-test'] })
      const hash = (added.torrent_added ?? added.torrent_duplicate)!.hash_string
      expect(hash).toMatch(/^[a-f0-9]{40}$/)
      try {
        const list = await client.call<{ torrents: Torrent[] }>('torrent_get', { fields: LIST_FIELDS })
        expect(list.torrents.find(t => t.hash_string === hash)?.labels).toEqual(['web-test'])
        const detail = await client.call<{ torrents: Torrent[] }>('torrent_get', { ids: [hash], fields: [...DETAIL_FIELDS, ...(client.modern ? ['sequential_download'] : [])] })
        expect(detail.torrents[0].files?.[0].name).toBe('transmission-web-fixture.txt')
        expect(detail.torrents[0].peer_limit).toBeTypeOf('number')
        await client.call('torrent_set', { ids: [hash], files_unwanted: [0], priority_high: [0], labels: ['verified'], download_limited: true, download_limit: 321, peer_limit: 20, tracker_list: '' })
        const changed = (await client.call<{ torrents: Torrent[] }>('torrent_get', { ids: [hash], fields: ['hash_string', 'file_stats', 'download_limit', 'labels'] })).torrents[0]
        expect(changed.file_stats?.[0]).toMatchObject({ wanted: false, priority: 1 })
        expect(changed.download_limit).toBe(321)
        expect(changed.labels).toEqual(['verified'])
        await client.call('queue_move_top', { ids: [hash] })
        await client.call('torrent_stop', { ids: [hash] })
        await client.call('session_set', { speed_limit_down: 432, speed_limit_down_enabled: true, cache_size_mib: 8, encryption: 'allowed' })
        const changedSession = await client.call('session_get')
        expect(changedSession.speed_limit_down).toBe(432)
        expect(changedSession.cache_size_mib).toBe(8)
        expect(changedSession.encryption).toBe('allowed')
        const stats = await client.call('session_stats')
        expect(stats.cumulative_stats).toBeTruthy()
        await client.call('group_set', { name: 'web-test', honors_session_limits: true, speed_limit_down: 123, speed_limit_down_enabled: true })
        expect((await client.call<{ group: { name: string }[] }>('group_get')).group.some(g => g.name === 'web-test')).toBe(true)
      } finally { await client.call('torrent_remove', { ids: [hash], delete_local_data: false }) }
      expect((await client.call<{ torrents: Torrent[] }>('torrent_get', { ids: [hash], fields: ['hash_string'] })).torrents).toEqual([])
    })
  })
}
