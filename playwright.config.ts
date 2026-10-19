import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests', testMatch: '**/*.spec.ts', timeout: 30000, fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:5175', channel: 'msedge', viewport: { width: 1440, height: 960 }, trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev -- --mode e2e --port 5175 --strictPort', url: 'http://127.0.0.1:5175', reuseExistingServer: false },
})
