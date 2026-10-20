# 架构

## 前端

React + TypeScript + Vite，shadcn/ui 组件，TanStack Query 管理请求，TanStack Virtual 管理列表。静态资源使用相对路径，可挂载于 /transmission/web/。

内部统一使用 snake_case 字段模型。连接时读取 session-get，4.1 使用 JSON-RPC 2.0；4.0 按方法映射字段名，并显式处理 cache-size-mb、peer-limit、seedRatioLimit 和 tolerated 等例外。读取按列表和详情拆分，列表使用 recently-active 增量合并并周期全量校准。页面隐藏时放缓刷新。

请求必须有超时，409 最多重试一次。变更请求遇到网络错误不自动重试，避免重复添加或重复删除。使用 torrent hash 作为操作身份，防止 daemon 重启后的数字 ID 重用。空操作集合在客户端拒绝。

每次连接一个服务器。默认自动连接，Shift 点击设置或 `?backend=1` 打开隐藏的手动切换入口。验证新地址成功后重建客户端和缓存，清除弹窗、选择、详情及旧凭据；失败时保留原连接。localStorage 保存界面偏好及一个手动 RPC 地址；sessionStorage 仅保存当前目标验证成功的凭据，按规范化 RPC 地址匹配，刷新可恢复登录，存储不可用时回退到内存。401 自动打开认证窗口并清除失效凭据，恢复自动连接时清除手动地址及凭据；旧多服务器存储不再读取。演示数据仅由显式演示入口启用。

状态、目录、标签和 Tracker 以交集筛选；目录通过路径分隔符匹配后代，逐级聚合数量。状态计数基于全部任务，统计每 10 秒读取 session_stats；隐藏页面时放缓到 30 秒。统计失败单独提示，不阻断任务列表。

分页在筛选、排序之后进行，默认 50 条并保留全部模式，页内仍虚拟渲染。选择使用全局 hash 集合，表头只改变当前页集合；数据删除后夹紧页码，筛选/排序变化优先回到第一页。合并表头仍为各指标保留排序入口。

## 部署

静态模式从当前 /transmission/web/ 路径推导 /transmission/rpc，自定义 /custom/web/ 会推导 /custom/rpc；不请求独立服务的发现接口，默认不展示服务器配置表单。原生版隐藏入口中的手动地址由浏览器直接请求，跨域受浏览器与服务端策略约束；可按需提供同源反向代理路径。独立服务的 CSP `connect-src` 允许 HTTP/HTTPS 请求，其他指令保持同源限制。

独立模式使用轻量 Node 静态服务器与代理（Docker 多阶段构建）。TRANSMISSION_RPC_URL 覆盖自动连接默认上游，优先于兼容 JSON 文件；没有配置时 Node / 开发版使用 127.0.0.1:9091，Docker 使用宿主机 9091。仅 Docker 内部宿主机别名先解析为 IPv4 后请求，避免 Host 白名单拒绝；认证与 IP 白名单保持不变。多个默认上游配置会报错。GET /api/server 提供默认地址、固定路径 /api/rpc 和远程代理能力，界面在发现结束后开始连接。开发中间件复用同一代理，仅接受本机 Host；隔离 e2e 模式禁用代理。

手动完整地址通过同源 /api/remote-rpc 转发，目标由 X-Cove-Rpc-Target 请求头携带，不写入全局配置、不转发该头给上游。仅允许 POST JSON、已知 Transmission RPC 方法和以 /rpc 结尾的 HTTP/HTTPS 地址；拒绝 URL 凭据、锚点、跨站请求、无 Origin 请求及重定向。认证与 409 会话头按请求透传，不存储上游密码；客户端独立维护会话，切换后丢弃旧凭据和缓存。两种代理均限制 24 MiB 请求体和 20 秒上游超时。

远程代理可访问服务主机能够连接的 RPC 地址，Origin 检查不是用户认证。服务应部署在可信网络，或由已有反向代理提供访问控制。容器以非 root 用户运行。无外部字体、CDN 或统计依赖。

## 资料

- https://github.com/transmission/transmission/blob/4.0.6/docs/rpc-spec.md
- https://github.com/transmission/transmission/blob/4.1.3/docs/rpc-spec.md
- https://ui.shadcn.com/docs
