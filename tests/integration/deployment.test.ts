import { describe, expect, it } from 'vitest'

const base = process.env.TR_TEST_WEB_URL
describe.skipIf(!base)('生产静态文件与代理部署', () => {
  it('主页与相对资源可访问，当前上游发现返回固定代理路径与服务器地址', async () => {
    const response = await fetch(base!)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-security-policy')).toContain("connect-src 'self'")
    const html = await response.text()
    const paths = [...html.matchAll(/(?:src|href)="(\.\/assets\/[^\"]+)"/g)].map(match => match[1])
    expect(paths.length).toBeGreaterThanOrEqual(2)
    for (const path of paths) expect((await fetch(new URL(path, base!))).status).toBe(200)
    const server = await fetch(new URL('api/server', base!)).then(result => result.json())
    expect(server.url).toBe('/api/rpc')
    expect(server.managed).toBe(true)
    expect(server.address).toMatch(/^https?:\/\//)
  })
})
