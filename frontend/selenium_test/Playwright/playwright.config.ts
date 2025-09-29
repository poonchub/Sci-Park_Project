import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  use: {
    baseURL: 'http://localhost:5173', // จะได้ใช้ page.goto('/login') ได้
    trace: 'on',
    video: 'on',
    screenshot: 'only-on-failure',
    storageState: 'storage/auth.json', // เปิดมาก็ล็อกอินแล้ว (ทำข้อ 2 ก่อนครั้งเดียว)
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
