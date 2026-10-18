<div align="center">

<img src="docs/assets/icon.svg" width="56" height="56" alt="Transmission Cove 图标" />

# Transmission Cove

**为 Transmission 打造的现代化 Web 工作台。**

清晰管理下载与做种，让数百个任务井然有序。

</div>

<!-- README-I18N:START -->

**简体中文** | [English](./README.en.md)

<!-- README-I18N:END -->

[功能特性](#features) · [快速开始](#quick-start) · [配置](#configuration) · [文档](#documentation) · [开发](#development)

![Transmission Cove 桌面界面，使用模拟演示数据](docs/screenshots/desktop.png)

Transmission Cove（简称 **Cove**）是面向 Transmission 4.0+ 的第三方 Web 界面，采用 shadcn/ui 风格。它可以直接替换原生 Web 界面，也可以通过 Docker 独立部署，适合在电脑上管理 NAS 中的大量任务。

**沿用现有 Transmission、下载目录和任务，无需迁移数据或重新添加种子。** 本项目与 Transmission 官方没有隶属关系。

<a id="features"></a>
## 功能特性

- **聚焦当前实例** — 自动识别原生 RPC 路径，Docker 默认连接同机 Transmission；沿用已有 RPC 认证。
- **适合大量任务** — 虚拟列表、搜索与排序、跨页批量操作；分页支持预设数量、自定义数量和全部显示。
- **快速定位内容** — 八类任务状态、多层下载目录、标签和 Tracker 组合筛选；分组收起后仍显示已选条件。
- **完整的日常管理** — 添加 Torrent 文件、磁力链接和 URL，拖拽与批量添加，启停、校验、队列调整、重新通告和删除确认。
- **深入管理任务** — 文件选择与优先级、重命名、下载路径、Tracker 编辑、Peers、限速和做种规则；全局设置按 daemon 能力显示。
- **紧凑而清晰** — 可拖动侧栏、可调整列宽、合并指标列、彩色状态图标、传输统计、明暗主题与手机布局。

当前仅支持单服务器；界面语言为简体中文。RSS、自动下载规则、长期历史图表和创建种子不在当前范围。

<a id="quick-start"></a>
## 快速开始

需要一个已运行、允许 RPC 访问的 **Transmission 4.0+** 实例。任选一种部署方式：

| 方式 | 适用场景 | 访问入口 |
| --- | --- | --- |
| 原生 Web 替换 | 群晖套件或本地 NAS，不想增加常驻服务 | 原来的 `/transmission/web/` |
| Docker Compose | 独立部署界面，保留现有 Transmission | `http://localhost:8080` |
| Node.js | 无 Docker，但可以运行 Node.js 22.12+ | `http://localhost:8080` |

### Docker Compose

下载项目源码，在 **Transmission 所在主机**的项目目录运行：

```bash
docker compose up -d --build
```

打开 `http://localhost:8080`，从其他设备访问时将 `localhost` 换为部署主机地址。默认无需创建 `.env` 或填写服务器地址，也不需要挂载下载目录。

> [!NOTE]
> 默认连接宿主机 9091 端口。若 Transmission 仅监听回环地址、使用其他端口/路径，或 RPC 白名单和防火墙阻止容器访问，请按[部署指南](docs/DEPLOYMENT.md)调整。启用认证时仍需输入 Transmission RPC 凭据。

Tag 工作流可发布 amd64 / arm64 镜像到 GHCR；已发布镜像的使用方式见[镜像部署说明](docs/DEPLOYMENT.md#使用-github-发布的镜像)。

### 群晖 / NAS 原生替换

1. 获取 `transmission-cove-<version>-web.zip`，或通过下方命令构建静态文件。
2. 确认并备份现有 Web 目录，按套件支持的方式设置 `TRANSMISSION_WEB_HOME`，或替换原 Web 目录内的文件。
3. 访问原来的 Web 地址，Cove 自动连接当前实例。

```bash
npm ci
npm run build
```

部署的是 `dist/` **内部的文件**，NAS 上不需要 Node.js。群晖的路径确认、权限、备份、更新和回退步骤见[完整安装指南](docs/DEPLOYMENT.md#群晖--本地-nas-原生部署)。

### 本地 Node.js

在 Transmission 所在主机安装 Node.js 22.12+，然后执行：

```bash
npm ci
npm run build
npm start
```

访问 `http://localhost:8080`，默认连接本机 9091 端口。

<a id="configuration"></a>
## 配置

标准同机部署无需修改连接配置。仅在使用非标准地址或端口时设置覆盖项：

| 配置项 | 默认值 | 用途 |
| --- | --- | --- |
| `TRANSMISSION_RPC_URL` | Docker：`http://host.docker.internal:9091/transmission/rpc`；Node：`http://127.0.0.1:9091/transmission/rpc` | 覆盖唯一上游 RPC 地址 |
| `PORT` | `8080` | Node 服务监听端口 |
| `HOST` | `0.0.0.0` | Node 服务监听地址 |
| `TRANSMISSION_WEB_HOME` | 未设置 | Transmission daemon 的静态 Web 目录，供原生替换使用 |

Compose 可读取项目目录的 `.env`，独立 Node 服务使用进程环境变量。完整配置、HTTPS 与访问控制见[部署指南](docs/DEPLOYMENT.md#配置与网络)。

<a id="documentation"></a>
## 文档

以下详细指南目前以简体中文维护。

| 文档 | 内容 |
| --- | --- |
| [部署指南](docs/DEPLOYMENT.md) | 群晖、Docker、Node、更新与回退 |
| [使用与排错](docs/USAGE.md) | 筛选语义、跨页选择、快捷键、RPC 错误 |
| [发布指南](docs/RELEASING.md) | Tag 规则、GitHub Release、GHCR、失败重跑 |
| [开发指南](docs/DEVELOPMENT.md) | 本地演示、浏览器测试、隔离 daemon 联调 |
| [架构](docs/ARCHITECTURE.md) | RPC 兼容层、增量同步、固定上游代理 |
| [验证记录](docs/VALIDATION.md) | 已有证据与尚待目标设备验收的范围 |

<a id="development"></a>
## 开发

基于 React、TypeScript、Vite、shadcn/ui、TanStack Query 和 TanStack Virtual；独立部署使用轻量 Node 代理。

```bash
npm ci
npm run dev
```

访问 `http://127.0.0.1:5173/?demo=1` 查看模拟界面，可追加 `&count=500` 或 `&count=2000`。演示操作不会影响真实 Transmission。开发服务器不代理 RPC，连接真实实例请使用生产 Node 服务。

```bash
npm test
npm run test:release
npm run build
npm run test:e2e
```

浏览器测试默认使用 Microsoft Edge，其他环境的配置见[开发指南](docs/DEVELOPMENT.md)。

<a id="compatibility"></a>
## 兼容性与项目状态

- 面向 Transmission 4.0+；隔离环境已验证 4.0.6 与 4.1.3 的核心 RPC 流程。
- 500 / 2,000 条模拟任务用于列表和交互验证，不代表真实 NAS 的长期负载测试。
- Docker 支持 amd64 与 arm64 构建；真实群晖套件的路径、权限和运行状态仍需在目标设备验收。
- 发布由 `v*` Tag 触发，安装包与镜像以仓库实际发布结果为准；本地通过不等于线上发布完成。

同机自动连接与固定代理的部署方式参考 [jianxcao/transmission-web](https://github.com/jianxcao/transmission-web)。
