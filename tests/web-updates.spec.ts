import { expect, test, type Page } from '@playwright/test'
import { createDemoTorrents } from '../src/lib/demo'
import { releaseApi } from '../shared/releases.mjs'

const release = { tag_name: 'v9.1.0', body: '改进任务列表与版本更新。', assets: [{ name: 'transmission-cove-9.1.0-web.tar.gz' }, { name: 'SHA256SUMS' }] }
const latest = { tag: 'v9.1.0', version: '9.1.0', notes: release.body, installable: true, url: 'https://github.com/ydfk/transmission-cove/releases/tag/v9.1.0' }
async function rpc(page: Page) {
  await page.route('**/*rpc', route => {
    const { method } = route.request().postDataJSON()
    return route.fulfill({ json: { result: 'success', arguments: method === 'session-get' ? { version: '4.0.6' } : method === 'torrent-get' ? { torrents: createDemoTorrents(2) } : {} } })
  })
}

test('原生页面显示新版，提供指引；手机底栏和弹窗不溢出', async ({ page }) => {
  await rpc(page)
  await page.route(releaseApi, route => {
    expect(route.request().headers().authorization).toBeUndefined()
    return route.fulfill({ json: release })
  })
  await page.goto('/transmission/web/')
  const version = page.getByRole('button', { name: /Web .*有新版本/ })
  await expect(version).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await version.click()
  await expect(page.getByText(release.body)).toBeVisible()
  await expect(page.getByRole('link', { name: '更新指南' })).toBeVisible()
  await expect(page.getByRole('button', { name: /一键更新/ })).toHaveCount(0)
  const dialog = await page.getByRole('dialog').boundingBox()
  expect(dialog!.x).toBeGreaterThanOrEqual(0)
  expect(dialog!.x + dialog!.width).toBeLessThanOrEqual(390)
  await page.screenshot({ path: 'test-results/web-update-mobile.png', fullPage: true })
})

test('独立服务更新需密钥，失败可重试，完成后刷新且不持久化密钥', async ({ page }) => {
  await rpc(page)
  await page.route('**/api/server', route => route.fulfill({ json: { id: 'current', name: '当前 Transmission', managed: true, url: '/api/rpc', address: 'http://127.0.0.1:9091/transmission/rpc', updates: true } }))
  let installed = false, attempts = 0
  await page.route('**/api/updates', route => route.fulfill({ json: { latest, canInstall: true, current: installed ? '9.1.0' : '0.1.0', job: { state: installed ? 'succeeded' : 'idle' } } }))
  await page.route('**/api/updates/install', route => {
    attempts++
    expect(route.request().postDataJSON()).toEqual({ tag: latest.tag })
    if (attempts === 1) return route.fulfill({ status: 401, json: { error: '更新密钥不正确' } })
    expect(route.request().headers()['x-cove-update-key']).toBe('fixture-update-key')
    installed = true
    return route.fulfill({ status: 202, json: { state: 'running' } })
  })
  await page.goto('/')
  await page.getByRole('button', { name: /Web .*有新版本/ }).click()
  await page.getByLabel('更新密钥', { exact: true }).fill('incorrect')
  await page.getByRole('button', { name: /一键更新至/ }).click()
  await expect(page.getByText('更新密钥不正确')).toBeVisible()
  await page.getByLabel('更新密钥', { exact: true }).fill('fixture-update-key')
  await page.getByRole('button', { name: /一键更新至/ }).click()
  await expect(page.getByText('已安装 Web 9.1.0，刷新页面以加载新版。')).toBeVisible()
  await expect(page.getByRole('button', { name: '刷新页面', exact: true })).toBeVisible()
  expect(await page.evaluate(() => JSON.stringify([localStorage, sessionStorage]))).not.toContain('fixture-update-key')
  expect(attempts).toBe(2)
  await page.screenshot({ path: 'test-results/web-update-desktop.png', fullPage: true })
})

test('版本检查失败可手动恢复，不阻塞任务列表', async ({ page }) => {
  await rpc(page)
  let failing = true
  await page.route(releaseApi, route => failing ? route.fulfill({ status: 503 }) : route.fulfill({ json: release }))
  await page.goto('/transmission/web/')
  await expect(page.locator('.torrent-row')).toHaveCount(2)
  await page.getByRole('button', { name: /Web .*检查更新/ }).click()
  await expect(page.getByText('检查失败，请检查网络或稍后重试')).toBeVisible()
  failing = false
  await page.getByRole('button', { name: '检查更新', exact: true }).click()
  await expect(page.getByText('新版 9.1.0', { exact: true })).toBeVisible()
})
