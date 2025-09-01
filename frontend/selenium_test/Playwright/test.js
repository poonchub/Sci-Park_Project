import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:5173/login');
  await page.getByRole('button', { name: 'Accept All' }).click();
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('admin@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('123456');
  await page.getByRole('button').filter({ hasText: /^$/ }).click();
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByRole('link', { name: 'News', exact: true }).click();
  await page.getByRole('link', { name: 'Maintenance', exact: true }).click();
  await page.getByRole('button', { name: 'Room' }).click();
  await page.getByRole('link', { name: 'Manage Room' }).click();
  await page.getByRole('row', { name: 'Select row 47 A406 NE2 HALL 2' }).getByRole('button').click();
  await page.getByRole('combobox', { name: 'Floor' }).click();
  await page.getByRole('combobox', { name: 'Floor' }).click();
  await page.locator('#menu-FloorID div').first().click();

  // ---------------------
  await context.close();
  await browser.close();
})();