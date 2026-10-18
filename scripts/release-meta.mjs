import { readFile, appendFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function releaseMetadata(tag, version, repository = '') {
  const match = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(tag ?? '')
  if (!match || tag.length > 128 || match[4]?.split('.').some(part => /^0\d+$/.test(part))) throw new Error('Tag 必须为 v1.2.3 或 v1.2.3-rc.1，不支持构建元数据')
  if (tag.slice(1) !== version) throw new Error(`Tag ${tag} 与 package.json 版本 ${version} 不一致，请先更新版本`)
  if (repository && !/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error('仓库名称无效')
  const image = repository ? `ghcr.io/${repository.toLowerCase()}` : ''
  return { tag, version, prerelease: Boolean(match[4]), image }
}

export async function readReleaseMetadata(tag = process.env.RELEASE_TAG, repository = process.env.GITHUB_REPOSITORY) {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'))
  const lock = JSON.parse(await readFile('package-lock.json', 'utf8'))
  if (pkg.version !== lock.version || pkg.version !== lock.packages?.['']?.version) throw new Error('package.json 与锁文件版本不一致')
  return releaseMetadata(tag, pkg.version, repository)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const metadata = await readReleaseMetadata()
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, Object.entries(metadata).map(([key, value]) => `${key}=${value}\n`).join(''))
  console.log(JSON.stringify(metadata))
}
