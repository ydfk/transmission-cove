import { useEffect, useRef, useState } from 'react'
import { Modal, TextField } from './forms'
import { Button } from './ui/button'
import { FieldGroup } from './ui/field'
import { Alert, AlertDescription } from './ui/alert'
import { TransmissionClient } from '@/lib/rpc'
import type { Credentials, Server } from '@/lib/types'

export function LoginDialog({ server, onLogin, onClose }: { server: Server; onLogin: (credentials: Credentials) => void; onClose: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => request.current?.abort(), [])
  async function login(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    const controller = new AbortController()
    request.current = controller
    try {
      const credentials = { username, password }
      await new TransmissionClient(server, credentials).connect(controller.signal)
      if (!controller.signal.aborted) { onLogin(credentials); onClose() }
    } catch (cause) { if (!controller.signal.aborted) setError((cause as Error).message) }
    finally { if (!controller.signal.aborted) setBusy(false) }
  }
  return <Modal title="登录 Transmission" description="验证成功后仅在当前标签页会话中记住登录，刷新无需重新输入。" className="compact-dialog" onClose={onClose}>
    <form onSubmit={login}><FieldGroup className="gap-3"><TextField label="用户名" required disabled={busy} autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} /><TextField label="密码" type="password" disabled={busy} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} />{error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}</FieldGroup><div className="form-footer"><Button type="button" variant="outline" onClick={onClose}>取消</Button><Button type="submit" disabled={busy}>{busy ? '验证中…' : '登录'}</Button></div></form>
  </Modal>
}
