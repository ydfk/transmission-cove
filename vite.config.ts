import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { devProxy } from './server/dev-proxy.mjs'

export default defineConfig(({ mode }) => {
  // 浏览器回归使用隔离模式，不能读取开发者的真实 NAS 地址。
  const address = mode === 'e2e' ? '' : loadEnv(mode, process.cwd(), 'TRANSMISSION_').TRANSMISSION_RPC_URL
  return {
    plugins: [react(), tailwindcss(), ...(mode === 'e2e' ? [] : [devProxy(address)])],
    base: './',
    build: { rollupOptions: { output: { manualChunks: { 'radix-vendor': ['radix-ui'] } } } },
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  }
})
