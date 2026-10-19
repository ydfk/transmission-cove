import { expect, test } from '@playwright/test'
import { createDemoTorrents } from '../src/lib/demo'

test('未活动计数与列表排除暂停任务，并随任务状态变化更新', async ({ page }) => {
  const fixtures = [
    { name: '暂停下载', status: 0, percent_done: 0.4, rate_upload: 0, rate_download: 0 },
    { name: '暂停做种', status: 0, percent_done: 1, rate_upload: 0, rate_download: 0 },
    { name: '空闲做种', status: 6, percent_done: 1, rate_upload: 0, rate_download: 0 },
    { name: '等待数据', status: 4, percent_done: 0.4, rate_upload: 0, rate_download: 0 },
    { name: '正在上传', status: 6, percent_done: 1, rate_upload: 100, rate_download: 0 },
    { name: '正在下载', status: 4, percent_done: 0.4, rate_upload: 0, rate_download: 100 },
  ]
  const torrents = createDemoTorrents(fixtures.length).map((torrent, index) => ({ ...torrent, ...fixtures[index], error: 0 }))
  await page.route('**/transmission/rpc', async route => {
    const body = route.request().postDataJSON()
    await route.fulfill({ json: { result: 'success', arguments: body.method === 'session-get' ? { version: '4.0.6' } : body.method === 'torrent-get' ? { torrents } : {} } })
  })
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: '任务筛选' })
  const inactive = nav.getByRole('button', { name: /^未活动/ })
  await expect(inactive.locator('.nav-count')).toHaveText('2')
  await expect(nav.getByRole('button', { name: /^已暂停/ }).locator('.nav-count')).toHaveText('2')
  await inactive.click()
  await expect(page.locator('.torrent-row')).toHaveCount(2)
  await expect(page.locator('.torrent-name')).toHaveText(['空闲做种', '等待数据'])
  await expect(page.getByRole('heading', { name: '未活动 2' })).toBeVisible()

  // 模拟 daemon 增量刷新：空闲任务被暂停，另一任务开始上传。
  torrents[2].status = 0
  torrents[3].rate_upload = 100
  await expect(inactive.locator('.nav-count')).toHaveText('0', { timeout: 10000 })
  await expect(page.locator('.torrent-row')).toHaveCount(0)
  await expect(nav.getByRole('button', { name: /^已暂停/ }).locator('.nav-count')).toHaveText('3')
  await expect(nav.getByRole('button', { name: /^活动中/ }).locator('.nav-count')).toHaveText('3')
})
