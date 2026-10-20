import { readFile, writeFile, appendFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function releaseMetadata(tag, version, repository = '') {
  const match = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(tag ?? '')
  if (!match || match[0] !== tag || tag.length > 128 || match[4]?.split('.').some(part => /^0\d+$/.test(part))) throw new Error('Tag 必须为 v1.2.3 或 v1.2.3-rc.1，不支持构建元数据')
  if (tag.slice(1) !== version) throw new Error(`Tag ${tag} 与 package.json 版本 ${version} 不一致，请先更新版本`)
  if (repository && !/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error('仓库名称无效')
  const image = repository ? `ghcr.io/${repository.toLowerCase()}` : ''
  return { tag, version, prerelease: Boolean(match[4]), image }
}

async function readVersionFiles(directory) {
  const pkg = JSON.parse(await readFile(resolve(directory, 'package.json'), 'utf8'))
  const lock = JSON.parse(await readFile(resolve(directory, 'package-lock.json'), 'utf8'))
  return { pkg, lock }
}

export async function syncReleaseVersion(tag = process.env.RELEASE_TAG, repository = process.env.GITHUB_REPOSITORY, directory = '.') {
  // 先校验 Tag 与文件结构，再写入版本；不执行 npm 生命周期脚本或创建 Git 提交。
  const metadata = releaseMetadata(tag, tag?.slice(1), repository)
  const { pkg, lock } = await readVersionFiles(directory)
  if (!lock.packages?.['']) throw new Error('锁文件缺少根包信息，请使用 npm 生成 package-lock.json')
  pkg.version = lock.version = lock.packages[''].version = metadata.version
  await writeFile(resolve(directory, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`)
  await writeFile(resolve(directory, 'package-lock.json'), `${JSON.stringify(lock, null, 2)}\n`)
  return metadata
}

export async function readReleaseMetadata(tag = process.env.RELEASE_TAG, repository = process.env.GITHUB_REPOSITORY, directory = '.') {
  const { pkg, lock } = await readVersionFiles(directory)
  if (pkg.version !== lock.version || pkg.version !== lock.packages?.['']?.version) throw new Error('package.json 与锁文件版本不一致')
  return releaseMetadata(tag, pkg.version, repository)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const metadata = await (process.argv.includes('--sync') ? syncReleaseVersion() : readReleaseMetadata())
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, Object.entries(metadata).map(([key, value]) => `${key}=${value}\n`).join(''))
  console.log(JSON.stringify(metadata))
}
