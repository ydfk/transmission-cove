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
