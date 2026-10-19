import type { RpcClient, RpcValues, Torrent } from './types'

export function createDemoTorrents(count = 428): Torrent[] {
  const names = ['Ubuntu 24.04.3 Desktop amd64.iso', 'Blender 4.5 — Open Movie Collection', 'Debian 13.0.0 amd64 DVD-1.iso', 'NASA — Earth Observatory 2025', 'Fedora Workstation Live x86_64.iso', 'Big Buck Bunny · 4K', 'Arch Linux x86_64.iso', 'Wikimedia Commons — Nature Archive']
  return Array.from({ length: count }, (_, i) => {
    const status = i % 11 === 0 ? 0 : i % 13 === 0 ? 2 : i % 7 === 0 ? 3 : i % 3 === 0 ? 4 : 6
    const progress = status === 6 ? 1 : ((i * 17 + 37) % 99) / 100
    const size = (1 + i % 14) * 1024 ** 3
    const name = names[i % names.length] + (i >= names.length ? ` (${Math.floor(i / names.length) + 1})` : '')
    return {
      id: i + 1, hash_string: (i + 1).toString(16).padStart(40, '0'), name, status,
      percent_done: progress, total_size: size, size_when_done: size,
      rate_download: status === 4 ? 234000 + i * 1500 : 0, rate_upload: status === 6 ? 83000 + i * 900 : 0,
      upload_ratio: status === 6 ? (i % 16 + 3) / 4 : 0.12, eta: status === 4 ? 1800 + i * 20 : -1,
      added_date: 1760000000 - i * 3600, queue_position: i, error: i === 8 ? 2 : 0,
      error_string: i === 8 ? '演示：Tracker 暂时不可用' : '', labels: [i % 3 === 0 ? '系统镜像' : i % 3 === 1 ? '开放影像' : '资料归档'],
      download_dir: ['/volume1/downloads/系统镜像/Linux', '/volume1/downloads/影像/开源动画', '/volume1/downloads/资料', '/volume1/downloads/影像/自然', '/volume2/archive'][i % 5], peers_connected: status === 0 ? 0 : i % 24 + 1,
      trackers: [{ id: 0, announce: 'https://tracker.example.org/announce' }],
      tracker_list: 'https://tracker.example.org/announce',
      tracker_stats: [{ id: 0, host: 'tracker.example.org', announce: 'https://tracker.example.org/announce', tier: 0, last_announce_result: 'Success', seeder_count: i === 8 ? -1 : 128 + i, leecher_count: i === 8 ? -1 : i % 33, next_announce_time: Date.now() / 1000 + 900 }],
      files: [{ name: `${name}/content.iso`, length: size, bytes_completed: size * progress }, { name: `${name}/README.txt`, length: 4096, bytes_completed: 4096 }],
      file_stats: [{ wanted: true, priority: 0, bytes_completed: size * progress }, { wanted: true, priority: 0, bytes_completed: 4096 }],
      peers: [{ address: '192.0.2.12', client_name: 'Transmission 4.1.3', progress: 1, rate_to_client: 125000, rate_to_peer: 34000, flag_str: 'DE', is_encrypted: true }],
      downloaded_ever: size * progress, uploaded_ever: size * 1.25, magnet_link: `magnet:?xt=urn:btih:${(i + 1).toString(16).padStart(40, '0')}`,
      have_valid: Math.floor(size * progress), seconds_seeding: status === 6 ? 86400 * (i % 8 + 1) + i * 3600 : 0, done_date: status === 6 ? 1760000000 - i * 3600 + 1800 : 0,
      bandwidth_priority: i % 3 - 1, download_limit: 1000, download_limited: false, upload_limit: 1000, upload_limited: false,
      honors_session_limits: true, peer_limit: 50, seed_ratio_limit: 2, seed_ratio_mode: 0, seed_idle_limit: 30, seed_idle_mode: 0, group: '', comment: '仅用于界面演示的模拟任务。',
    }
  })
}

export class DemoClient implements RpcClient {
  modern = true
  torrents = createDemoTorrents([500, 2000].includes(Number(new URLSearchParams(location.search).get('count'))) ? Number(new URLSearchParams(location.search).get('count')) : 428)
  session: RpcValues = { version: '4.1.3 · 演示', download_dir: '/volume1/downloads', incomplete_dir: '/volume1/downloads/incomplete', incomplete_dir_enabled: false, start_added_torrents: true, rename_partial_files: true, trash_original_torrent_files: false, speed_limit_down_enabled: false, speed_limit_down: 10000, speed_limit_up_enabled: false, speed_limit_up: 2000, alt_speed_enabled: false, alt_speed_down: 500, alt_speed_up: 100, alt_speed_time_enabled: false, alt_speed_time_begin: 540, alt_speed_time_end: 1020, alt_speed_time_day: 127, download_queue_enabled: true, download_queue_size: 5, seed_queue_enabled: false, seed_queue_size: 20, queue_stalled_enabled: true, queue_stalled_minutes: 30, seed_ratio_limited: false, seed_ratio_limit: 2, idle_seeding_limit_enabled: false, idle_seeding_limit: 30, peer_port: 51413, peer_port_random_on_start: false, port_forwarding_enabled: true, peer_limit_global: 200, peer_limit_per_torrent: 50, encryption: 'preferred', dht_enabled: true, pex_enabled: true, lpd_enabled: false, utp_enabled: true, blocklist_enabled: false, blocklist_url: '', blocklist_size: 0, cache_size_mib: 4, default_trackers: '', sequential_download: false }
  async connect() { return this.session }
  async call<T = RpcValues>(method: string, params: RpcValues = {}): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, 90))
    const selected = this.torrents.filter(t => Array.isArray(params.ids) && params.ids.includes(t.hash_string))
    let result: RpcValues = {}
    if (method === 'session_get') result = this.session
    else if (method === 'session_set') Object.assign(this.session, params)
    else if (method === 'torrent_get') result = { torrents: Array.isArray(params.ids) ? selected : this.torrents, removed: [] }
    else if (method === 'torrent_remove') this.torrents = this.torrents.filter(t => !selected.includes(t))
    else if (method === 'torrent_add') {
      const t = createDemoTorrents(1)[0]; t.id = Date.now(); t.hash_string = t.id.toString(16).padStart(40, '0'); t.name = String(params.filename || '演示添加的 Torrent'); t.status = params.paused ? 0 : 4; t.percent_done = 0
      this.torrents = [t, ...this.torrents]; result = { torrent_added: t }
    } else if (method === 'torrent_set') {
      selected.forEach(t => {
        Object.entries(params).filter(([k]) => k !== 'ids' && !k.startsWith('files_') && !k.startsWith('priority_')).forEach(([k, v]) => { t[k] = v })
        ;['files_wanted', 'files_unwanted', 'priority_high', 'priority_normal', 'priority_low'].forEach(key => {
          if (Array.isArray(params[key])) (params[key] as number[]).forEach(i => { const stat = t.file_stats?.[i]; if (stat) { if (key.startsWith('files_')) stat.wanted = key === 'files_wanted'; else stat.priority = key === 'priority_high' ? 1 : key === 'priority_low' ? -1 : 0 } })
        })
      })
    } else if (method === 'torrent_set_location') selected.forEach(t => { t.download_dir = String(params.location) })
    else if (method === 'torrent_rename_path') selected.forEach(t => { t.files?.forEach(f => { if (f.name === params.path) f.name = f.name.slice(0, f.name.lastIndexOf('/') + 1) + params.name }) })
    else if (['torrent_start', 'torrent_start_now', 'torrent_stop', 'torrent_verify'].includes(method)) selected.forEach(t => { t.status = method === 'torrent_stop' ? 0 : method === 'torrent_verify' ? 2 : t.percent_done === 1 ? 6 : 4 })
    else if (method.startsWith('queue_')) selected.forEach(t => { t.queue_position = method.endsWith('top') ? 0 : method.endsWith('bottom') ? this.torrents.length - 1 : Math.max(0, t.queue_position + (method.endsWith('up') ? -1 : 1)) })
    else if (method === 'free_space') result = { size_bytes: 2.4 * 1024 ** 4 }
    else if (method === 'port_test') result = { port_is_open: true }
    else if (method === 'blocklist_update') result = { blocklist_size: 1200 }
    else if (method === 'session_stats') result = { current_stats: { uploaded_bytes: 360 * 1024 ** 3, downloaded_bytes: 124 * 1024 ** 3, seconds_active: 142200, files_added: 24, session_count: 1 }, cumulative_stats: { uploaded_bytes: 12 * 1024 ** 4, downloaded_bytes: 4 * 1024 ** 4, seconds_active: 7645300, files_added: 428, session_count: 162 } }
    else if (method === 'group_get') result = { group: [] }
    return structuredClone(result) as T
  }
}
