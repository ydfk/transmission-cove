import { test } from 'node:test'
import assert from 'node:assert/strict'
import { releaseMetadata } from './release-meta.mjs'

test('正式版本、预发布与镜像名称', () => {
  assert.deepEqual(releaseMetadata('v1.2.3', '1.2.3', 'Owner/Transmission-Cove'), { tag: 'v1.2.3', version: '1.2.3', prerelease: false, image: 'ghcr.io/owner/transmission-cove' })
  assert.equal(releaseMetadata('v1.2.3-rc.1', '1.2.3-rc.1').prerelease, true)
})
test('拒绝错配版本和不安全或非规范 Tag', () => {
  assert.throws(() => releaseMetadata('v1.2.3', '1.2.4'), /不一致/)
  for (const tag of ['v01.2.3', '1.2.3', 'v1.2', 'v1.2.3-01', 'v1.2.3+build', 'v1.2.3\nwrong', 'v1.2.3;echo hacked']) assert.throws(() => releaseMetadata(tag, tag.slice(1)))
  assert.throws(() => releaseMetadata('v1.2.3', '1.2.3', 'owner/repo\nwrong'))
})
