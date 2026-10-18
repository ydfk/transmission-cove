import { describe, it, expect, vi } from 'vitest'
import { TransmissionClient, validateEndpoint } from './rpc'
import { legacyParams, normalize } from './protocol'
const server = { id: 'test', name: 'Test', url: '/transmission/rpc' }
const json = (value: unknown) => new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json' } })
describe('Transmission 协议与操作边界', () => {
  it('409 握手后重试相同请求，携带会话标识', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('', { status: 409, headers: { 'X-Transmission-Session-Id': 'token-a' } })).mockResolvedValueOnce(json({ result: 'success', arguments: { version: '4.0.6', 'rpc-version-semver': '5.3.0' } }))
    const client = new TransmissionClient(server, undefined, fetcher)
    expect((await client.connect()).version).toBe('4.0.6')
    expect(fetcher.mock.calls[1][1].headers['X-Transmission-Session-Id']).toBe('token-a')
    expect(fetcher.mock.calls[1][1].body).toBe(fetcher.mock.calls[0][1].body)
    expect(client.modern).toBe(false)
  })
  it('4.1 使用 JSON-RPC 2.0 和 snake_case', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(json({ result: 'success', arguments: { version: '4.1.3', 'rpc-version-semver': '6.0.0' } })).mockResolvedValueOnce(json({ jsonrpc: '2.0', result: { torrents: [] }, id: 2 }))
    const client = new TransmissionClient(server, undefined, fetcher)
    await client.connect(); await client.call('torrent_get', { fields: ['hash_string', 'rate_download'] })
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toMatchObject({ jsonrpc: '2.0', method: 'torrent_get', params: { fields: ['hash_string', 'rate_download'] } })
  })
  it('特殊字段和旧枚举正确映射，不改写用户字符串', () => {
    expect(legacyParams('session_set', { cache_size_mib: 8, seed_ratio_limit: 2, encryption: 'allowed', download_dir: '/keep_this' })).toEqual({ 'cache-size-mb': 8, seedRatioLimit: 2, encryption: 'tolerated', 'download-dir': '/keep_this' })
    expect(legacyParams('torrent_set', { tracker_list: 'https://a_b.example', peer_limit: 50, files_wanted: [0] })).toEqual({ trackerList: 'https://a_b.example', 'peer-limit': 50, 'files-wanted': [0] })
    expect(normalize({ 'cache-size-mb': 4, fileStats: [{ bytesCompleted: 10 }], name: 'Do_Not_Change' })).toEqual({ cache_size_mib: 4, file_stats: [{ bytes_completed: 10 }], name: 'Do_Not_Change' })
  })
  it.each(['torrent_stop', 'torrent_remove', 'torrent_set', 'queue_move_top'])('阻止 %s 的空集合或缺失目标', async method => {
    const fetcher = vi.fn(); const client = new TransmissionClient(server, undefined, fetcher)
    await expect(client.call(method, { ids: [] })).rejects.toThrow('请先选择')
    await expect(client.call(method)).rejects.toThrow('请先选择')
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('拒绝无限 409 重试和缺失握手标识', async () => {
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(new Response('', { status: 409, headers: { 'X-Transmission-Session-Id': 'token' } })))
    await expect(new TransmissionClient(server, undefined, fetcher).connect()).rejects.toThrow('409')
    expect(fetcher).toHaveBeenCalledTimes(2)
    await expect(new TransmissionClient(server, undefined, vi.fn().mockResolvedValue(new Response('', { status: 409 }))).connect()).rejects.toThrow('同源代理')
  })
  it('网络错误不重试变更，认证信息按客户端隔离', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('offline'))
    await expect(new TransmissionClient(server, { username: 'user', password: 'secret' }, fetcher).call('torrent_stop', { ids: ['hash-a'] })).rejects.toThrow('操作结果未知')
    expect(fetcher).toHaveBeenCalledTimes(1)
    const other = vi.fn().mockResolvedValue(json({ result: 'success', arguments: {} }))
    await new TransmissionClient({ ...server, id: 'other' }, undefined, other).call('session_get')
    expect(other.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })
  it('拒绝含凭据、协议相对路径和非 HTTP 地址', () => {
    for (const url of ['//evil.example', 'https://user:secret@example.org', 'javascript:alert(1)', 'nas:9091/rpc']) expect(() => validateEndpoint(url)).toThrow()
    expect(validateEndpoint('/proxy/nas/rpc')).toBe('/proxy/nas/rpc')
  })
})
