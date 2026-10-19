import { describe, expect, it, vi } from 'vitest'
import { discoverServer, nativeServer, manualServer, connectionTarget } from './connection'

describe('当前实例自动连接', () => {
  it('有内置代理时按请求指定任意远程地址，原生版保持直连', () => {
    const automatic = { id: 'current', name: '当前 Transmission', managed: true, url: '/api/rpc', address: 'http://127.0.0.1:9091/transmission/rpc', remoteProxy: '/api/remote-rpc' as const }
    for (const address of ['http://first.example:9091/transmission/rpc', 'https://second.example/custom/rpc']) {
      expect(connectionTarget(address, automatic)).toMatchObject({ url: '/api/remote-rpc', remoteTarget: address, address })
      expect(connectionTarget(address, nativeServer('/transmission/web/'))).toMatchObject({ url: address })
    }
    expect(connectionTarget('/proxy/other/rpc', automatic).url).toBe('/proxy/other/rpc')
    expect(automatic.address).toBe('http://127.0.0.1:9091/transmission/rpc')
  })
  it('手动填写已配置上游时使用固定代理，其他地址不改变代理目标', () => {
    const server = { id: 'current', name: '当前 Transmission', managed: true, url: '/api/rpc', address: 'http://nas.example:9091/transmission/rpc' }
    expect(connectionTarget(server.address, server)).toBe(server)
    expect(connectionTarget('/api/rpc', server)).toBe(server)
    expect(connectionTarget('https://other.example/rpc', server).url).toBe('https://other.example/rpc')
    expect(connectionTarget('https://other.example/rpc', server).managed).toBeUndefined()
  })
  it('手动地址只恢复有效 URL，不恢复凭据或历史服务器配置', () => {
    expect(manualServer(' /other/rpc ')?.url).toBe('/other/rpc')
    expect(manualServer('https://nas.example/transmission/rpc')?.managed).toBeUndefined()
    for (const value of [null, {}, 'javascript:alert(1)', '//other/rpc', 'https://user:secret@nas.example/rpc']) expect(manualServer(value)).toBeNull()
  })
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
