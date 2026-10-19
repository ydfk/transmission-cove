import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, validateServers, upstreamUrl } from './index.mjs'
const running = []
afterEach(async () => { await Promise.all(running.splice(0).map(server => new Promise(resolve => { server.closeAllConnections(); server.close(resolve) }))) })
async function start(fetcher) {
  const app = createApp({ servers: [{ id: 'nas', name: 'NAS', url: 'http://nas.example:9091/transmission/rpc' }], fetcher })
  running.push(app)
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve))
  return `http://127.0.0.1:${app.address().port}`
}
describe('独立部署代理', () => {
  it('远程切换按请求隔离目标与凭据，不更改默认服务器', async () => {
    const upstream = vi.fn().mockImplementation(async () => new Response('', { status: 409, headers: { 'X-Transmission-Session-Id': 'remote-handshake' } }))
    const base = await start(upstream)
    for (const host of ['one', 'two']) {
      const target = `http://${host}.example:9091/transmission/rpc`
      const result = await fetch(`${base}/api/remote-rpc`, { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json', 'X-Cove-Rpc-Target': target, Authorization: `Basic ${host}` }, body: '{"method":"session-get","arguments":{}}' })
      expect(result.status).toBe(409)
      expect(result.headers.get('X-Transmission-Session-Id')).toBe('remote-handshake')
      const [url, options] = upstream.mock.calls.at(-1)
      expect(url).toBe(target)
      expect(options.headers.authorization).toBe(`Basic ${host}`)
      expect(options.headers['X-Cove-Rpc-Target']).toBeUndefined()
      expect(options.redirect).toBe('manual')
    }
    expect(await fetch(`${base}/api/server`).then(r => r.json())).toMatchObject({ address: 'http://nas.example:9091/transmission/rpc', remoteProxy: '/api/remote-rpc' })
  })
  it('远程代理拒绝跨站、缺少来源、危险地址和非 RPC 请求', async () => {
    const upstream = vi.fn()
    const base = await start(upstream)
    const headers = { Origin: base, 'Content-Type': 'application/json', 'X-Cove-Rpc-Target': 'http://other.example/transmission/rpc' }
    const body = '{"method":"session_get","jsonrpc":"2.0","params":{}}'
    for (const origin of ['', 'https://evil.example']) {
      expect((await fetch(`${base}/api/remote-rpc`, { method: 'POST', headers: { ...headers, Origin: origin }, body })).status).toBe(403)
    }
    for (const target of ['file:///etc/passwd', 'http://user:secret@example.org/rpc', 'http://example.org/admin', 'http://example.org/rpc#fragment']) {
      expect((await fetch(`${base}/api/remote-rpc`, { method: 'POST', headers: { ...headers, 'X-Cove-Rpc-Target': target }, body })).status).toBe(400)
    }
    for (const payload of ['{}', '[]', '{"method":"execute"}', '{"method":"session_get","jsonrpc":"2.0","params":[]}']) {
      expect((await fetch(`${base}/api/remote-rpc`, { method: 'POST', headers, body: payload })).status).toBe(400)
    }
    expect((await fetch(`${base}/api/remote-rpc`, { headers })).status).toBe(405)
    expect(upstream).not.toHaveBeenCalled()
  })
  it('只将 Docker 宿主机别名解析为 IP，保留端口、路径及自定义域名', async () => {
    const resolver = vi.fn().mockResolvedValue({ address: '192.168.65.254', family: 4 })
    expect(await upstreamUrl('http://host.docker.internal:9091/custom/rpc', resolver)).toBe('http://192.168.65.254:9091/custom/rpc')
    expect(await upstreamUrl('https://nas.example:9091/custom/rpc', resolver)).toBe('https://nas.example:9091/custom/rpc')
    expect(resolver).toHaveBeenCalledTimes(1)
  })
  it('仅转发固定上游，透传 409 和会话标识', async () => {
    const upstream = vi.fn().mockResolvedValue(new Response('', { status: 409, headers: { 'X-Transmission-Session-Id': 'test-session' } }))
    const base = await start(upstream)
    const result = await fetch(`${base}/api/rpc`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Basic test' }, body: '{}' })
    expect(result.status).toBe(409); expect(result.headers.get('X-Transmission-Session-Id')).toBe('test-session')
    expect(upstream.mock.calls[0][0]).toBe('http://nas.example:9091/transmission/rpc')
    expect(upstream.mock.calls[0][1].redirect).toBe('manual')
    expect((await fetch(`${base}/api/server`).then(r => r.json())).url).toBe('/api/rpc')
  })
  it('拒绝跨站、非 JSON、未知上游和超限请求', async () => {
    const upstream = vi.fn(); const base = await start(upstream)
    expect((await fetch(`${base}/api/rpc`, { method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: '{}' })).status).toBe(403)
    expect((await fetch(`${base}/api/rpc`, { method: 'POST', body: '{}' })).status).toBe(415)
    expect((await fetch(`${base}/api/rpc/unknown`, { method: 'POST' })).status).toBe(404)
    expect(upstream).not.toHaveBeenCalled()
  })
  it('配置仅允许一个上游且不允许凭据和危险协议', () => {
    expect(() => validateServers([{ id: 'a', name: 'a', url: 'http://a.example' }, { id: 'b', name: 'b', url: 'http://b.example' }])).toThrow('仅支持一个')
    expect(() => validateServers([{ id: 'a', name: 'a', url: 'file:///etc/passwd' }])).toThrow()
    expect(() => validateServers([{ id: 'a', name: 'a', url: 'https://user:password@example.org' }])).toThrow()
  })
})
