import { expect, test } from '@playwright/test'

test('旧版脚本下线后，点击任务行或勾选框仍可打开详情', async ({ page }) => {
  await page.goto('/?demo=1')
  const rows = page.locator('.torrent-row')
  await expect(rows.first()).toBeVisible()

  // 模拟工作台已打开，随后部署替换了旧版脚本。
  await page.route('**/*', route => route.request().resourceType() === 'script' ? route.fulfill({ status: 404 }) : route.fallback())
  const navigations: string[] = []
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations.push(frame.url()) })
  const detail = page.getByRole('region', { name: '任务详情' })
  await rows.first().getByRole('cell').nth(1).click()
  await expect(detail.locator('.overview-grid')).toBeVisible()
  await detail.getByRole('button', { name: '关闭详情' }).click()

  await rows.nth(1).getByRole('checkbox').click()
  await expect(detail.locator('.overview-grid')).toBeVisible()
  await expect(rows.nth(1)).toHaveAttribute('aria-selected', 'true')
  expect(navigations).toEqual([])
})

test('紧凑详情、旧目录偏好不再自动展开、速度旁显示生效限速', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('transmission-web.v1.sidebar.目录分布', 'true'))
  await page.goto('/?demo=1')
  await expect(page.getByRole('button', { name: '展开目录分布', exact: true })).toBeVisible()
  await expect(page.getByRole('list', { name: '目录筛选' })).toHaveCount(0)
  await page.locator('.torrent-row').first().click()
  const detail = page.getByRole('region', { name: '任务详情' })
  await expect(detail.locator('.overview-grid')).toBeVisible()
  expect((await detail.boundingBox())!.height).toBe(280)
  await page.screenshot({ path: '.impeccable/review/detail-compact-desktop.png', animations: 'disabled' })
  await detail.getByRole('tab', { name: '选项', exact: true }).click()
  await expect(detail.locator('.settings-grid')).toHaveAttribute('data-compact', 'true')
  await page.screenshot({ path: '.impeccable/review/detail-options-desktop.png', animations: 'disabled' })
  await page.getByRole('button', { name: '切换备用限速' }).click()
  await expect(page.getByLabel('下载速度与限速')).toContainText('/ 500 kB/s')
  await expect(page.getByLabel('上传速度与限速')).toContainText('/ 100 kB/s')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: '切换深色主题' }).click()
  await page.screenshot({ path: '.impeccable/review/detail-options-mobile.png', animations: 'disabled' })
  await detail.getByRole('tab', { name: '概览', exact: true }).click()
  await page.screenshot({ path: '.impeccable/review/detail-compact-mobile.png', animations: 'disabled' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  for (const label of ['下载速度与限速', '上传速度与限速']) await expect(page.getByLabel(label)).toBeInViewport()
})
