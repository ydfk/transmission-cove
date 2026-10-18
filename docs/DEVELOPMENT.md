# 开发与验证

```bash
npm ci
npm run dev
```

开发服务器地址通常为 `http://127.0.0.1:5173`，没有内置 RPC 代理；连接真实实例时使用生产 Node 服务。界面演示可访问 `http://127.0.0.1:5173/?demo=1`，规模测试加 `&count=500` 或 `&count=2000`。演示明确标注模拟数据，操作不会访问真实 NAS。

```bash
npm test
npm run build
npm run test:e2e
```

浏览器测试默认使用系统 Microsoft Edge；没有 Edge 时调整 `playwright.config.ts` 的浏览器通道，或移除 `channel` 并执行 `npx playwright install chromium`。

真实 daemon 测试会添加/删除自制种子并修改限速与带宽组，**只能使用独立测试实例**。设置 `TR_TEST_RPC40`、`TR_TEST_RPC41` 后执行 `npm run test:integration`；可再设置 `TR_TEST_WEB_URL` 验证当前单上游部署。未设置时测试跳过，不代表兼容性通过。

群晖目标环境需要另外验收：确认 400 多个现有任务正常显示、长时间刷新正常；用测试种子验证添加、暂停、文件选择、删除保留数据；核对目录操作权限、服务重启后生效和回退流程。当前没有连接用户 NAS，详细证据见 [验证记录](VALIDATION.md)。

[返回产品主页](../README.md) · [架构](ARCHITECTURE.md) · [发布指南](RELEASING.md)
