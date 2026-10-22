import { test, expect } from '@playwright/test'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createDemoTorrents } from '../src/lib/demo'

for (const mode of ['url', 'browser'] as const) test(`原生 HTTP Basic ${mode} 登录后自动连接并支持刷新`, async ({ browser, baseURL }) => {
  const username = 'basic-fixture', password = 'fixture:p@ss'
  const authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
  let challenges = 0, rpcSuccess = 0
  const server = createServer(async (request, response) => {
    if (request.headers.authorization !== authorization) {
      response.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Transmission"' }); response.end(); return
    }
    if (request.url === '/transmission/rpc') {
      if (request.headers['x-transmission-session-id'] !== 'basic-session') {
        challenges++; response.writeHead(409, { 'X-Transmission-Session-Id': 'basic-session' }); response.end(); return
      }
      const chunks = []
      for await (const chunk of request) chunks.push(chunk)
      const body = JSON.parse(Buffer.concat(chunks).toString())
      const result = body.method === 'session-get' ? { version: '4.0.6' } : body.method === 'torrent-get' ? { torrents: createDemoTorrents(2) } : {}
      rpcSuccess++; response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify({ result: 'success', arguments: result })); return
    }
    // 真实 HTTP 服务负责认证；仅静态页面交给隔离 Vite，不使用路由 mock 代替认证缓存。
    try {
      const upstream = await fetch(new URL(request.url!, baseURL))
      response.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('content-type') ?? 'text/plain' })
      response.end(Buffer.from(await upstream.arrayBuffer()))
    } catch { response.writeHead(502); response.end() }
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  const context = await browser.newContext(mode === 'browser' ? { httpCredentials: { username, password, origin } } : {})
  try {
    const page = await context.newPage()
    const url = new URL('/transmission/web/', origin)
    if (mode === 'url') { url.username = username; url.password = password }
    await page.goto(url.href)
    await expect(page.locator('.torrent-row')).toHaveCount(2)
    await expect(page.getByRole('dialog', { name: '登录 Transmission' })).toHaveCount(0)
    await expect(page.locator('.status-address')).toHaveAttribute('title', `${origin}/transmission/rpc`)
    await page.reload()
    await expect(page.locator('.torrent-row')).toHaveCount(2)
    await expect(page.getByRole('dialog', { name: '登录 Transmission' })).toHaveCount(0)
    expect(challenges).toBeGreaterThanOrEqual(2)
    expect(rpcSuccess).toBeGreaterThanOrEqual(4)
    expect(await page.evaluate(() => sessionStorage.getItem('transmission-web.v1.auth.session'))).toBeNull()
    expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(username)
  } finally {
    await context.close(); server.closeAllConnections()
    await new Promise<void>(resolve => server.close(() => resolve()))
  }
})
