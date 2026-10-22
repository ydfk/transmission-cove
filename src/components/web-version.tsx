import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpCircle, ExternalLink, RefreshCw } from 'lucide-react'
import { Modal, TextField } from './forms'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { FieldGroup } from './ui/field'
import { checkWebUpdate, installWebUpdate } from '@/lib/web-updates'
import { newerVersion, releasesPage } from '../../shared/releases.mjs'
import { version } from '../../package.json'

const guide = 'https://github.com/ydfk/transmission-cove/blob/main/docs/UPDATING.md'
export function WebVersion({ service = false, demo }: { service?: boolean; demo: boolean }) {
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const query = useQuery({
    queryKey: ['web-update', service], queryFn: ({ signal }) => checkWebUpdate(service, signal), enabled: !demo || open,
    retry: false, staleTime: 6 * 60 * 60 * 1000, refetchOnWindowFocus: false,
    refetchInterval: query => query.state.data?.job?.state === 'running' || submitted ? 2000 : 6 * 60 * 60 * 1000,
  })
  const data = query.data, release = data?.latest
  const newer = !!release && newerVersion(release.version, version)
  const running = submitting || data?.job?.state === 'running'
  const installed = !!data?.current && newerVersion(data.current, version)
  const canInstall = !demo && newer && data?.canInstall && release?.installable && !installed
  async function install(event: React.FormEvent) {
    event.preventDefault()
    if (!release || running) return
    setSubmitting(true); setError('')
    try { await installWebUpdate(release.tag, key); setSubmitted(true); await query.refetch() }
    catch (cause) { setError(cause instanceof Error ? cause.message : '更新请求失败，请先检查状态再重试'); await query.refetch() }
    finally { setSubmitting(false); setKey('') }
  }
  // 不把短暂网络失败视为安装失败；轮询停止条件由服务端结果决定。
  const finished = data?.job?.state === 'succeeded' || data?.job?.state === 'failed' || installed
  useEffect(() => { if (finished) setSubmitted(false) }, [finished])
  return <>
    <Button variant="ghost" size="sm" className="status-web-version" aria-label={`Web ${version}${newer ? '，有新版本' : '，检查更新'}`} onClick={() => setOpen(true)}>
      Web {version}{newer ? <><ArrowUpCircle data-icon="inline-end" /><span>有新版</span></> : null}
    </Button>
    {open ? <Modal title="Web 版本" description="检查 Transmission Cove 更新。" className="compact-dialog" onClose={() => { setOpen(false); setKey('') }}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3"><p>当前 {version}</p><Badge variant="secondary">{query.isFetching ? '检查中…' : newer ? `新版 ${release?.version}` : query.isError ? '检查失败' : release ? '已是最新稳定版或更新版本' : '等待检查'}</Badge></div>
        {query.error ? <Alert variant="destructive"><AlertDescription>{query.error.message}{submitted ? '。更新结果暂时未知，请恢复连接后检查，勿重复执行。' : ''}</AlertDescription></Alert> : null}
        {release?.notes ? <div className="max-h-52 overflow-y-auto whitespace-pre-wrap break-words text-sm text-muted-foreground">{release.notes}</div> : null}
        {running ? <Alert><AlertDescription>正在更新，请保留页面。Transmission 的下载与做种继续运行。</AlertDescription></Alert> : installed ? <Alert><AlertDescription>已安装 Web {data?.current}，刷新页面以加载新版。</AlertDescription></Alert> : data?.job?.state === 'failed' ? <Alert variant="destructive"><AlertDescription>{data.job.error}</AlertDescription></Alert> : null}
        {!canInstall && !installed && !running ? <p className="text-sm text-muted-foreground">{demo ? '演示模式仅查看版本。' : '当前部署不支持在页面内更新，请按部署方式更新。原生覆盖版重新运行安装脚本，Docker 更新镜像。'}</p> : null}
        {canInstall && !running ? <form onSubmit={install}><FieldGroup><TextField label="更新密钥" type="password" required autoComplete="off" value={key} onChange={event => setKey(event.target.value)} description="使用部署时设置的更新密钥，仅用于此次操作，不保存。更新仅替换 Web 文件。" /></FieldGroup>{error ? <Alert variant="destructive" className="mt-3"><AlertDescription>{error}</AlertDescription></Alert> : null}<div className="form-footer"><Button type="submit" disabled={query.isError || submitting}>一键更新至 {release?.version}</Button></div></form> : error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        <div className="flex flex-wrap gap-2">
          {installed ? <Button onClick={() => location.reload()}>刷新页面</Button> : null}
          <Button variant="outline" onClick={() => { setError(''); void query.refetch() }} disabled={query.isFetching || submitting}><RefreshCw data-icon="inline-start" />检查更新</Button>
          <Button variant="outline" asChild><a href={release?.url ?? releasesPage} target="_blank" rel="noopener noreferrer">发布页面<ExternalLink data-icon="inline-end" /></a></Button>
          <Button variant="ghost" asChild><a href={guide} target="_blank" rel="noopener noreferrer">更新指南</a></Button>
        </div>
      </div>
    </Modal> : null}
  </>
}
