# 部署 Transmission Cove

[返回产品主页](../README.md) · [使用与排错](USAGE.md) · [发布指南](RELEASING.md)

## 选择部署方式

| 方式 | 需要什么 | 访问地址 | 是否改现有 Transmission |
| --- | --- | --- | --- |
| 群晖/本地 NAS 原生替换 | 已运行的 Transmission + 静态文件包 | 原来的 `/transmission/web/` | 仅设置 Web 目录或替换 Web 文件 |
| Docker Compose | 项目源码 + Docker/Compose | `http://部署主机:8080` | 不迁移实例、配置或种子 |
| 独立 Node 服务 | Node.js 22.12+、npm、源码 | `http://部署主机:8080` | 不迁移实例、配置或种子 |

这些方式都只部署管理界面。**不需要重新添加已有种子，不需要挂载下载数据目录。** 首次 Tag 发布前可按下文从本地源码构建；首次工作流成功后，仓库 Releases 提供安装包，GHCR 提供镜像。当前没有在线演示。

## 群晖 / 本地 NAS 原生部署

### 1. 准备静态文件

从仓库 Releases 下载 `transmission-cove-<版本>-web.zip`（本地构建包位于 `artifacts/`），或在电脑的项目目录构建：

```bash
npm ci
npm run build
```

需要复制的是 `dist/` **里面的文件**：

```text
index.html
assets/
```

覆盖完成后访问原 Web 地址即可自动连接，不需要填写服务器地址；自定义 `/custom/web/` 路径会自动使用 `/custom/rpc`。NAS 不需要 Node.js。不要把源代码、`node_modules` 或外层 `dist` 文件夹当成 Web 根目录；不要通过双击 `index.html` 连接服务器。

### 2. 确认当前安装方式与路径

先在套件中心记下 DSM 版本、Transmission 版本和套件来源，保留当前能访问的 Web 地址。不同套件的路径和启动脚本不同，不能直接假设固定目录。

可以临时开启 SSH，检查运行进程及套件目录；以下是只读检查：

```bash
ps ww | grep '[t]ransmission-daemon'
ls /var/packages | grep -i transmission
```

若确认套件 ID 是 `transmission`，可查找原 Web 入口：

```bash
find -L /var/packages/transmission/target -type f -path '*/web/index.html' 2>/dev/null
```

如果 ID 不同，先替换为实际 ID。没有找到时，查看套件说明和进程路径，不要创建一个猜测的安装目录。后续任选 A 或 B。

### 3A. 使用独立 Web 目录

适用于套件明确支持给 daemon 注入启动环境变量的情况：

1. 在 File Station 建立专用目录，例如 `/volume1/web/transmission-web`；按你的存储卷选择路径。
2. 将静态包解压到该目录，确认目录中直接有 `index.html` 和 `assets`。
3. 为 Transmission 的实际运行账户授予目录遍历与文件读取权限；保留已有访问控制，不使用 `chmod 777`。
4. 在**套件支持的启动环境配置**中加入：

```bash
TRANSMISSION_WEB_HOME=/volume1/web/transmission-web
```

若它要求 shell 语法，则使用 `export TRANSMISSION_WEB_HOME=...`。必须由启动 daemon 的进程继承；临时 SSH shell 中 export，或写在 `settings.json` 中，都不能改变已运行的套件。官方支持的变量见 [Transmission 环境变量说明](https://github.com/transmission/transmission/blob/4.1.3/docs/Environment-Variables.md)。

5. 用套件中心停止并重新启动 Transmission，然后访问原 Web 地址并强制刷新。

套件没有提供环境变量入口时使用 3B。不要套用未经核实的开机脚本，也不要再手动启动第二个 daemon；[SynoCommunity 的启动脚本](https://github.com/SynoCommunity/spksrc/blob/master/spk/transmission/src/service-setup.sh)仅作为核对依据，实际安装版本可能不同。

### 3B. 备份并替换套件自带 Web 文件

适用于能确认原 Web 目录、但套件没有可用环境变量入口的情况：

1. 在套件中心停止 Transmission。
2. 将已确认的原 Web 目录完整复制为带日期的备份，记录位置。
3. 把 ZIP 解压后的 `index.html` 和 `assets/` 复制到**原 Web 目录内部**，覆盖同名静态文件。只操作 Web 目录，不修改配置、`resume`、`torrents` 和下载数据。
4. 保持原运行账户对这些文件可读，使用套件中心启动 Transmission。
5. 访问原地址，例如 `http://NAS主机:9091/transmission/web/`，强制刷新。界面应读取原有任务。

套件目录通常需要管理员权限。如果使用 SSH，先替换并检查以下三个变量的实际路径，再复制；示例中的占位符不能原样执行：

```bash
TR_WEB_DIR='/填写已确认的原Web目录'
TR_NEW_WEB='/填写解压后的新Web目录'
TR_WEB_BACKUP="${TR_WEB_DIR}.backup-$(date +%Y%m%d-%H%M%S)"
test -f "$TR_WEB_DIR/index.html" && test -f "$TR_NEW_WEB/index.html" || exit 1
sudo cp -a "$TR_WEB_DIR" "$TR_WEB_BACKUP"
sudo cp -a "$TR_NEW_WEB/." "$TR_WEB_DIR/"
```

复制后检查新文件的所有者与权限；若原权限没有继承，按套件运行账户调整。本项目不猜测你的套件账户。

### 4. 连接、更新与回退

- 原生替换由 Web 地址自动推导 RPC：`/transmission/web/` 对应 `/transmission/rpc`，自定义 `/custom/web/` 对应 `/custom/rpc`。无需填写连接设置。
- 出现 401 时输入 **Transmission RPC** 用户名和密码，不一定是 DSM 登录账户。
- 更新界面时先备份当前 Web 文件，再覆盖新构建的静态文件并强制刷新。套件自身更新可能覆盖 Web 文件或启动配置，更新后复查。
- 回退 3A：撤销 `TRANSMISSION_WEB_HOME` 覆盖，重启套件。
- 回退 3B：停止套件，把原备份内容复制回原 Web 目录，恢复权限后启动并强制刷新。保留配置和下载数据。

普通 Linux NAS 也是这两种方式：优先通过现有服务的环境配置设置 `TRANSMISSION_WEB_HOME`，否则备份替换实际 Web 目录；服务名称、账户和目录以本机安装为准。

## Docker Compose 部署

### 1. 准备项目

将项目源码完整放到 **Transmission 所在 NAS / 主机**的独立目录。群晖使用 Container Manager 的项目功能时，目录必须包含本项目的 `Dockerfile`、`compose.yaml`、源码和锁文件。

默认不需要创建 `.env`，也不需要在界面填写服务器地址。Compose 自动连接同一宿主机的 `http://host.docker.internal:9091/transmission/rpc`，并配置宿主机网关映射。代理会将内部别名解析为 IP，避免别名触发 daemon 的 Host 检查。

前提是原生 Transmission 的 RPC 在宿主机 9091 端口可从容器访问。若仅监听 127.0.0.1、使用非标准端口/路径，或 NAS 防火墙与 RPC IP 白名单阻止容器来源，需要在部署层调整；界面无法改变这些网络限制。

只有非标准端口/路径，或当前实例实际在另一台主机时，才执行：

```bash
cp .env.example .env
```

Windows PowerShell 使用 `Copy-Item .env.example .env`。编辑 `.env`，取消变量注释并填写当前实例的完整 RPC 地址，例如：

```dotenv
TRANSMISSION_RPC_URL=http://192.168.1.10:9092/transmission/rpc
```

此变量是管理员的部署覆盖项，不是多服务器配置。填写 RPC 地址，不是 `/transmission/web/`；容器中的 localhost 指容器本身。不要把用户名或密码嵌入 URL，已有 Transmission 认证继续生效。

### 2. 构建并启动

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 transmission-web
```

访问 `http://Docker主机:8080` 即自动连接；出现 401 认证失败时，点“登录 Transmission”输入 RPC 凭据。无需新增服务器或填写连接表单。

项目默认使用下面的 Compose 配置，不需要下载目录挂载：

```yaml
services:
  transmission-web:
    build: .
    image: transmission-cove:local
    ports:
      - "8080:8080"
    environment:
      TRANSMISSION_RPC_URL: ${TRANSMISSION_RPC_URL:-http://host.docker.internal:9091/transmission/rpc}
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped
    read_only: true
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
```

若 8080 被占用，只修改左侧端口，例如 `18080:8080`，再访问 18080。群晖 Container Manager：创建项目，指定源码目录并使用现有 `compose.yaml`，直接构建启动并检查日志与端口；只有使用自定义覆盖时才需要同目录 `.env`。不同 DSM 版本的按钮名称可能不同。老版本 Docker 不支持 `host-gateway` 时，更新引擎或将 `extra_hosts` 改为宿主机可达 IP。

### 3. 更新、改配置、停止与回退

```bash
# 更新源码后重新构建；构建前可保留当前镜像
docker tag transmission-cove:local transmission-cove:backup
docker compose up -d --build

# 仅修改 .env 后，重新创建容器使环境变量生效
docker compose up -d --force-recreate

# 停止并移除界面容器，不操作原生 Transmission
docker compose down
```

回退镜像：将 `compose.yaml` 中的 `image` 临时改为 `transmission-cove:backup`，执行 `docker compose up -d --no-build`。恢复成功后保留对应旧源码，避免下一次构建覆盖回退版本。

只使用 `docker run` 的等效方式：

```bash
docker build -t transmission-cove:local .
docker run -d --name transmission-web --restart unless-stopped \
  --read-only --cap-drop ALL --security-opt no-new-privileges:true \
  -p 8080:8080 \
  --add-host host.docker.internal:host-gateway \
  transmission-cove:local
```

镜像仅包含静态文件和 Node 代理，以非 root 用户运行。Tag 工作流构建 linux/amd64 与 linux/arm64；目标 NAS 的实际运行仍需验收。

### 使用 GitHub 发布的镜像

首次 Tag 工作流成功后，可从仓库关联的 GitHub Packages 页面找到镜像。发布者需将该包的可见性设为 Public，其他用户才能匿名拉取；若组织策略限制发布或访问，需由仓库管理员调整。无须 Docker Hub 账户或额外发布密钥。

把下面的 `replace-owner` 替换为你的 GitHub 用户或组织名称（小写），版本改为已发布 Tag：

```bash
docker run -d --name transmission-cove --restart unless-stopped \
  --read-only --cap-drop ALL --security-opt no-new-privileges:true \
  --add-host host.docker.internal:host-gateway \
  -p 8080:8080 \
  ghcr.io/replace-owner/transmission-cove:v0.1.0
```

镜像默认连接宿主机 Transmission 9091。Compose 使用已发布镜像时，将 `image` 改为上述完整镜像地址并删除 `build: .`，再执行 `docker compose pull` 和 `docker compose up -d`。

## 独立 Node 服务部署

适合没有 Docker、但可运行 Node.js 22.12+ 的电脑或 NAS。先在项目目录安装与构建：

```bash
npm ci
npm run build
```

在 Transmission 所在主机执行，默认连接本机 9091：

```bash
npm start
```

访问 `http://主机:8080` 即可。非标准端口/路径可选择覆盖：

```bash
TRANSMISSION_RPC_URL=http://127.0.0.1:9092/custom/rpc npm start
```

Windows PowerShell 对应写法：

```powershell
$env:TRANSMISSION_RPC_URL = 'http://127.0.0.1:9092/custom/rpc'
npm start
```

独立 Node 服务不会自动读取 `.env`。可用上述进程环境变量，或兼容 JSON 文件（`servers.example.json` 复制为 `servers.local.json`，只允许一个上游）。优先级为显式环境变量、JSON、本机默认值；首次启动两者都不需要。旧浏览器中的服务器列表和手填 RPC 路径不再读取。

长期运行时将 `node server/index.mjs` 加入现有服务管理器，工作目录设为项目目录并配置相同环境变量。只在本机访问时将 `HOST` 设为 `127.0.0.1`。

## 配置与网络

| 配置 | 默认值 | 说明 |
| --- | --- | --- |
| `TRANSMISSION_RPC_URL` | Docker/Compose 为宿主机 9091；本地 Node 为 `http://127.0.0.1:9091/transmission/rpc` | 唯一上游完整 RPC URL；显式配置可覆盖默认值 |
| `PORT` | `8080` | Node 服务监听端口；容器通常保持默认 |
| `HOST` | `0.0.0.0` | Node 监听地址 |
| `SERVERS_FILE` | `servers.local.json` | 未设置上游环境变量时读取的兼容 JSON 文件；Docker 内默认 `/config/servers.json` |
| `STATIC_ROOT` | `dist` | 独立服务静态目录，按工作目录解析 |
| `TRANSMISSION_WEB_HOME` | 未设置 | **Transmission daemon** 的变量；用于原生替换，不是 Node 的变量 |

代理只有一个固定上游，不接受浏览器传入任意 URL；透传 RPC 认证和 `X-Transmission-Session-Id`，拒绝重定向和跨站请求，限制请求体为 24 MiB。前端 Torrent 文件上限为 16 MiB。代理无额外用户账户体系，沿用 Transmission RPC 认证。

远程访问时将已有 HTTPS 反向代理指向本界面的 8080 端口，并保留上游 RPC 认证和访问控制。建议使用独立域名的根路径。不要把无认证的 RPC 经此代理开放到公网。

Transmission 的 RPC IP 白名单必须允许实际连接来源：原生替换通常是浏览器主机；独立代理通常是 Docker/Node 主机或容器网络。按部署网络添加所需来源，不要为了连接方便清空安全设置。自定义上游域名还需获主机名白名单允许；默认 Docker 别名会转换为 IP。
