import { expect, test } from '@playwright/test'
import { createDemoTorrents } from '../src/lib/demo'

test('原生覆盖版从页面路径自动连接当前实例，不探测独立代理', async ({ page }) => {
  let discoveries = 0
  const paths: string[] = []
  await page.route('**/api/server', route => { discoveries++; return route.abort() })
  await page.route('**/custom/rpc', async route => {
    paths.push(new URL(route.request().url()).pathname)
    const body = route.request().postDataJSON()
    await route.fulfill({ json: { result: 'success', arguments: body.method === 'session-get' ? { version: '4.0.6' } : body.method === 'torrent-get' ? { torrents: createDemoTorrents(2) } : {} } })
  })
  await page.goto('/custom/web/')
  await expect(page.locator('.torrent-row')).toHaveCount(2)
  expect(discoveries).toBe(0)
  expect(paths.length).toBeGreaterThan(1)
  await page.getByRole('button', { name: '设置', exact: true }).click({ modifiers: ['Shift'] })
  await expect(page.getByLabel('RPC 地址', { exact: true })).toHaveValue('/custom/rpc')
  await expect(page.getByText('默认连接当前 Transmission。远程地址需允许跨域访问，也可填写同源代理路径。')).toBeVisible()
})

test('内置代理支持任意远程地址、保存实际地址并恢复本机默认连接', async ({ page }) => {
  const local = 'http://127.0.0.1:9091/transmission/rpc'
  const targets = ['http://first.example:9091/transmission/rpc', 'http://second.example:9092/custom/rpc']
  const calls: { target?: string; auth?: string }[] = []
  let direct = 0
  await page.route(/^http:\/\/(first|second)\.example:\d+\//, async route => { direct++; await route.abort() })
  await page.route('**/api/server', route => route.fulfill({ json: { id: 'current', name: '当前 Transmission', managed: true, url: '/api/rpc', address: local, remoteProxy: '/api/remote-rpc' } }))
  await page.route('**/api/*rpc', async route => {
    const headers = route.request().headers()
    const target = headers['x-cove-rpc-target']
    calls.push({ target, auth: headers.authorization })
    const index = targets.indexOf(target)
    const body = route.request().postDataJSON()
    await route.fulfill({ json: { result: 'success', arguments: body.method === 'session-get' ? { version: '4.0.6' } : body.method === 'torrent-get' ? { torrents: createDemoTorrents(index + 2) } : {} } })
  })
  await page.goto('/')
  await expect(page.locator('.torrent-row')).toHaveCount(1)
  await expect(page.locator('.status-address')).toContainText(local)
  for (const [index, target] of targets.entries()) {
    await page.getByRole('button', { name: '设置', exact: true }).click({ modifiers: ['Shift'] })
    await page.getByLabel('RPC 地址', { exact: true }).fill(target)
    if (index === 0) {
      await page.getByLabel('用户名', { exact: true }).fill('first')
      await page.getByLabel('密码', { exact: true }).fill('first-only-secret')
    }
    await page.getByRole('button', { name: '连接并切换' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.locator('.torrent-row')).toHaveCount(index + 2)
    await expect(page.locator('.status-address')).toContainText(target)
    expect(await page.evaluate(() => localStorage.getItem('transmission-web.v1.connection.override'))).toBe(JSON.stringify(target))
  }
  expect(calls.filter(call => call.target === targets[1]).every(call => !call.auth)).toBe(true)
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('first-only-secret')
  await page.reload()
  await expect(page.locator('.torrent-row')).toHaveCount(3)
  await page.getByRole('button', { name: '设置', exact: true }).click({ modifiers: ['Shift'] })
  await expect(page.getByLabel('RPC 地址', { exact: true })).toHaveValue(targets[1])
  await page.getByRole('button', { name: '恢复自动连接' }).click()
  await expect(page.locator('.torrent-row')).toHaveCount(1)
  await expect(page.locator('.status-address')).toContainText(local)
  expect(calls.at(-1)?.target).toBeUndefined()
  expect(calls.at(-1)?.auth).toBeUndefined()
  expect(direct).toBe(0)
})

test('填写已配置 NAS 地址时走同源代理，不发送跨域请求', async ({ page }) => {
  const address = 'http://backend.example:9091/transmission/rpc'
  let direct = 0, proxied = 0
  await page.route('http://backend.example/**', async route => { direct++; await route.abort() })
  await page.route('**/api/server', route => route.fulfill({ json: { id: 'current', name: '当前 Transmission', managed: true, url: '/api/rpc', address } }))
  await page.route('**/api/rpc', async route => {
    proxied++
    const body = route.request().postDataJSON()
    await route.fulfill({ json: { result: 'success', arguments: body.method === 'session-get' ? { version: '4.0.6' } : body.method === 'torrent-get' ? { torrents: createDemoTorrents(2) } : {} } })
  })
  await page.goto('/')
  await expect(page.locator('.torrent-row')).toHaveCount(2)
  await page.getByRole('button', { name: '设置', exact: true }).click({ modifiers: ['Shift'] })
  await page.getByLabel('RPC 地址', { exact: true }).fill(address)
  await page.getByRole('button', { name: '连接并切换' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.torrent-row')).toHaveCount(2)
  await expect(page.locator('.status-address')).toContainText(address)
  expect(direct).toBe(0)
  expect(proxied).toBeGreaterThan(3)
  expect(await page.evaluate(() => localStorage.getItem('transmission-web.v1.connection.override'))).toBe('"/api/rpc"')
})

test('隐藏切换：验证后切换、隔离缓存与凭据、持久化地址、断线恢复自动连接', async ({ page }) => {
  const calls: { path: string; auth?: string }[] = []
  const authA = 'Basic ' + Buffer.from('first:secret-a').toString('base64')
  const authB = 'Basic ' + Buffer.from('second:secret-b').toString('base64')
  await page.route('**/*rpc', async route => {
    const path = new URL(route.request().url()).pathname
    const auth = route.request().headers().authorization
    calls.push({ path, auth })
    if (auth !== (path === '/other/rpc' ? authB : authA)) { await route.fulfill({ status: 401 }); return }
    const body = route.request().postDataJSON()
    const torrents = createDemoTorrents(path === '/other/rpc' ? 2 : 3)
    torrents.forEach(torrent => { torrent.name = `${path === '/other/rpc' ? '第二服务器' : '第一服务器'}-${torrent.id}` })
    await route.fulfill({ json: { result: 'success', arguments: body.method === 'session-get' ? { version: '4.0.6' } : body.method === 'torrent-get' ? { torrents } : {} } })
  })
  await page.goto('/')
  await page.getByRole('button', { name: '登录 Transmission' }).click()
  await page.getByLabel('用户名', { exact: true }).fill('first')
  await page.getByLabel('密码', { exact: true }).fill('secret-a')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await expect(page.locator('.torrent-row')).toHaveCount(3)
  await page.locator('.torrent-row').first().click()
  await page.getByRole('button', { name: '设置', exact: true }).click({ modifiers: ['Shift'] })
  await expect(page.getByRole('dialog', { name: '切换后端' })).toBeVisible()
  await page.getByLabel('RPC 地址', { exact: true }).fill('/other/rpc')
  await page.getByRole('button', { name: '连接并切换' }).click()
  await expect(page.getByRole('dialog').getByText('认证失败，请检查用户名和密码')).toBeVisible()
  await expect(page.locator('.torrent-row')).toHaveCount(3)
  await page.getByLabel('用户名', { exact: true }).fill('second')
  await page.getByLabel('密码', { exact: true }).fill('secret-b')
  await page.screenshot({ path: '.impeccable/review/backend-dialog.png' })
  await page.getByRole('button', { name: '连接并切换' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.torrent-row')).toHaveCount(2)
  await expect(page.locator('.torrent-name').first()).toContainText('第二服务器')
  await expect(page.locator('.selection-bar')).toHaveCount(0)
  await expect(page.getByLabel('任务详情')).toHaveCount(0)
  expect(calls.filter(call => call.path === '/other/rpc').every(call => call.auth !== authA)).toBe(true)
  const storage = await page.evaluate(() => JSON.stringify(localStorage))
  expect(storage).toContain('/other/rpc')
  expect(storage).not.toMatch(/secret-a|secret-b/)
  await page.reload()
  await expect(page.getByText('认证失败，请检查用户名和密码')).toBeVisible()
  await page.getByRole('button', { name: '设置', exact: true }).click({ modifiers: ['Shift'] })
  await expect(page.getByLabel('RPC 地址', { exact: true })).toHaveValue('/other/rpc')
  await page.getByRole('button', { name: '恢复自动连接' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect.poll(() => calls.at(-1)?.path).toBe('/transmission/rpc')
  expect(calls.at(-1)?.auth).toBeUndefined()
  expect(await page.evaluate(() => localStorage.getItem('transmission-web.v1.connection.override'))).toBe('null')
})

test('手机可通过隐藏地址入口打开切换界面', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?demo=1&backend=1')
  await expect(page.getByRole('dialog', { name: '切换后端' })).toBeVisible()
  await expect(page.getByRole('button', { name: '连接并切换' })).toBeInViewport()
  await page.getByLabel('RPC 地址', { exact: true }).fill('https://user:secret@example.org/rpc')
  await page.getByRole('button', { name: '连接并切换' }).click()
  await expect(page.getByText('地址必须使用 HTTP/HTTPS，且不能包含密码或锚点')).toBeVisible()
  await page.screenshot({ path: '.impeccable/review/backend-mobile.png' })
})
