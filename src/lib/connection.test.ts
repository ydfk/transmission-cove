import { describe, expect, it, vi } from 'vitest'
import { discoverServer, nativeServer } from './connection'

describe('当前实例自动连接', () => {
  it('从原生 Web 路径推导 RPC，保留自定义前缀', async () => {
    const fetcher = vi.fn()
    expect((await discoverServer('/transmission/web/', fetcher)).url).toBe('/transmission/rpc')
    expect(nativeServer('/custom/web/index.html').url).toBe('/custom/rpc')
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('独立部署只采用固定代理端点', async () => {
    const server = { id: 'current', name: '当前 Transmission', managed: true, url: '/api/rpc', address: 'http://host.docker.internal:9091/transmission/rpc' }
    expect(await discoverServer('/', vi.fn().mockResolvedValue(Response.json(server)))).toEqual(server)
    expect((await discoverServer('/', vi.fn().mockResolvedValue(Response.json({ ...server, url: 'https://other.example/rpc' })))).url).toBe('/transmission/rpc')
  })
  it('静态服务器没有发现接口时仍自动使用原生 RPC', async () => {
    expect((await discoverServer('/', vi.fn().mockResolvedValue(new Response('<html/>')))).url).toBe('/transmission/rpc')
    expect((await discoverServer('/', vi.fn().mockRejectedValue(new TypeError('offline')))).url).toBe('/transmission/rpc')
  })
})
