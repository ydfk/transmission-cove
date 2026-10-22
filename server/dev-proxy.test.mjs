import { afterEach, expect, it } from 'vitest'
import { createServer as createHttpServer, request } from 'node:http'
import { createServer as createViteServer } from 'vite'
import { devProxy } from './dev-proxy.mjs'

const cleanup = []
afterEach(async () => { for (const close of cleanup.splice(0).reverse()) await close() })

it('开发代理透传认证与握手，拒绝跨站和陌生 Host，目标固定', async () => {
  let upstreamCalls = 0
  const upstream = createHttpServer((req, res) => {
    upstreamCalls++
    expect(req.url).toBe('/custom/rpc')
    if (req.headers.authorization !== 'Basic test') { res.writeHead(401); res.end(); return }
    if (req.headers['x-transmission-session-id'] !== 'fixture-session') { res.writeHead(409, { 'X-Transmission-Session-Id': 'fixture-session' }); res.end(); return }
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"result":"success","arguments":{"version":"4.0.6"}}')
  })
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve))
  cleanup.push(() => new Promise(resolve => upstream.close(resolve)))
  const address = `http://127.0.0.1:${upstream.address().port}/custom/rpc`
  const vite = await createViteServer({ configFile: false, logLevel: 'silent', plugins: [devProxy(address)], server: { host: '127.0.0.1', port: 0 }, optimizeDeps: { noDiscovery: true, include: [] } })
  cleanup.push(() => vite.close())
  await vite.listen()
  const base = `http://127.0.0.1:${vite.httpServer.address().port}`
  // 临时 Vite 重启后可能复用端口，关闭测试连接以免复用已销毁服务的 keep-alive socket。
  expect(await fetch(`${base}/api/server`, { headers: { Connection: 'close' } }).then(r => r.json())).toMatchObject({ managed: true, url: '/api/rpc', address })
  const options = { method: 'POST', body: '{"method":"session-get"}', headers: { 'Content-Type': 'application/json', Origin: base, Connection: 'close' } }
  expect((await fetch(`${base}/api/rpc`, options)).status).toBe(401)
  options.headers.Authorization = 'Basic test'
  const handshake = await fetch(`${base}/api/rpc`, options)
  expect(handshake.status).toBe(409)
  expect(handshake.headers.get('X-Transmission-Session-Id')).toBe('fixture-session')
  options.headers['X-Transmission-Session-Id'] = 'fixture-session'
  expect((await fetch(`${base}/api/rpc`, options)).status).toBe(200)
  expect((await fetch(`${base}/api/rpc`, { ...options, headers: { ...options.headers, Origin: 'https://other.example' } })).status).toBe(403)
  const foreignHostStatus = await new Promise((resolve, reject) => {
    const req = request(`${base}/api/rpc`, { method: 'POST', headers: { ...options.headers, Host: 'other.example' } }, response => { response.resume(); resolve(response.statusCode) })
    req.on('error', reject); req.end(options.body)
  })
  expect(foreignHostStatus).toBe(403)
  expect((await fetch(`${base}/api/rpc/other`, options)).status).toBe(404)
  expect(upstreamCalls).toBe(3)
  options.headers['X-Cove-Rpc-Target'] = address
  expect((await fetch(`${base}/api/remote-rpc`, options)).status).toBe(200)
  expect(upstreamCalls).toBe(4)
})

it('未设置 NAS 地址的开发版默认连接本机，并声明远程切换能力', async () => {
  const vite = await createViteServer({ configFile: false, logLevel: 'silent', plugins: [devProxy()], server: { host: '127.0.0.1', port: 0 }, optimizeDeps: { noDiscovery: true, include: [] } })
  cleanup.push(() => vite.close())
  await vite.listen()
  const base = `http://127.0.0.1:${vite.httpServer.address().port}`
  expect(await fetch(`${base}/api/server`, { headers: { Connection: 'close' } }).then(r => r.json())).toMatchObject({ address: 'http://127.0.0.1:9091/transmission/rpc', remoteProxy: '/api/remote-rpc' })
})
