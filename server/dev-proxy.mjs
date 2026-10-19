import { createApp } from './index.mjs'

// 开发版与 Docker 共用默认连接和手动切换代理；不会把选择写入服务器配置。
export function devProxy(address = 'http://127.0.0.1:9091/transmission/rpc') {
  const app = createApp({ servers: [{ id: 'current', name: '当前 Transmission', url: address }] })
  return {
    name: 'cove-dev-rpc',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (!request.url?.startsWith('/api/')) return next()
        let hostname
        try { hostname = new URL(`http://${request.headers.host}`).hostname } catch { /* 无效 Host 在下方拒绝。 */ }
        // 此中间件在 Vite 内置 Host 校验之前执行，仅开放本地开发访问。
        if (!['localhost', '127.0.0.1', '[::1]'].includes(hostname)) {
          response.writeHead(403); response.end('开发代理仅允许 localhost 访问'); return
        }
        app.emit('request', request, response)
      })
    },
  }
}
