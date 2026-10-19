const methods = new Set([
  'session_get', 'session_set', 'session_stats', 'torrent_get', 'torrent_add', 'torrent_set',
  'torrent_start', 'torrent_start_now', 'torrent_stop', 'torrent_remove', 'torrent_verify',
  'torrent_reannounce', 'torrent_set_location', 'torrent_rename_path', 'queue_move_top',
  'queue_move_up', 'queue_move_down', 'queue_move_bottom', 'group_get', 'group_set',
  'free_space', 'port_test', 'blocklist_update',
])

export function remoteRpcTarget(input, payload) {
  if (typeof input !== 'string' || !/^https?:\/\//i.test(input)) throw new Error('请填写完整 HTTP/HTTPS RPC 地址')
  const url = new URL(input)
  if (url.username || url.password || url.hash) throw new Error('RPC 地址不得包含凭据或锚点')
  // 动态入口仅转发 Transmission RPC，禁止重定向和通用 HTTP 隧道。
  if (!url.pathname.endsWith('/rpc')) throw new Error('远程地址应以 /rpc 结尾，例如 /transmission/rpc')
  if (!payload || Array.isArray(payload) || typeof payload.method !== 'string' || !methods.has(payload.method.replaceAll('-', '_'))) throw new Error('仅允许 Transmission RPC 方法')
  const params = payload.jsonrpc === '2.0' ? payload.params : payload.arguments
  if (params !== undefined && (!params || typeof params !== 'object' || Array.isArray(params))) throw new Error('RPC 参数必须是对象')
  return url.href
}
