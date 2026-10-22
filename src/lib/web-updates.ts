import { releaseApi, releaseInfo, type ReleaseInfo } from '../../shared/releases.mjs'
import { requestUrl } from './request-url'

export interface UpdateStatus { latest: ReleaseInfo; canInstall: boolean; current?: string | null; job?: { state: 'idle' | 'running' | 'succeeded' | 'failed'; tag?: string; error?: string } }
export async function checkWebUpdate(service: boolean, signal?: AbortSignal): Promise<UpdateStatus> {
  const response = await fetch(service ? requestUrl('/api/updates') : releaseApi, {
    credentials: service ? 'same-origin' : 'omit', headers: { Accept: 'application/json' },
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(response.status === 404 ? '暂无稳定发布版本' : '检查失败，请检查网络或稍后重试')
  const value = await response.json()
  return service ? value as UpdateStatus : { latest: releaseInfo(value), canInstall: false }
}
export async function installWebUpdate(tag: string, key: string): Promise<void> {
  const response = await fetch(requestUrl('/api/updates/install'), { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Cove-Update-Key': key }, body: JSON.stringify({ tag }), signal: AbortSignal.timeout(20000) })
  if (!response.ok) {
    const result = await response.json().catch(() => null)
    throw new Error(result?.error ?? '无法开始更新，请重新检查状态')
  }
}
