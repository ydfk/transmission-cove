import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Modal, SettingsForm, TextField } from './forms'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { sessionSettings } from '@/lib/settings'
import { bytes, duration } from '@/lib/format'
import type { RpcClient, RpcValues } from '@/lib/types'

function Groups({ client, execute, pending }: { client: RpcClient; execute: (method: string, params?: RpcValues) => Promise<unknown>; pending: boolean }) {
  const groups = useQuery({ queryKey: ['groups'], queryFn: () => client.call<{ group: RpcValues[] }>('group_get') })
  const [name, setName] = useState('')
  const [active, setActive] = useState<RpcValues | null>(null)
  return <div className="flex flex-col gap-4"><p className="muted text-sm">带宽组可由多个任务共用。在任务选项中填写相同组名即可分配。</p><div className="flex flex-wrap gap-2">{groups.data?.group?.map(group => <Button key={String(group.name)} variant="outline" onClick={() => { setName(String(group.name)); setActive(group) }}>{String(group.name)}</Button>)}</div>{groups.error ? <Alert variant="destructive"><AlertDescription>{groups.error.message}</AlertDescription></Alert> : null}<form className="flex items-end gap-2" onSubmit={event => { event.preventDefault(); setActive({ name: name.trim(), honors_session_limits: true, speed_limit_down_enabled: false, speed_limit_down: 1000, speed_limit_up_enabled: false, speed_limit_up: 1000 }) }}><TextField label="带宽组名称" required value={name} onChange={event => setName(event.target.value)} /><Button variant="outline">新建 / 编辑</Button></form>{active ? <SettingsForm key={String(active.name)} initial={active} settings={[{ key: 'honors_session_limits', label: '遵循全局限速' }, ...sessionSettings['带宽'].slice(0, 4)]} pending={pending} onSave={async patch => { await execute('group_set', { ...patch, name: active.name }); await groups.refetch() }} /> : null}</div>
}
function Statistics({ client }: { client: RpcClient }) {
  const stats = useQuery({ queryKey: ['statistics'], queryFn: () => client.call<{ current_stats: RpcValues; cumulative_stats: RpcValues }>('session_stats'), refetchInterval: 10000 })
  if (stats.error) return <Alert variant="destructive"><AlertDescription>{stats.error.message}</AlertDescription></Alert>
  if (!stats.data) return <p className="muted">正在读取统计…</p>
  return <div className="data-table-wrap"><table className="data-table"><thead><tr><th>统计项</th><th>本次会话</th><th>累计</th></tr></thead><tbody>{[['downloaded_bytes', '下载总量'], ['uploaded_bytes', '上传总量'], ['files_added', '添加任务'], ['seconds_active', '运行时间']].map(([key, label]) => <tr key={key}><td>{label}</td>{[stats.data.current_stats, stats.data.cumulative_stats].map((value, index) => <td key={index}>{key.endsWith('bytes') ? bytes(Number(value[key])) : key === 'seconds_active' ? duration(Number(value[key])) : String(value[key] ?? '—')}</td>)}</tr>)}</tbody></table></div>
}
export function SettingsDialog({ session, client, execute, pending, onClose }: { session: RpcValues; client: RpcClient; execute: (method: string, params?: RpcValues) => Promise<unknown>; pending: boolean; onClose: () => void }) {
  const [testing, setTesting] = useState(false)
  async function check(method: string) {
    setTesting(true)
    try { const result = await client.call(method); toast.success(method === 'port_test' ? result.port_is_open ? '端口可从外部访问' : '端口未开放，请检查网络和映射' : `屏蔽列表已更新：${result.blocklist_size} 条`) } catch (error) { toast.error((error as Error).message) } finally { setTesting(false) }
  }
  return <Modal title="Transmission 设置" description={`服务器版本 ${String(session.version)} · 仅显示当前版本支持的设置`} onClose={onClose} wide><Tabs defaultValue="下载"><TabsList className="settings-tabs">{[...Object.keys(sessionSettings), '带宽组', '统计'].map(tab => <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>)}</TabsList>{Object.entries(sessionSettings).map(([tab, settings]) => <TabsContent key={tab} value={tab} className="pt-5">{tab === '脚本' ? <Alert className="mb-5"><AlertDescription>填写的是 NAS 上已有脚本的绝对路径，由 Transmission 的运行账户执行。</AlertDescription></Alert> : null}<SettingsForm settings={settings} initial={session} pending={pending} onSave={params => execute('session_set', params)} />{tab === '连接' ? <div className="flex flex-wrap gap-2"><Button disabled={testing} variant="outline" onClick={() => check('port_test')}>测试端口</Button><Button disabled={testing} variant="outline" onClick={() => check('blocklist_update')}>更新屏蔽列表</Button><span className="muted self-center text-xs">当前 {Number(session.blocklist_size ?? 0)} 条规则</span></div> : null}</TabsContent>)}<TabsContent value="带宽组" className="pt-5"><Groups client={client} execute={execute} pending={pending} /></TabsContent><TabsContent value="统计" className="pt-5"><Statistics client={client} /></TabsContent></Tabs></Modal>
}
