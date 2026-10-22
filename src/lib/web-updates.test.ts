import { expect, it, vi, afterEach } from 'vitest'
import { newerVersion, parseVersion, releaseInfo } from '../../shared/releases.mjs'
import { checkWebUpdate } from './web-updates'

afterEach(() => vi.unstubAllGlobals())
it('语义版本比较不会按字符串排序或提示降级', () => {
  for (const [next, current] of [['0.10.0', '0.9.9'], ['1.0.0', '1.0.0-rc.1'], ['1.0.0-rc.10', '1.0.0-rc.2']]) expect(newerVersion(next, current)).toBe(true)
  for (const [next, current] of [['0.0.1', '0.1.0'], ['1.0.0', '1.0.0'], ['1.0.0-rc.1', '1.0.0'], ['bad', '1.0.0']]) expect(newerVersion(next, current)).toBe(false)
  for (const version of ['1.0.0\n', '01.0.0', '1.0.0-01', '1.0.0+build']) expect(parseVersion(version)).toBeNull()
})
it('仅接受稳定发布，链接固定为项目仓库，安装需要完整资产', () => {
  const release = { tag_name: 'v0.2.0', body: '<script>untrusted</script>', html_url: 'https://other.example' }
  expect(releaseInfo(release)).toMatchObject({ version: '0.2.0', url: 'https://github.com/ydfk/transmission-cove/releases/tag/v0.2.0', installable: false })
  expect(releaseInfo({ ...release, assets: [{ name: 'transmission-cove-0.2.0-web.tar.gz' }, { name: 'SHA256SUMS' }] }).installable).toBe(true)
  for (const invalid of [{ ...release, draft: true }, { ...release, prerelease: true }, { tag_name: 'v0.2.0-rc.1' }]) expect(() => releaseInfo(invalid)).toThrow()
})
it('查询 GitHub 不携带 Transmission 的同源认证或更新密钥', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ tag_name: 'v0.2.0' }))
  vi.stubGlobal('fetch', fetcher)
  expect((await checkWebUpdate(false)).latest.version).toBe('0.2.0')
  expect(fetcher.mock.calls[0][1].credentials).toBe('omit')
  expect(fetcher.mock.calls[0][1].headers).toEqual({ Accept: 'application/json' })
})
