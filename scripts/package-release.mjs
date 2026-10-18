import { mkdir, readdir, readFile, writeFile, stat, rm, rename } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { readReleaseMetadata } from './release-meta.mjs'

const { version } = await readReleaseMetadata()
await stat('dist/index.html')
await stat('dist/assets')
await mkdir('artifacts', { recursive: true })
const base = `transmission-cove-${version}-web`
const archives = [`${base}.zip`, `${base}.tar.gz`]
// ZIP 通过临时文件创建，防止重复打包保留旧资源；原有安装包不受失败构建影响。
const zipPath = resolve(`artifacts/${base}.pending.zip`)
await rm(zipPath, { force: true })
if (process.platform === 'win32') execFileSync('tar', ['-a', '-cf', zipPath, '-C', 'dist', '.'], { stdio: 'inherit' })
else execFileSync('zip', ['-q', '-r', zipPath, 'index.html', 'assets'], { cwd: 'dist', stdio: 'inherit' })
await rename(zipPath, resolve(`artifacts/${archives[0]}`))
execFileSync('tar', ['-czf', `artifacts/${archives[1]}`, '-C', 'dist', 'index.html', 'assets'], { stdio: 'inherit' })
const checksums = await Promise.all(archives.map(async name => `${createHash('sha256').update(await readFile(`artifacts/${name}`)).digest('hex')}  ${name}`))
await writeFile('artifacts/SHA256SUMS', `${checksums.join('\n')}\n`)
console.log(`已生成 ${archives.join('、')} 和 SHA256SUMS；dist 资源数量 ${ (await readdir('dist/assets')).length }`)
