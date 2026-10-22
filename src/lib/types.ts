export type RpcValues = Record<string, unknown>
export interface Server { id: string; name: string; url: string; managed?: boolean; address?: string; remoteProxy?: '/api/remote-rpc'; remoteTarget?: string; updates?: boolean }
export interface SessionStats { current_stats: RpcValues; cumulative_stats: RpcValues }
export interface Credentials { username: string; password: string }
export interface TorrentFile { name: string; length: number; bytes_completed: number }
export interface FileStat { wanted: boolean; priority: number; bytes_completed: number }
export interface Tracker { id: number; announce: string; host: string; tier: number; last_announce_result: string; seeder_count: number; leecher_count: number; next_announce_time: number }
export interface Peer { address: string; client_name: string; progress: number; rate_to_client: number; rate_to_peer: number; flag_str: string; is_encrypted: boolean }
export interface Torrent extends RpcValues {
  id: number; hash_string: string; name: string; status: number; percent_done: number;
  total_size: number; size_when_done: number; rate_download: number; rate_upload: number;
  upload_ratio: number; eta: number; added_date: number; queue_position: number;
  error: number; error_string: string; labels: string[]; download_dir: string;
  peers_connected: number; tracker_list?: string; trackers: { announce: string; id: number }[];
  peers_sending_to_us?: number; peers_getting_from_us?: number;
  files?: TorrentFile[]; file_stats?: FileStat[]; tracker_stats?: Tracker[]; peers?: Peer[];
  downloaded_ever?: number; uploaded_ever?: number; magnet_link?: string; comment?: string;
  have_valid?: number; bandwidth_priority?: number; seconds_seeding?: number; done_date?: number;
}
export interface RpcClient {
  connect(signal?: AbortSignal): Promise<RpcValues>;
  call<T = RpcValues>(method: string, params?: RpcValues, signal?: AbortSignal): Promise<T>;
  modern: boolean;
}
export const LIST_FIELDS = ['id', 'hash_string', 'name', 'status', 'percent_done', 'total_size', 'size_when_done', 'rate_download', 'rate_upload', 'upload_ratio', 'eta', 'added_date', 'queue_position', 'error', 'error_string', 'labels', 'download_dir', 'peers_connected', 'peers_sending_to_us', 'peers_getting_from_us', 'trackers', 'have_valid', 'downloaded_ever', 'uploaded_ever', 'bandwidth_priority', 'seconds_seeding', 'done_date']
export const DETAIL_FIELDS = [...LIST_FIELDS, 'files', 'file_stats', 'tracker_stats', 'tracker_list', 'peers', 'magnet_link', 'comment', 'creator', 'date_created', 'is_private', 'piece_count', 'piece_size', 'have_unchecked', 'download_limit', 'download_limited', 'upload_limit', 'upload_limited', 'honors_session_limits', 'peer_limit', 'seed_ratio_limit', 'seed_ratio_mode', 'seed_idle_limit', 'seed_idle_mode', 'group']
