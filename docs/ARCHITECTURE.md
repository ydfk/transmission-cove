# 架构

## 前端

React + TypeScript + Vite，shadcn/ui 组件，TanStack Query 管理请求，TanStack Virtual 管理列表。静态资源使用相对路径，可挂载于 /transmission/web/。

内部统一使用 snake_case 字段模型。连接时读取 session-get，4.1 使用 JSON-RPC 2.0；4.0 按方法映射字段名，并显式处理 cache-size-mb、peer-limit、seedRatioLimit 和 tolerated 等例外。读取按列表和详情拆分，列表使用 recently-active 增量合并并周期全量校准。页面隐藏时放缓刷新。

请求必须有超时，409 最多重试一次。变更请求遇到网络错误不自动重试，避免重复添加或重复删除。使用 torrent hash 作为操作身份，防止 daemon 重启后的数字 ID 重用。空操作集合在客户端拒绝。

仅支持当前服务器。重新认证时重建客户端和缓存，清除弹窗、选择、详情。只持久化界面偏好（含侧栏宽度和每页数量），凭据仅在内存；旧多服务器存储不再读取。演示数据仅由显式演示入口启用。

状态、目录、标签和 Tracker 以交集筛选；目录通过路径分隔符匹配后代，逐级聚合数量。状态计数基于全部任务，统计每 10 秒读取 session_stats；隐藏页面时放缓到 30 秒。统计失败单独提示，不阻断任务列表。

分页在筛选、排序之后进行，默认 50 条并保留全部模式，页内仍虚拟渲染。选择使用全局 hash 集合，表头只改变当前页集合；数据删除后夹紧页码，筛选/排序变化优先回到第一页。合并表头仍为各指标保留排序入口。

## 部署

静态模式从当前 /transmission/web/ 路径推导 /transmission/rpc，自定义 /custom/web/ 会推导 /custom/rpc；无服务器配置表单。跨域连接受浏览器与服务端策略约束，前端不能绕过。

独立模式使用轻量 Node 静态服务器与代理（Docker 多阶段构建）。TRANSMISSION_RPC_URL 指定唯一上游，优先于兼容 JSON 文件；没有配置时 Node 使用 127.0.0.1:9091，Docker 使用宿主机 9091。仅 Docker 内部宿主机别名先解析为 IPv4 后请求，避免 Host 白名单拒绝；认证与 IP 白名单保持不变。多个上游配置会报错。GET /api/server 提供当前上游地址与固定代理路径 /api/rpc，界面在发现结束后开始连接。上游不接受浏览器提供的任意 URL；不存储上游密码，认证由浏览器会话提交。限制请求大小、超时、重定向和跨站请求。容器以非 root 用户运行。无外部字体、CDN 或统计依赖。

## 资料

- https://github.com/transmission/transmission/blob/4.0.6/docs/rpc-spec.md
- https://github.com/transmission/transmission/blob/4.1.3/docs/rpc-spec.md
- https://ui.shadcn.com/docs
