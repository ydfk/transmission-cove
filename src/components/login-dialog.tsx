import { useState } from 'react'
import { Modal, TextField } from './forms'
import { Button } from './ui/button'
import { FieldGroup } from './ui/field'
import type { Credentials } from '@/lib/types'

export function LoginDialog({ onLogin, onClose }: { onLogin: (credentials: Credentials) => void; onClose: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  return <Modal title="登录 Transmission" description="请输入当前服务器的 RPC 凭据。凭据仅保存在本次页面会话。" onClose={onClose}>
    <form onSubmit={event => { event.preventDefault(); onLogin({ username, password }); onClose() }}><FieldGroup><TextField label="用户名" required autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} /><TextField label="密码" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} /></FieldGroup><div className="form-footer"><Button type="button" variant="outline" onClick={onClose}>取消</Button><Button type="submit">登录</Button></div></form>
  </Modal>
}
