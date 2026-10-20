import { useEffect, useRef, useState } from 'react'
import { Modal, TextField } from './forms'
import { FieldGroup } from './ui/field'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { TransmissionClient, validateEndpoint } from '@/lib/rpc'
import { connectionTarget } from '@/lib/connection'
import type { Credentials, Server } from '@/lib/types'

export function BackendDialog({ server, automatic = server, manual, onSwitch, onClose }: { server: Server; automatic?: Server; manual: boolean; onSwitch: (url: string | null, credentials?: Credentials) => void; onClose: () => void }) {
  const [url, setUrl] = useState(server.address ?? server.url)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => request.current?.abort(), [])
  async function connect(event: React.FormEvent) {
    event.preventDefault()
    setError(''); setBusy(true)
    const controller = new AbortController()
    request.current = controller
    try {
      const target = connectionTarget(validateEndpoint(url), automatic)
      const endpoint = target.url
      if (location.protocol === 'https:' && new URL(endpoint, location.href).protocol === 'http:') throw new Error('HTTPS 页面不能连接 HTTP 后端，请使用 HTTPS 或同源代理路径')
      const credentials = username ? { username, password } : undefined
      await new TransmissionClient(target, credentials).connect(controller.signal)
      if (!controller.signal.aborted) onSwitch(target.remoteTarget ?? endpoint, credentials)
    } catch (cause) {
      if (!controller.signal.aborted) {
        const message = (cause as Error).message
        let crossOrigin = false
        try { crossOrigin = new URL(url, location.href).origin !== location.origin } catch { /* 地址校验错误保留原提示。 */ }
        setError(!automatic.remoteProxy && crossOrigin && message.startsWith('连接失败或超时') ? '远程连接失败。请检查网络；如果目标未允许跨域访问，需要通过同源代理连接。你填写的地址尚未生效，原连接保持不变。' : message)
      }
    } finally { if (!controller.signal.aborted) setBusy(false) }
  }
  return <Modal title="切换后端" description="仅影响当前浏览器。地址长期保存，登录在当前标签页刷新后仍有效。" className="compact-dialog" onClose={onClose}>
    <form onSubmit={connect}><FieldGroup className="gap-3">
      <TextField label="RPC 地址" required value={url} disabled={busy} placeholder="http://nas.example:9091/transmission/rpc" onChange={event => setUrl(event.target.value)} description={automatic.remoteProxy ? '填写远程 Transmission 的完整 RPC 地址，将通过内置代理连接。' : '默认连接当前 Transmission。远程地址需允许跨域访问，也可填写同源代理路径。'} />
      <TextField label="用户名" value={username} disabled={busy} autoComplete="off" onChange={event => setUsername(event.target.value)} placeholder="无需认证时留空" />
      <TextField label="密码" type="password" value={password} disabled={busy} autoComplete="off" onChange={event => setPassword(event.target.value)} />
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
    </FieldGroup><div className="form-footer flex-wrap"><Button type="button" variant="outline" disabled={busy || !manual} onClick={() => onSwitch(null)}>恢复自动连接</Button><Button type="submit" disabled={busy}>{busy ? '正在验证…' : '连接并切换'}</Button></div></form>
  </Modal>
}
