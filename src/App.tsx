import { lazy, Suspense, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HardDrive, Menu, LogOut, Moon, Plus, RefreshCw, Search, Sun, X } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Sidebar, filters } from '@/components/sidebar'
import { TorrentTable, type Sort } from '@/components/torrent-table'
import { LoginDialog } from '@/components/login-dialog'
import { BatchActions } from '@/components/batch-actions'
import { ColumnPicker } from '@/components/column-picker'
import { compareTorrents, fullColumns, validColumns } from '@/lib/torrent-columns'
import { ListPagination } from '@/components/list-pagination'
import { nativeServer, discoverServer, manualServer, connectionTarget } from '@/lib/connection'
import { paginate, validPageSize } from '@/lib/pagination'
import { ActionDialog } from '@/components/action-dialog'
import { useTransmission } from '@/hooks/use-transmission'
import { TransmissionClient, RpcError } from '@/lib/rpc'
import { DemoClient } from '@/lib/demo'
import { readStored, writeStored } from '@/lib/storage'
import { matches, emptyFilters } from '@/lib/filters'
import { Statusbar } from '@/components/statusbar'
import type { Credentials, RpcClient, RpcValues, Server } from '@/lib/types'

const AddDialog = lazy(() => import('@/components/add-dialog').then(module => ({ default: module.AddDialog })))
const DetailPanel = lazy(() => import('@/components/detail-panel').then(module => ({ default: module.DetailPanel })))
const SettingsDialog = lazy(() => import('@/components/settings-dialog').then(module => ({ default: module.SettingsDialog })))
const BackendDialog = lazy(() => import('@/components/backend-dialog').then(module => ({ default: module.BackendDialog })))

interface WorkspaceProps { server: Server; client: RpcClient; demo: boolean; onAuthenticate: () => void; onDemo: (active: boolean) => void; onBackend: () => void }
function Workspace({ server, client, demo, onAuthenticate, onDemo, onBackend }: WorkspaceProps) {
  const [filter, setFilter] = useState(emptyFilters)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [selected, setSelected] = useState(new Set<string>())
  const [focused, setFocused] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(() => validPageSize(readStored('pageSize', 50)))
  const [sort, setSort] = useState<Sort>({ key: 'added_date', descending: true })
  const [visible, setVisible] = useState<string[]>(() => validColumns(readStored('columns.compact.visible', fullColumns)))
  const { session, torrents: query, statistics, refresh, mutation } = useTransmission(client, visible.some(key => ['seeders', 'leechers'].includes(key)) || ['seeders', 'leechers'].includes(sort.key))
  const torrents = query.data ?? []
  const [modal, setModal] = useState<'add' | 'settings' | null>(null)
  const [action, setAction] = useState<{ name: string; hashes: string[] } | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [sidebar, setSidebar] = useState(false)
  const [dark, setDark] = useState(() => readStored('dark', window.matchMedia('(prefers-color-scheme: dark)').matches))
  const connected = session.isSuccess && query.isSuccess && !query.isError
  const busy = mutation.isPending
  const error = session.error ?? query.error
  const aliveSelected = new Set([...selected].filter(hash => torrents.some(t => t.hash_string === hash)))
  const rows = useMemo(() => torrents.filter(t => matches(t, filter) && `${t.name} ${t.hash_string} ${t.labels?.join(' ')}`.toLowerCase().includes(deferredSearch.toLowerCase())).sort((a, b) => compareTorrents(a, b, sort.key, sort.descending)), [torrents, filter, deferredSearch, sort])
  const pagination = paginate(rows.length, page, pageSize)
  const pageRows = rows.slice(pagination.start, pagination.end)
  useEffect(() => { if (page !== pagination.page) setPage(pagination.page) }, [page, pagination.page])
  // 筛选重置应优先于数据减少时的页码校正。
  useEffect(() => { setPage(1) }, [filter, deferredSearch, sort, pageSize])
  const totalDownload = torrents.reduce((sum, t) => sum + t.rate_download, 0)
  const totalUpload = torrents.reduce((sum, t) => sum + t.rate_upload, 0)
  const title = filter.status === 'all' ? '全部任务' : filters.find(item => item.key === filter.status)?.label ?? '任务'
  const hasFilters = filter.label !== null || filter.tracker !== null || filter.directory !== null
  const execute = (method: string, params?: RpcValues) => mutation.mutateAsync({ method, params })
  function onAction(name: string, hashes: string[]) {
    if (!hashes.length || busy || !connected) return
    if (['remove', 'location', 'labels'].includes(name)) { setAction({ name, hashes }); return }
    void execute(name, { ids: hashes }).catch(() => {})
  }
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); writeStored('dark', dark) }, [dark])
  useEffect(() => () => { toast.dismiss() }, [])
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || modal || action || (event.target as HTMLElement).closest('input,textarea,[contenteditable], [role="dialog"], [role="alertdialog"]')) return
      if (event.key === '/' || (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey))) { event.preventDefault(); document.getElementById('task-search')?.focus() }
      if (event.key === 'Escape') { setSelected(new Set()); setFocused(null) }
    }
    document.addEventListener('keydown', keydown); return () => document.removeEventListener('keydown', keydown)
  }, [modal, action])
  return <div className="app-shell" onDragOver={event => { if (event.dataTransfer.types.includes('Files')) event.preventDefault() }} onDrop={event => { event.preventDefault(); if (!connected) return; setFiles(Array.from(event.dataTransfer.files)); setModal('add') }}>
    <Toaster theme={dark ? 'dark' : 'light'} richColors closeButton position="top-right" duration={3000} visibleToasts={2} />
    <Sidebar stats={statistics.data} statsFailed={statistics.isError} torrents={torrents} filter={filter} onFilter={value => { setFilter(value); setSidebar(false) }} connected={connected} onSettings={event => { if (event.shiftKey) { if (!busy) onBackend(); else toast.info('请等待当前操作完成') } else if (connected) setModal('settings'); else toast.info('连接成功后可修改 Transmission 设置') }} open={sidebar} />
    {sidebar ? <button className="sidebar-backdrop" aria-label="关闭导航" onClick={() => setSidebar(false)} /> : null}
    <main className="workspace"><header className="topbar compact-topbar"><div className="workspace-title"><Button variant="ghost" size="icon" className="mobile-menu" aria-label="打开导航" onClick={() => setSidebar(!sidebar)}><Menu /></Button><h1>{title}<span>{rows.length}</span></h1><span className="connection-status"><span className={connected ? 'connection-dot online' : 'connection-dot'} /><span className="connection-label">{connected ? '已连接' : session.isPending ? '连接中' : '未连接'}</span></span>{demo ? <Badge variant="secondary">演示数据</Badge> : null}</div><div className="header-actions">{demo ? <Button variant="ghost" size="icon-sm" aria-label="退出演示" onClick={() => onDemo(false)}><LogOut /></Button> : null}<Button variant="ghost" size="icon-sm" aria-label={dark ? '切换浅色主题' : '切换深色主题'} onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</Button><Button variant="ghost" size="icon-sm" aria-label="刷新任务" disabled={query.isFetching || session.isFetching} onClick={() => { void session.refetch(); void refresh() }}><RefreshCw className={query.isFetching ? 'animate-spin' : ''} /></Button></div></header>
      {hasFilters ? <div className="active-filter-bar"><span title={[filter.directory, filter.label, filter.tracker].filter(value => value !== null).join(' · ')}>{[filter.directory, filter.label, filter.tracker].filter(value => value !== null).map(value => value || '未知目录').join(' · ')}</span><Button variant="ghost" size="sm" onClick={() => setFilter(emptyFilters)}>清除全部筛选<X data-icon="inline-end" /></Button></div> : null}
      <div className="task-toolbar"><div className="toolbar-search"><Button className="add-task" aria-label="添加任务" disabled={!connected} onClick={() => { setFiles([]); setModal('add') }}><Plus data-icon="inline-start" /><span className="add-label">添加任务</span></Button><div className="search-box"><Search /><Input id="task-search" aria-label="搜索任务" placeholder="搜索名称、标签或 Hash…" value={search} onChange={event => setSearch(event.target.value)} /><kbd>/</kbd></div></div><BatchActions disabled={!aliveSelected.size || busy || !connected} onAction={name => onAction(name, [...aliveSelected])} /><div className="toolbar-spacer" /><ColumnPicker visible={visible} onChange={next => { setVisible(next); writeStored('columns.compact.visible', next) }} /></div>
      {aliveSelected.size ? <div className="selection-bar"><span>已选择 <strong>{aliveSelected.size}</strong> 个任务{aliveSelected.size > pageRows.filter(t => aliveSelected.has(t.hash_string)).length ? '（包含其他页或筛选外任务）' : ''}</span><Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>取消选择<X data-icon="inline-end" /></Button></div> : null}
      {error ? <Alert variant="destructive" className="connection-error"><AlertTitle>无法连接 Transmission</AlertTitle><AlertDescription>{error.message}<div className="flex flex-wrap gap-2 mt-3">{error instanceof RpcError && error.status === 401 ? <Button variant="outline" size="sm" onClick={onAuthenticate}>登录 Transmission</Button> : null}<Button variant="outline" size="sm" onClick={() => { void session.refetch(); void refresh() }}>重新连接</Button>{!demo ? <Button variant="ghost" size="sm" onClick={() => onDemo(true)}>体验演示界面</Button> : null}</div></AlertDescription></Alert> : null}
      {session.isPending || (session.isSuccess && query.isPending) ? <div className="loading-list" aria-label="正在加载任务">{Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div> : !connected && !torrents.length ? <Empty className="flex-1"><EmptyHeader><EmptyMedia variant="icon"><HardDrive /></EmptyMedia><EmptyTitle>等待当前 Transmission</EmptyTitle><EmptyDescription>已自动尝试连接当前实例，请确认 Transmission 正在运行并允许 RPC 访问。</EmptyDescription></EmptyHeader><EmptyContent><Button onClick={() => { void session.refetch(); void refresh() }}>重试连接</Button></EmptyContent></Empty> : <TorrentTable key={`${pagination.page}:${pageSize}:${JSON.stringify(filter)}:${deferredSearch}:${sort.key}:${sort.descending}`} torrents={pageRows} selected={aliveSelected} onSelect={setSelected} focused={focused} onFocus={setFocused} sort={sort} onSort={setSort} visible={visible} onAction={onAction} disabled={busy || !connected} />}
      <ListPagination total={rows.length} {...pagination} size={pageSize} onPage={setPage} onSize={size => { setPageSize(size); writeStored('pageSize', size) }} />
      <Suspense fallback={<Skeleton className="h-48" />}>{focused && connected && torrents.some(t => t.hash_string === focused) ? <DetailPanel key={focused} hash={focused} client={client} execute={execute} pending={busy} onClose={() => setFocused(null)} /> : null}</Suspense>
      <Statusbar session={session.data} download={totalDownload} upload={totalUpload} server={server} demo={demo} disabled={!connected || busy} onToggle={() => { void execute('session_set', { alt_speed_enabled: !session.data?.alt_speed_enabled }).catch(() => {}) }} />
    </main>
    <Suspense fallback={null}>{modal === 'add' && session.data ? <AddDialog client={client} session={session.data} files={files} onClose={() => setModal(null)} onAdded={refresh} /> : null}
    {modal === 'settings' && session.data ? <SettingsDialog session={session.data} client={client} execute={execute} pending={busy} onClose={() => setModal(null)} /> : null}
    {action ? <ActionDialog action={action.name} hashes={action.hashes} initialDirectory={String(torrents.find(t => t.hash_string === action.hashes[0])?.download_dir ?? '')} initialLabels={action.hashes.length === 1 ? torrents.find(t => t.hash_string === action.hashes[0])?.labels.join(', ') ?? '' : ''} execute={execute} pending={busy} onClose={() => setAction(null)} /> : null}</Suspense>
  </div>
}

function ConnectedWorkspace(props: Omit<WorkspaceProps, 'client'> & { credentials?: Credentials }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: true }, mutations: { retry: false } } }))
  const [client] = useState<RpcClient>(() => props.demo ? new DemoClient() : new TransmissionClient(props.server, props.credentials))
  useEffect(() => () => { void queryClient.cancelQueries(); queryClient.clear() }, [queryClient])
  return <QueryClientProvider client={queryClient}><Workspace {...props} client={client} /></QueryClientProvider>
}
export default function App() {
  const [server, setServer] = useState(() => nativeServer(location.pathname))
  const [override, setOverride] = useState(() => manualServer(readStored('connection.override', null)))
  const [backend, setBackend] = useState(new URLSearchParams(location.search).get('backend') === '1')
  const [credentials, setCredentials] = useState<Credentials>()
  const [epoch, setEpoch] = useState(0)
  const [manage, setManage] = useState(false)
  const [ready, setReady] = useState(false)
  const [demo, setDemo] = useState(new URLSearchParams(location.search).get('demo') === '1')
  useEffect(() => {
    const controller = new AbortController()
    discoverServer(location.pathname, fetch, AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]))
      .then(current => { if (!controller.signal.aborted) setServer(current) })
      .catch(() => {}).finally(() => { if (!controller.signal.aborted) setReady(true) })
    return () => controller.abort()
  }, [])
  function login(auth: Credentials) {
    setCredentials(auth); setDemo(false); setEpoch(value => value + 1)
  }
  function switchBackend(url: string | null, auth?: Credentials) {
    writeStored('connection.override', url)
    setOverride(manualServer(url)); setCredentials(auth); setDemo(false); setManage(false); setBackend(false); setEpoch(value => value + 1)
  }
  if (!ready && !demo) return <div className="loading-list" aria-label="正在读取连接配置"><Skeleton className="h-12 w-full" /></div>
  const current = override ? connectionTarget(override.url, server) : server
  return <><ConnectedWorkspace key={`${current.id}:${epoch}:${demo}`} server={current} credentials={credentials} demo={demo} onDemo={setDemo} onAuthenticate={() => setManage(true)} onBackend={() => setBackend(true)} />{manage ? <LoginDialog onLogin={login} onClose={() => setManage(false)} /> : null}<Suspense fallback={null}>{backend ? <BackendDialog server={current} automatic={server} manual={!!override} onSwitch={switchBackend} onClose={() => setBackend(false)} /> : null}</Suspense></>
}
