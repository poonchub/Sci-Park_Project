import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.getByRole('link', { name: 'Room Booking', exact: true }).click();
  await page.getByRole('button', { name: 'Small Meeting Room Small' }).click();
  await page.getByRole('button', { name: 'Booking Room' }).click();
  await page.getByRole('combobox').filter({ hasText: '-- Select a Room --' }).click();
  await page.getByRole('option', { name: 'A303' }).click();
  await page.getByText('Full Day (8 hours)').click();
  await page.getByRole('radio', { name: 'Select All' }).click();
  await page.getByText('29', { exact: true }).click();
  await page.getByRole('textbox', { name: 'e.g. team planning meeting,' }).click();
  await page.getByRole('textbox', { name: 'e.g. team planning meeting,' }).fill('123');
  await page.getByRole('textbox', { name: 'Special equipment, catering' }).click();
  await page.getByRole('textbox', { name: 'Special equipment, catering' }).press('End');
  await page.getByRole('textbox', { name: 'Special equipment, catering' }).fill('44');
  await page.getByRole('combobox').filter({ hasText: '-- Room Setup Style --' }).click();
  await page.getByRole('option', { name: 'U-Shape' }).click();
  await page.getByRole('textbox', { name: 'Enter tax ID' }).click();
  await page.getByRole('button', { name: 'Confirm Booking • ฿' }).click();
  await page.getByText('I have read and acknowledged').click();
  await page.locator('label').filter({ hasText: 'I have read and accepted the' }).click();
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Full' }).click();
  await page.getByRole('button', { name: 'Confirm Booking' }).click();

     // 1) พยายามใช้ role ที่เข้าถึงได้ก่อน (status/alert)
  const toast = page.getByRole('status').filter({ hasText: /Booking created successfully\./i })
    .or(page.getByRole('alert').filter({ hasText: /Booking created successfully\./i }));

  await expect(toast).toBeVisible();
});
