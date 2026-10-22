export const releaseApi = 'https://api.github.com/repos/ydfk/transmission-cove/releases/latest'
export const releasesPage = 'https://github.com/ydfk/transmission-cove/releases'

export function parseVersion(value) {
  if (typeof value !== 'string' || value.length > 128) return null
  const match = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(value)
  if (!match || match[0] !== value || match[4]?.split('.').some(part => /^0\d+$/.test(part))) return null
  return { numbers: match.slice(1, 4).map(BigInt), pre: match[4]?.split('.') ?? [] }
}
export function newerVersion(candidate, current) {
  const a = parseVersion(candidate), b = parseVersion(current)
  if (!a || !b) return false
  for (let i = 0; i < 3; i++) if (a.numbers[i] !== b.numbers[i]) return a.numbers[i] > b.numbers[i]
  if (!a.pre.length || !b.pre.length) return !a.pre.length && !!b.pre.length
  for (let i = 0; i < Math.max(a.pre.length, b.pre.length); i++) {
    if (a.pre[i] === b.pre[i]) continue
    if (a.pre[i] === undefined || b.pre[i] === undefined) return b.pre[i] === undefined
    const numericA = /^\d+$/.test(a.pre[i]), numericB = /^\d+$/.test(b.pre[i])
    if (numericA && numericB) return BigInt(a.pre[i]) > BigInt(b.pre[i])
    if (numericA !== numericB) return numericB
    return a.pre[i] > b.pre[i]
  }
  return false
}
export function releaseInfo(value) {
  if (!value || value.draft || value.prerelease || typeof value.tag_name !== 'string' || !value.tag_name.startsWith('v')) throw new Error('发布信息无效')
  const parsed = parseVersion(value.tag_name)
  if (!parsed || parsed.pre.length) throw new Error('发布版本无效')
  const tag = value.tag_name, version = tag.slice(1)
  const names = new Set(Array.isArray(value.assets) ? value.assets.map(asset => asset.name) : [])
  return { tag, version, url: `${releasesPage}/tag/${tag}`, notes: typeof value.body === 'string' ? value.body.slice(0, 12000) : '', installable: names.has(`transmission-cove-${version}-web.tar.gz`) && names.has('SHA256SUMS') }
}
