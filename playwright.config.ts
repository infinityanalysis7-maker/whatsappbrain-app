import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './.testsprite',
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'on',
    trace: 'on-first-retry',
  },
  reporter: [['list']],
});
