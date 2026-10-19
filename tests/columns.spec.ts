import { expect, test } from '@playwright/test'
import { createDemoTorrents } from '../src/lib/demo'

test('完整列、列选择持久化、排序、横向滚动和窄屏', async ({ page }) => {
  await page.goto('/?demo=1')
  await expect(page.locator('.torrent-row').first()).toBeVisible()
  const headers = page.locator('.torrent-header [data-column]')
  expect(await headers.count()).toBe(16)
  const first = page.locator('.torrent-row').first()
  await expect(first.locator('[data-column="have_valid"]')).toContainText('378.9 MiB')
  await expect(first.locator('[data-column="seeders"]')).toHaveText('128')
  await expect(first.locator('[data-column="seconds_seeding"]')).toHaveText('0 秒')
  await expect(first.locator('[data-column="bandwidth_priority"]')).toHaveText('低')
  await page.getByRole('button', { name: '按已上传排序', exact: true }).click()
  await expect(first.locator('[data-column="uploaded_ever"]')).toHaveText('17.5 GiB')
  const table = page.getByRole('table', { name: '下载任务' })
  await table.evaluate(element => { element.scrollLeft = element.scrollWidth })
  await expect(first.locator('[data-column="name"]')).toBeInViewport()
  expect(await table.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
  await page.screenshot({ path: '.impeccable/review/full-columns-scrolled.png', animations: 'disabled' })
  await page.setViewportSize({ width: 2800, height: 960 })
  await table.evaluate(element => { element.scrollLeft = 0 })
  await page.screenshot({ path: '.impeccable/review/full-columns-wide.png', animations: 'disabled' })
  await page.getByRole('button', { name: '显示列', exact: true }).click()
  await page.getByRole('menuitemcheckbox', { name: '用户标签', exact: true }).click()
  await expect(page.getByRole('menuitemcheckbox', { name: '用户标签', exact: true })).toHaveAttribute('aria-checked', 'false')
  await page.getByRole('menuitemcheckbox', { name: '下载目录', exact: true }).click()
  await page.keyboard.press('Escape')
  await page.reload()
  await expect(page.locator('.torrent-header [data-column="labels"]')).toHaveCount(0)
  await expect(page.locator('.torrent-header [data-column="download_dir"]')).toHaveCount(1)
  await page.getByRole('button', { name: '显示列', exact: true }).click()
  await page.getByRole('menuitem', { name: '紧凑列', exact: true }).click()
  await expect(headers).toHaveCount(5)
  await expect(page.getByRole('button', { name: '按大小排序', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '显示列', exact: true }).click()
  await page.getByRole('menuitem', { name: '完整列', exact: true }).click()
  await expect(headers).toHaveCount(16)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(headers).toHaveCount(2)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.setViewportSize({ width: 1440, height: 960 })
  await expect(headers).toHaveCount(16)
})

for (const version of ['4.0.6', '4.1.3']) test(`${version} 列字段和 Tracker 统计分开请求，失败不阻断列表`, async ({ page }) => {
  const modern = version.startsWith('4.1')
  const fields: string[][] = []
  const torrents = createDemoTorrents(3)
  let trackerFailed = false
  const legacy = (value: unknown): unknown => Array.isArray(value) ? value.map(legacy) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), legacy(item)])) : value
  await page.route('**/transmission/rpc', async route => {
    const body = route.request().postDataJSON()
    let result: unknown = {}
    if (body.method === 'session-get' || body.method === 'session_get') result = { version, rpc_version_semver: modern ? '6.0.0' : '5.3.0' }
    if (body.method === 'torrent-get' || body.method === 'torrent_get') {
      const requested = (body.params ?? body.arguments).fields as string[]
      fields.push(requested)
      const counts = requested.includes(modern ? 'tracker_stats' : 'trackerStats')
      if (counts && trackerFailed) { await route.fulfill({ status: 500 }); return }
      result = { torrents: counts ? torrents.map(torrent => ({ hash_string: torrent.hash_string, tracker_stats: torrent.tracker_stats })) : torrents.map(torrent => ({ ...torrent, tracker_stats: undefined })) }
    }
    await route.fulfill({ json: body.jsonrpc ? { jsonrpc: '2.0', id: body.id, result } : { result: 'success', arguments: legacy(result) } })
  })
  await page.goto('/')
  await expect(page.locator('.torrent-row')).toHaveCount(3)
  await expect(page.locator('.torrent-row').first().locator('[data-column="seeders"]')).toHaveText('128')
  const trackerField = modern ? 'tracker_stats' : 'trackerStats'
  expect(fields.find(value => value.includes(modern ? 'have_valid' : 'haveValid'))).not.toContain(trackerField)
  expect(fields.find(value => value.includes(trackerField))).toHaveLength(2)
  trackerFailed = true
  await page.getByRole('button', { name: '刷新任务' }).click()
  await expect(page.locator('.torrent-row').first().locator('[data-column="seeders"]')).toHaveText('—')
  await expect(page.locator('.torrent-row')).toHaveCount(3)
  await expect(page.getByRole('button', { name: '添加任务', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: '显示列', exact: true }).click()
  await page.getByRole('menuitem', { name: '紧凑列', exact: true }).click()
  const previous = fields.filter(value => value.includes(trackerField)).length
  await page.getByRole('button', { name: '刷新任务' }).click()
  await expect(page.getByRole('button', { name: '刷新任务' })).toBeEnabled()
  expect(fields.filter(value => value.includes(trackerField)).length).toBe(previous)
})
