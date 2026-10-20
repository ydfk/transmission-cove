<p align="center">
  <img src="docs/assets/icon.svg" alt="Transmission Cove Logo" width="96" />
</p>

<h1 align="center">Transmission Cove</h1>

<p align="center">为 Transmission 打造的现代化 Web 界面</p>

<p align="center">
  <img src="https://img.shields.io/badge/Transmission-4.0%2B-E32F2F" alt="Transmission 4.0+" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&amp;logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&amp;logoColor=white" alt="Docker" />
</p>

<!-- README-I18N:START -->

**简体中文** | [English](./README.en.md)

<!-- README-I18N:END -->

---

<a id="compatibility"></a>

## 这是什么

Transmission Cove 将下载、做种和任务管理放进一个简洁的 Web 工作台。采用 shadcn/ui 风格，支持 **Transmission 4.0+**，可以直接替换原生 Web 界面，也可以通过 Docker 独立运行。

适合在电脑上管理群晖、NAS 或本地 Transmission 中的大量任务。沿用已有实例、种子和下载目录，无需迁移数据。界面目前为简体中文。

![Transmission Cove 桌面界面（演示数据）](docs/screenshots/desktop.png)

<a id="features"></a>

## 核心功能

| 功能 | 说明 |
| --- | --- |
| 任务管理 | Torrent、磁力链接、URL 与拖拽添加，批量启停、删除、校验和队列调整 |
| 快速筛选 | 状态、多层目录、标签与 Tracker 组合筛选，支持搜索和排序 |
| 大量任务 | 虚拟列表、分页、自定义每页数量，跨页选择与批量操作 |
| 任务详情 | 文件选择与优先级、Tracker、Peers、下载路径、限速和做种规则 |
| 清晰布局 | 可调整侧栏与列宽，累计 / 会话统计，明暗主题与手机布局 |

<a id="quick-start"></a>

## 快速开始

先准备一个已运行、允许 RPC 访问的 **Transmission 4.0+** 实例。

### 群晖 / NAS 一键安装

在 NAS 的 SSH 终端执行：

```bash
curl -fL https://github.com/ydfk/transmission-cove/releases/latest/download/install.sh -o /tmp/transmission-cove-install.sh
sudo sh /tmp/transmission-cove-install.sh
```

脚本识别 Web 目录，确认后下载、校验并备份安装。完成后打开原来的 Transmission Web 地址即可；以 root 登录时去掉 `sudo`。

需要已发布的稳定 Release，以及 NAS 上的 `curl`、`tar`、`sha256sum`。自定义目录、Docker 安装、更新与回退见[一键部署指南](docs/DEPLOYMENT.md#一键安装与更新)。

### Docker Compose

在 Transmission 所在主机执行：

```bash
git clone https://github.com/ydfk/transmission-cove.git
cd transmission-cove
docker compose up -d --build
```

访问 `http://localhost:8080`，其他设备将 `localhost` 换成主机地址。默认连接宿主机 9091 端口，无需挂载下载目录。端口、RPC 白名单或网络不符合默认设置时，参阅[部署指南](docs/DEPLOYMENT.md#docker-compose-部署)。

<a id="configuration"></a>

默认自动连接当前实例，需要认证时会弹出登录窗口。按住 **Shift 点击“设置”** 可手动切换后端，详见[连接说明](docs/USAGE.md#隐藏的后端切换)。

<a id="development"></a>

## 开发

使用 Node.js 22.12+，在项目目录执行：

```bash
npm ci
npm run dev
```

打开 `http://127.0.0.1:5173/?demo=1` 查看演示数据。前端基于 React、TypeScript、Vite 和 shadcn/ui；构建、测试与本地联调见[开发指南](docs/DEVELOPMENT.md)。

<a id="documentation"></a>

## 更多文档

[部署与回退](docs/DEPLOYMENT.md) · [使用与排错](docs/USAGE.md) · [Tag 发布](docs/RELEASING.md) · [架构](docs/ARCHITECTURE.md) · [验证记录](docs/VALIDATION.md)

独立第三方项目，与 Transmission 官方无隶属关系。部署方式参考 [jianxcao/transmission-web](https://github.com/jianxcao/transmission-web)。
