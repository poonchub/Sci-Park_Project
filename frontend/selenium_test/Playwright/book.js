import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: false ,
    slowMo: 100,
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:5173/login');
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('admin@gmail.com');
  await page.getByRole('textbox', { name: 'Email' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('12356');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.locator('div').filter({ hasText: /^Password$/ }).getByRole('button').click();
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).press('ArrowLeft');
  await page.getByRole('textbox', { name: 'Password' }).press('ArrowLeft');
  await page.getByRole('textbox', { name: 'Password' }).fill('123456');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByRole('link', { name: 'Booking Room' }).click();
  await page.locator('div:nth-child(2) > .MuiPaper-root > .MuiCardActions-root > .MuiButtonBase-root').click();
  await page.getByText('Select a Room').click();
  await page.getByRole('option', { name: 'A309' }).click();
  await page.getByText('HourlyHalf Day (4 hours)Full').click();
  await page.getByText('Morning (08:30 - 12:30)').click();
  await page.getByText('30', { exact: true }).click();
  await page.getByRole('textbox', { name: 'Purpose of Booking' }).click();
  await page.getByRole('textbox', { name: 'Purpose of Booking' }).fill('123');
  await page.getByRole('button', { name: 'Confirm Booking • ฿' }).click();

  // ---------------------
  await context.close();
  await browser.close();
})();