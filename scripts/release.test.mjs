import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { releaseMetadata, readReleaseMetadata, syncReleaseVersion } from './release-meta.mjs'

test('正式版本、预发布与镜像名称', () => {
  assert.deepEqual(releaseMetadata('v1.2.3', '1.2.3', 'Owner/Transmission-Cove'), { tag: 'v1.2.3', version: '1.2.3', prerelease: false, image: 'ghcr.io/owner/transmission-cove' })
  assert.equal(releaseMetadata('v1.2.3-rc.1', '1.2.3-rc.1').prerelease, true)
})
test('拒绝错配版本和不安全或非规范 Tag', () => {
  assert.throws(() => releaseMetadata('v1.2.3', '1.2.4'), /不一致/)
  for (const tag of ['v01.2.3', '1.2.3', 'v1.2', 'v1.2.3-01', 'v1.2.3+build', 'v1.2.3\n', 'v1.2.3\nwrong', 'v1.2.3;echo hacked']) assert.throws(() => releaseMetadata(tag, tag.slice(1)))
  assert.throws(() => releaseMetadata('v1.2.3', '1.2.3', 'owner/repo\nwrong'))
})

async function versionFixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'cove-release-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const pkg = { name: 'transmission-cove', version: '0.1.0', scripts: { build: 'vite build' }, dependencies: { react: '^19.2.0' } }
  const lock = { name: pkg.name, version: '0.1.0', lockfileVersion: 3, packages: { '': { name: pkg.name, version: '0.1.0', dependencies: pkg.dependencies }, 'node_modules/react': { version: '19.2.0', integrity: 'fixture-integrity' } } }
  await writeFile(join(directory, 'package.json'), JSON.stringify(pkg))
  await writeFile(join(directory, 'package-lock.json'), JSON.stringify(lock))
  return { directory, pkg, lock }
}

for (const tag of ['v0.0.1', 'v0.2.0-rc.1']) test(`按 ${tag} 同步版本并保留依赖，重复执行结果一致`, async t => {
  const { directory, pkg, lock } = await versionFixture(t)
  const metadata = await syncReleaseVersion(tag, 'Owner/Transmission-Cove', directory)
  const version = tag.slice(1)
  assert.equal(metadata.version, version)
  assert.equal(metadata.prerelease, tag.includes('-'))
  assert.deepEqual(JSON.parse(await readFile(join(directory, 'package.json'), 'utf8')), { ...pkg, version })
  assert.deepEqual(JSON.parse(await readFile(join(directory, 'package-lock.json'), 'utf8')), { ...lock, version, packages: { ...lock.packages, '': { ...lock.packages[''], version } } })
  assert.deepEqual(await readReleaseMetadata(tag, 'Owner/Transmission-Cove', directory), metadata)
  assert.deepEqual(await syncReleaseVersion(tag, 'Owner/Transmission-Cove', directory), metadata)
})

test('非法 Tag 或缺失根包时不修改版本文件', async t => {
  const { directory } = await versionFixture(t)
  const pkgBefore = await readFile(join(directory, 'package.json'), 'utf8')
  const lockBefore = await readFile(join(directory, 'package-lock.json'), 'utf8')
  await assert.rejects(syncReleaseVersion('v01.0.0', '', directory), /Tag/)
  assert.equal(await readFile(join(directory, 'package.json'), 'utf8'), pkgBefore)
  assert.equal(await readFile(join(directory, 'package-lock.json'), 'utf8'), lockBefore)
  await writeFile(join(directory, 'package-lock.json'), '{"version":"0.1.0"}')
  await assert.rejects(syncReleaseVersion('v0.0.1', '', directory), /根包/)
  assert.equal(await readFile(join(directory, 'package.json'), 'utf8'), pkgBefore)
  assert.equal(await readFile(join(directory, 'package-lock.json'), 'utf8'), '{"version":"0.1.0"}')
})

test('打包读取仍拒绝未同步的版本，不在构建完成后静默改版本', async t => {
  const { directory } = await versionFixture(t)
  await assert.rejects(readReleaseMetadata('v0.0.1', '', directory), /不一致/)
})

test('CI 命令同步 v0.0.1 并输出 GitHub 作业元数据', async t => {
  const { directory } = await versionFixture(t)
  const output = join(directory, 'github-output')
  const script = fileURLToPath(new URL('./release-meta.mjs', import.meta.url))
  const stdout = execFileSync(process.execPath, [script, '--sync'], {
    cwd: directory, encoding: 'utf8',
    env: { ...process.env, RELEASE_TAG: 'v0.0.1', GITHUB_REPOSITORY: 'Owner/Transmission-Cove', GITHUB_OUTPUT: output },
  })
  const metadata = await readReleaseMetadata('v0.0.1', 'Owner/Transmission-Cove', directory)
  assert.deepEqual(JSON.parse(stdout), metadata)
  assert.equal(await readFile(output, 'utf8'), 'tag=v0.0.1\nversion=0.0.1\nprerelease=false\nimage=ghcr.io/owner/transmission-cove\n')
})
