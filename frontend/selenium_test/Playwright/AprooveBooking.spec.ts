import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  await page.getByRole('button', { name: 'Request List' }).click();
  await page.getByRole('link', { name: 'Room Booking' }).click();
  await page.getByRole('row', { name: '15 Room A303 • Floor 1' }).getByRole('button').first().click();
  await page.getByRole('button', { name: 'Confirm' }).click();
});