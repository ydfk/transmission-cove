import { expect, test } from '@playwright/test'
import { createDemoTorrents } from '../src/lib/demo'

test('401 自动验证、失败留在弹窗、刷新复用登录、失效后重新验证', async ({ page }) => {
  const authorization = 'Basic ' + Buffer.from('tester:tab-session-fixture').toString('base64')
  let revoked = false
  const calls: (string | undefined)[] = []
  await page.route('**/transmission/rpc', async route => {
    const auth = route.request().headers().authorization
    calls.push(auth)
    if (revoked || auth !== authorization) return route.fulfill({ status: 401 })
    const body = route.request().postDataJSON()
    return route.fulfill({ json: { result: 'success', arguments: body.method === 'session-get' ? { version: '4.0.6' } : body.method === 'torrent-get' ? { torrents: createDemoTorrents(2) } : {} } })
  })
  await page.goto('/')
  const dialog = page.getByRole('dialog', { name: '登录 Transmission' })
  await expect(dialog).toBeVisible()
  await page.getByLabel('用户名', { exact: true }).fill('tester')
  await page.getByLabel('密码', { exact: true }).fill('incorrect-fixture')
  await dialog.getByRole('button', { name: '登录', exact: true }).click()
  await expect(dialog.getByText('认证失败，请检查用户名和密码')).toBeVisible()
  expect(await page.evaluate(() => sessionStorage.getItem('transmission-web.v1.auth.session'))).toBeNull()
  await page.getByLabel('密码', { exact: true }).fill('tab-session-fixture')
  await dialog.getByRole('button', { name: '登录', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.locator('.torrent-row')).toHaveCount(2)
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('tab-session-fixture')
  calls.length = 0
  await page.reload()
  await expect(page.locator('.torrent-row')).toHaveCount(2)
  await expect(dialog).toHaveCount(0)
  expect(calls.every(auth => auth === authorization)).toBe(true)
  revoked = true
  await page.getByRole('button', { name: '刷新任务' }).click()
  await expect(dialog).toBeVisible()
  expect(await page.evaluate(() => sessionStorage.getItem('transmission-web.v1.auth.session'))).toBeNull()
  await dialog.getByRole('button', { name: '取消' }).click()
  await expect(dialog).toHaveCount(0)
})

test('其他后端的标签页凭据不会发送到当前默认实例', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('transmission-web.v1.auth.session', JSON.stringify({ endpoint: 'http://other.example:9091/transmission/rpc', credentials: { username: 'other', password: 'other-fixture' } })))
  const auth: (string | undefined)[] = []
  await page.route('**/transmission/rpc', route => { auth.push(route.request().headers().authorization); return route.fulfill({ status: 401 }) })
  await page.goto('/')
  await expect(page.getByRole('dialog', { name: '登录 Transmission' })).toBeVisible()
  expect(auth.length).toBeGreaterThan(0)
  expect(auth.every(value => value === undefined)).toBe(true)
})
