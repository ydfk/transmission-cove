# Web 版本与更新

右下角的 **Web 版本**会检查 GitHub 最新稳定 Release，有新版时显示提示。点击可查看版本、发布说明和更新入口。不会自动安装，也不会降级到更低版本。

普通页面每 6 小时检查一次，也可手动检查；独立服务会缓存 GitHub 结果 5 分钟。原生覆盖版由浏览器访问 GitHub，独立服务代为查询；不会向 GitHub 发送 Transmission 账号密码。网络不通或 API 限流时可稍后重试。

## 不同部署方式

| 部署方式 | 更新方法 |
| --- | --- |
| 群晖 / NAS 原生 Web 覆盖版 | 重新运行安装脚本，见[部署与回退](DEPLOYMENT.md#一键安装与更新) |
| 默认 Docker 镜像 | 拉取新镜像并重建容器；源码 Compose 部署先拉取代码，再执行 `docker compose up -d --build` |
| 独立 Node 服务（Linux） | 可按下文启用页面内一键更新 Web 文件 |

原生覆盖版是静态网页，没有文件写入接口。默认 Docker 保持镜像部署方式，不挂载 Docker socket，不在容器中自行替换镜像。

## 启用一键更新

适用于管理员自行部署的独立 Node 服务。先将服务代码更新至包含此功能的版本，执行 `npm ci && npm run build`。以下假设仓库在 `/opt/transmission-cove`，使用该目录中的 `scripts/update-web.sh`：

```bash
cd /opt/transmission-cove
chmod +x scripts/update-web.sh
export STATIC_ROOT=/opt/transmission-cove/dist
export COVE_UPDATE_SCRIPT=/opt/transmission-cove/scripts/update-web.sh

# 生成更新密钥，将输出保存在自己的密码管理器中。
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
export COVE_UPDATE_TOKEN='替换为上一步生成的密钥'
npm start
```

Node 服务不会自动加载 `.env`；使用 systemd 或 NAS 服务管理器时，将以上三个变量设置在服务的启动环境中。密钥至少 32 个字符，不能使用示例文字或 Transmission 密码。

运行账户需要执行脚本、写入 `dist` 及其父目录的权限；系统需安装 `curl`、`tar`、`sha256sum`。脚本应由管理员维护，放在被更新的 `dist` 目录之外。无需让服务以 root 运行。

检测到可执行脚本、版本清单和完整发布包后，版本弹窗会显示更新密钥输入框及“一键更新”按钮。输入密钥后执行更新；密钥仅用于此次请求，不保存到浏览器存储。完成后点击“刷新页面”。

更新会校验安装包的 SHA256、备份旧 Web 目录，然后替换静态文件，最后核对 `cove-version.json` 中的实际版本。不会修改 Transmission 的设置、任务或下载数据。失败时查看安装目录与同级的 `.cove-backup-*` 备份，按[回退说明](DEPLOYMENT.md)恢复；网络中断时先检查更新状态，避免重复执行。

**一键更新只更新 Web 静态文件。** Node 代理、更新服务本身及运行环境仍需管理员更新代码并重启。升级前阅读发布说明；若新版要求更新后端，应先完成后端升级。

自定义更新脚本必须使用绝对路径、可执行，仅接收一个已校验的稳定版本 Tag 参数。服务直接执行固定脚本，不接受浏览器提供的命令或下载地址。脚本应在 15 分钟内结束，成功后写入正确版本清单，不能重启当前 Node 服务；否则页面无法确认结果。
