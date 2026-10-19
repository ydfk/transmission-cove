# 开发与验证

```bash
npm ci
npm run dev
```

开发服务器地址通常为 `http://127.0.0.1:5173`。界面演示可访问 `http://127.0.0.1:5173/?demo=1`，规模测试加 `&count=500` 或 `&count=2000`。演示明确标注模拟数据，操作不会访问真实 NAS。

不带 `demo=1` 时，开发版默认通过内置代理连接本机 `http://127.0.0.1:9091/transmission/rpc`。连接其他 NAS 时，**Shift 点击左下角设置**，填写完整 RPC 地址与所需凭据，验证后切换；无需配置环境变量或重启服务。点击“恢复自动连接”回到默认本机实例。

只有希望改变开发环境的自动连接默认地址时，才在被 Git 忽略的 `.env.local` 中配置并重启 `npm run dev`：

```dotenv
TRANSMISSION_RPC_URL=http://nas.example:9091/transmission/rpc
```

页面通过 `/api/server` 发现默认连接与代理能力。默认连接使用同源 `/api/rpc`，手动填写的其他远程地址通过 `/api/remote-rpc` 连接。代理复用生产版的跨站保护、409 握手头及认证透传；远程目标随每次请求传递，不更改服务器默认配置。凭据由页面输入，不写入环境变量或 URL。

开发代理默认启用，只接受 `localhost`、`127.0.0.1` 和 `[::1]` 的 Host，供本机调试使用。团队或 NAS 正式访问使用生产 Node / Docker 部署。`npm run preview` 仅预览静态资源，不包含开发代理；验证生产代理请构建后运行 `npm start`。

```bash
npm test
npm run build
npm run test:e2e
```

浏览器测试默认使用系统 Microsoft Edge；没有 Edge 时调整 `playwright.config.ts` 的浏览器通道，或移除 `channel` 并执行 `npx playwright install chromium`。

浏览器回归使用独立 5175 端口及 `e2e` 模式，不读取实际 NAS 上游，也不复用你的开发服务，避免测试访问真实任务。

真实 daemon 测试会添加/删除自制种子并修改限速与带宽组，**只能使用独立测试实例**。设置 `TR_TEST_RPC40`、`TR_TEST_RPC41` 后执行 `npm run test:integration`；可再设置 `TR_TEST_WEB_URL` 验证当前单上游部署。未设置时测试跳过，不代表兼容性通过。

群晖目标环境需要另外验收：确认 400 多个现有任务正常显示、长时间刷新正常；用测试种子验证添加、暂停、文件选择、删除保留数据；核对目录操作权限、服务重启后生效和回退流程。用户 NAS 仅做过无凭据连接诊断，未验收真实任务，详细证据见 [验证记录](VALIDATION.md)。

安装脚本回归可在 Linux / BusyBox 环境运行，不会下载真实发布包或修改系统 Web 目录：

```bash
sh scripts/install.test.sh
```

Docker 安装器回归需要 Docker CLI、curl、可用的 18883 端口及本地测试镜像；创建带专用前缀的临时容器，结束后清理。镜像仅使用本地 Tag，测试用本地检查代替远程拉取：

```bash
docker build -t ghcr.io/ydfk/transmission-cove:v0.0.0-installer-test .
sh scripts/install-docker.test.sh
```

[返回产品主页](../README.md) · [架构](ARCHITECTURE.md) · [发布指南](RELEASING.md)
