import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:5173/login');

  // กรอกข้อมูล login
  await page.getByRole('textbox', { name: 'Email' }).fill('ext.a@example.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('123456');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // รอจนหน้า dashboard โหลด
  await page.waitForURL('http://localhost:5173');

  // บันทึก session
  await context.storageState({ path: 'authState.json' });

  console.log('✅ authState.json ถูกสร้างเรียบร้อย');
  await browser.close();
})();
