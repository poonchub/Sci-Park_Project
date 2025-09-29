import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.getByRole('link', { name: 'My Account' }).click();
  await page.getByRole('tab', { name: 'Room Booking' }).click();
  await page.getByRole('row', { name: '12 Room A302 • Floor 1' })
            .getByRole('button').first().click();
  await page.getByRole('button', { name: /upload slip/i }).click();
  await page.locator('input[type="file"]').first().setInputFiles('assets/321.jpg');
  await page.getByRole('button', { name: /submit slip/i }).click();
  await page.getByRole('button', { name: 'Request List' }).click();
  await page.getByRole('link', { name: 'Room Booking 8' }).click();
  await page.getByRole('row', { name: '12 Room A302 • Floor 1' })
            .getByRole('button').first().click();
  await page.getByRole('button', { name: 'Approve' }).click();
  await page.getByRole('row', { name: '12 Room A302 • Floor 1' })
            .getByRole('button').first().click();
  await page.getByRole('button', { name: /upload receipt/i }).click();
  await page.locator('input[type="file"]').first()
           .setInputFiles('assets/receipt.pdf');  
  await page.getByText('Close').click();
});
