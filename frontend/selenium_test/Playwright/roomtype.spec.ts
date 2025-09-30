import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.getByRole('button', { name: 'Room' }).click();
  await page.getByRole('link', { name: 'Manage Room Type' }).click();
  await page.getByRole('row', { name: 'Small Meeting Room' }).getByRole('button').click();
  await page.getByRole('textbox', { name: 'Enter room type name' }).click();
  await page.getByRole('textbox', { name: 'Enter room type name' }).fill('Training Room 2');
  await page.getByPlaceholder('Enter room size').click();
  await page.getByPlaceholder('Enter room size').fill('148');
  await page.getByText('Microphone').click();
  await page.getByRole('option', { name: 'Whiteboard' }).click();
  await page.locator('[id=":r51:"]').click();
  await page.locator('[id=":r51:"]').fill('4');
  await page.getByText('U-Shape').click();
  await page.getByRole('option', { name: 'Theater' }).click();
  await page.getByRole('button', { name: /add images/i }).click().catch(() => { });
  await page.locator('input[type="file"]').first().setInputFiles('assets/123.jpg');
  await page.getByRole('button', { name: 'Save Changes' }).click();

  // 1) พยายามใช้ role ที่เข้าถึงได้ก่อน (status/alert)
  const toast = page.getByRole('status').filter({ hasText: /Room Type updated successfully\./i })
    .or(page.getByRole('alert').filter({ hasText: /Room Type updated successfully\./i }));

  await expect(toast).toBeVisible();

});