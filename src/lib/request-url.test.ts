import { afterEach, expect, it, vi } from 'vitest'
import { requestUrl } from './request-url'
import { TransmissionClient } from './rpc'

afterEach(() => vi.unstubAllGlobals())

it('相对 RPC 和发现路径不继承页面 URL 的 Basic 凭据', () => {
  const page = 'http://fixture:encoded%40pass@nas.example:9091/custom/web/?demo=1'
  expect(requestUrl('/custom/rpc', page)).toBe('http://nas.example:9091/custom/rpc')
  expect(requestUrl('./api/server', page)).toBe('http://nas.example:9091/custom/web/api/server')
  expect(requestUrl('https://other.example/transmission/rpc', page)).toBe('https://other.example/transmission/rpc')
})

it('409 握手沿用干净的同源 URL 和浏览器认证，跨源不启用 include', async () => {
  vi.stubGlobal('location', { href: 'http://fixture:basic-fixture@nas.example:9091/transmission/web/' })
  const fetcher = vi.fn()
    .mockResolvedValueOnce(new Response('', { status: 409, headers: { 'X-Transmission-Session-Id': 'fixture-session' } }))
    .mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ result: 'success', arguments: { version: '4.0.6' } }))))
  await new TransmissionClient({ id: 'native', name: '当前实例', url: '/transmission/rpc' }, undefined, fetcher).connect()
  for (const [url, options] of fetcher.mock.calls) {
    expect(url).toBe('http://nas.example:9091/transmission/rpc')
    expect(options.credentials).toBe('same-origin')
    expect(options.headers.Authorization).toBeUndefined()
  }
  expect(fetcher.mock.calls[1][1].headers['X-Transmission-Session-Id']).toBe('fixture-session')
  await new TransmissionClient({ id: 'other', name: '远程', url: 'https://other.example/rpc' }, undefined, fetcher).connect()
  expect(fetcher.mock.lastCall?.[0]).toBe('https://other.example/rpc')
  expect(fetcher.mock.lastCall?.[1].headers.Authorization).toBeUndefined()
  expect(fetcher.mock.lastCall?.[1].credentials).toBe('same-origin')
})
