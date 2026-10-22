<p align="center">
  <img src="docs/assets/icon.svg" alt="Transmission Cove Logo" width="96" />
</p>

<h1 align="center">Transmission Cove</h1>

<p align="center">A modern web interface for Transmission</p>

<p align="center">
  <img src="https://img.shields.io/badge/Transmission-4.0%2B-E32F2F" alt="Transmission 4.0+" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&amp;logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&amp;logoColor=white" alt="Docker" />
</p>

<!-- README-I18N:START -->

[简体中文](./README.md) | **English**

<!-- README-I18N:END -->

---

<a id="compatibility"></a>

## What is this?

Transmission Cove brings downloads, seeding, and torrent management into a compact web workspace. Styled with shadcn/ui, it supports **Transmission 4.0+** and can replace the native web interface or run independently with Docker.

Built for managing a large torrent collection on Synology, a NAS, or a local Transmission instance from your desktop. Keep your existing instance, torrents, and download directories without migrating data. The application interface is currently in Simplified Chinese.

![Transmission Cove desktop interface (demo data)](docs/screenshots/desktop.png)

<a id="features"></a>

## Core features

| Feature | Details |
| --- | --- |
| Torrent management | Add Torrent files, magnets, URLs, or dropped files; batch start, pause, delete, verify, and reorder |
| Quick filtering | Combine states, nested directories, labels, and Tracker filters with search and sorting |
| Large collections | Virtualized lists, pagination, custom page sizes, and batch selection across pages |
| Torrent details | File selection and priorities, Trackers, Peers, download paths, speed limits, and seeding rules |
| Clear layout | Resizable sidebar and columns, cumulative / session statistics, light and dark themes, and mobile layouts |

<a id="quick-start"></a>

## Quick start

Start with a running **Transmission 4.0+** instance that allows RPC access.

### One-command Synology / NAS installation

Run in your NAS SSH terminal:

```bash
curl -fL https://github.com/ydfk/transmission-cove/releases/latest/download/install.sh -o /tmp/transmission-cove-install.sh
sudo sh /tmp/transmission-cove-install.sh
```

The script detects the web directory, asks for confirmation, then downloads, verifies, backs up, and installs the interface. Open your existing Transmission web address when done. Omit `sudo` when logged in as root.

Requires a published stable Release and `curl`, `tar`, and `sha256sum` on the NAS. See the [one-command deployment guide](docs/DEPLOYMENT.md#一键安装与更新) for custom directories, Docker installation, updates, and rollback.

### Docker Compose

Run on the host running Transmission:

```bash
git clone https://github.com/ydfk/transmission-cove.git
cd transmission-cove
docker compose up -d --build
```

Open `http://localhost:8080`, replacing `localhost` with the host address when accessing from another device. Connects to port 9091 on the host by default; no download-directory mount is needed. For different ports, RPC allowlists, or network settings, see the [deployment guide](docs/DEPLOYMENT.md#docker-compose-部署).

<a id="configuration"></a>

Connects to the current instance automatically and opens a login dialog when authentication is required. **Shift-click “设置” (Settings)** to switch backends manually. See [connection options](docs/USAGE.md#隐藏的后端切换).

<a id="development"></a>

## Development

With Node.js 22.12+, run in the project directory:

```bash
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/?demo=1` for demo data. Built with React, TypeScript, Vite, and shadcn/ui. See the [development guide](docs/DEVELOPMENT.md) for builds, tests, and local integration.

<a id="documentation"></a>

## More documentation

[Deployment and rollback](docs/DEPLOYMENT.md) · [Web updates](docs/UPDATING.md) · [Usage and troubleshooting](docs/USAGE.md) · [Tag releases](docs/RELEASING.md) · [Architecture](docs/ARCHITECTURE.md) · [Validation record](docs/VALIDATION.md)

Detailed guides are maintained in Simplified Chinese. This is an independent third-party project, not affiliated with Transmission. Deployment takes inspiration from [jianxcao/transmission-web](https://github.com/jianxcao/transmission-web).
