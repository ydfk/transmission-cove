import type { Setting } from '@/components/forms'
export const sessionSettings: Record<string, Setting[]> = {
  '下载': [
    { key: 'download_dir', label: '默认下载目录', type: 'text' }, { key: 'start_added_torrents', label: '添加后立即开始' },
    { key: 'incomplete_dir_enabled', label: '使用未完成目录' }, { key: 'incomplete_dir', label: '未完成目录', type: 'text' },
    { key: 'rename_partial_files', label: '未完成文件添加 .part 后缀' }, { key: 'trash_original_torrent_files', label: '移除原始种子文件' },
    { key: 'sequential_download', label: '默认顺序下载' }, { key: 'cache_size_mib', label: '磁盘缓存（MiB）' },
    { key: 'default_trackers', label: '默认 Tracker', type: 'textarea', hint: '每行一个地址，空行分隔分组。' },
  ],
  '带宽': [
    { key: 'speed_limit_down_enabled', label: '限制下载速度' }, { key: 'speed_limit_down', label: '下载上限（kB/s）' },
    { key: 'speed_limit_up_enabled', label: '限制上传速度' }, { key: 'speed_limit_up', label: '上传上限（kB/s）' },
    { key: 'alt_speed_enabled', label: '启用备用速度' }, { key: 'alt_speed_down', label: '备用下载上限（kB/s）' }, { key: 'alt_speed_up', label: '备用上传上限（kB/s）' },
    { key: 'alt_speed_time_enabled', label: '定时启用备用速度' }, { key: 'alt_speed_time_begin', label: '开始时间（服务器时区）', type: 'time' }, { key: 'alt_speed_time_end', label: '结束时间（服务器时区）', type: 'time' }, { key: 'alt_speed_time_day', label: '生效日期', type: 'days' },
  ],
  '队列与做种': [
    { key: 'download_queue_enabled', label: '限制同时下载任务数' }, { key: 'download_queue_size', label: '同时下载数量', min: 1 },
    { key: 'seed_queue_enabled', label: '限制同时做种任务数' }, { key: 'seed_queue_size', label: '同时做种数量', min: 1 },
    { key: 'queue_stalled_enabled', label: '忽略停滞任务的队列占用' }, { key: 'queue_stalled_minutes', label: '停滞判定（分钟）', min: 1 },
    { key: 'seed_ratio_limited', label: '达到分享率后停止做种' }, { key: 'seed_ratio_limit', label: '目标分享率', step: 0.01 },
    { key: 'idle_seeding_limit_enabled', label: '空闲时停止做种' }, { key: 'idle_seeding_limit', label: '空闲时限（分钟）', min: 1 },
  ],
  '连接': [
    { key: 'peer_port', label: 'Peer 端口', min: 1, max: 65535 }, { key: 'peer_port_random_on_start', label: '启动时随机端口' },
    { key: 'port_forwarding_enabled', label: 'UPnP / NAT-PMP 端口映射' }, { key: 'peer_limit_global', label: '全局 Peer 上限', min: 1 }, { key: 'peer_limit_per_torrent', label: '每任务 Peer 上限', min: 1 },
    { key: 'encryption', label: '加密模式', options: [['required', '必须加密'], ['preferred', '优先加密'], ['allowed', '允许未加密']] },
    { key: 'dht_enabled', label: 'DHT 分布式哈希表' }, { key: 'pex_enabled', label: 'PEX 用户交换' }, { key: 'lpd_enabled', label: '本地 Peer 发现' }, { key: 'utp_enabled', label: 'µTP 传输' },
    { key: 'blocklist_enabled', label: '启用 IP 屏蔽列表' }, { key: 'blocklist_url', label: '屏蔽列表 URL', type: 'text' }, { key: 'anti_brute_force_enabled', label: 'RPC 防暴力破解' },
  ],
  '脚本': [
    { key: 'script_torrent_added_enabled', label: '添加后运行脚本' }, { key: 'script_torrent_added_filename', label: '添加脚本路径', type: 'text' },
    { key: 'script_torrent_done_enabled', label: '下载完成后运行脚本' }, { key: 'script_torrent_done_filename', label: '完成脚本路径', type: 'text' },
    { key: 'script_torrent_done_seeding_enabled', label: '做种结束后运行脚本' }, { key: 'script_torrent_done_seeding_filename', label: '做种结束脚本路径', type: 'text' },
  ],
}
export const torrentSettings: Setting[] = [
  { key: 'bandwidth_priority', label: '带宽优先级', options: [['1', '高'], ['0', '普通'], ['-1', '低']] },
  { key: 'group', label: '带宽组名称', type: 'text' }, { key: 'honors_session_limits', label: '遵循全局限速' },
  { key: 'download_limited', label: '限制下载速度' }, { key: 'download_limit', label: '下载上限（kB/s）' },
  { key: 'upload_limited', label: '限制上传速度' }, { key: 'upload_limit', label: '上传上限（kB/s）' },
  { key: 'seed_ratio_mode', label: '做种分享率规则', options: [['0', '遵循全局'], ['1', '自定义'], ['2', '无限制']] }, { key: 'seed_ratio_limit', label: '目标分享率', step: 0.01 },
  { key: 'seed_idle_mode', label: '空闲停止规则', options: [['0', '遵循全局'], ['1', '自定义'], ['2', '无限制']] }, { key: 'seed_idle_limit', label: '空闲时限（分钟）', min: 1 },
  { key: 'peer_limit', label: 'Peer 上限', min: 1 }, { key: 'sequential_download', label: '顺序下载' },
]
