// import { test, expect } from '@playwright/test';

// test('test', async ({ page }) => {
//   await page.goto('http://localhost:5173/login');
//   await page.getByRole('button', { name: 'Room' }).click();
//   await page.getByRole('link', { name: 'Manage Room', exact: true }).click();
//   await page.getByRole('row', { name: 'B406' }).getByRole('button').click();
//   await page.getByRole('combobox', { name: 'Unavailable' }).click();
//   await page.getByRole('option', { name: 'Available', exact: true }).click();
//   await page.getByRole('combobox', { name: 'Floor' }).click();
//   await page.getByRole('option', { name: 'Floor 1' }).click();
//   await page.getByRole('combobox', { name: 'NE2' }).click();
//   await page.getByRole('option', { name: 'Event Hall' }).click();
//   await page.getByRole('button', { name: 'Save' }).click();
// });




// import { test, expect } from '@playwright/test';

// test('test', async ({ page }) => {
//   await page.goto('http://localhost:5173/login');
//   await page.getByRole('button', { name: 'Accept All' }).click();
//   await page.getByRole('textbox', { name: 'Email' }).click();
//   await page.getByRole('textbox', { name: 'Email' }).fill('admin@gmail.com');
//   await page.getByRole('textbox', { name: 'Email' }).press('Tab');
//   await page.getByRole('textbox', { name: 'Password' }).fill('123456');
//   await page.getByRole('button', { name: 'Sign In' }).click();
//   await page.getByRole('button', { name: 'Room' }).click();
//   await page.getByRole('link', { name: 'Manage Room', exact: true }).click();
//   await page.getByRole('row', { name: 'B406 NE2 HALL 2 Available 120' }).getByRole('button').first().click();
//   await page.getByRole('combobox', { name: 'Available' }).click();
//   await page.getByRole('option', { name: 'Under Maintenance' }).click();
//   await page.getByRole('combobox', { name: 'Floor' }).click();
//   await page.getByRole('option', { name: 'Floor 2' }).click();
//   await page.getByRole('combobox', { name: 'NE2 HALL' }).click();
//   await page.getByRole('option', { name: 'NE2 HALL 1' }).click();
//   await page.getByRole('button', { name: 'Save' }).click();
// });



import { test, expect } from '@playwright/test';

test('update room & toast visible', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  // await page.getByRole('button', { name: 'Accept All' }).click();
  // await page.getByRole('textbox', { name: /email/i }).fill('admin@gmail.com');
  // await page.getByRole('textbox', { name: /password/i }).fill('123456');
  // await page.getByRole('button', { name: /sign in|เข้าสู่ระบบ/i }).click();

  await page.getByRole('button', { name: 'Room' }).click();
  await page.getByRole('link', { name: 'Manage Room', exact: true }).click();
  await page.getByRole('row', { name: /B406/i }).getByRole('button').first().click();

  // ---- เปลี่ยนค่า (ดูวิธีเลือก option เพิ่มด้านล่าง)
  await page.getByRole('combobox', { name: 'Available' }).click();
  await page.getByRole('option', { name: 'Under Maintenance' }).click();

  // Floor
  await page.getByRole('combobox', { name: 'Floor' }).click();
  await page.getByRole('option', { name: /Floor 2/i }).click();

  // Room type
  await page.getByRole('combobox', { name: /NE2 HALL/i }).click();
  await page.getByRole('option', { name: /NE2 HALL 1/i }).click();

  await page.getByRole('button', { name: 'Save' }).click();  // ---- จับ Toast/Alert
  // 1) พยายามใช้ role ที่เข้าถึงได้ก่อน (status/alert)
  const toast = page.getByRole('status').filter({ hasText: /Room updated successfully\./i })
    .or(page.getByRole('alert').filter({ hasText: /Room updated successfully\./i }));

  await expect(toast).toBeVisible();

  // ถ้าโปรเจกต์มี test id จะนิ่งที่สุด:
  // const toast = page.getByTestId('toast-success');
  // await expect(toast).toHaveText(/room updated successfully\./i);

  // (ออปชัน) รอให้ toast หายไป (บาง UI auto-dismiss)
  // await expect(toast).toBeHidden({ timeout: 10000 });
});
