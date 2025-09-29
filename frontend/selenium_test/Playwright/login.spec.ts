import { test, expect } from '@playwright/test';

test.setTimeout(90_000); // กันเครื่องช้า/แรกเปิด

test('login page loads and can sign in', async ({ page }) => {
  // 1) ไปหน้า login
  await page.goto('/login', { waitUntil: 'networkidle' });

  // 2) กรอกฟอร์ม (ลองหลาย locator ให้เจออันที่ตรงแอปคุณที่สุด)
  const email = page.getByRole('textbox', { name: /email/i })
    .or(page.getByPlaceholder(/email/i))
    .or(page.locator('input[type="email"]'));
  const pass = page.getByRole('textbox', { name: /password/i })
    .or(page.getByPlaceholder(/password/i))
    .or(page.locator('input[type="password"]'));

  await email.fill('admin@gmail.com');
  await pass.fill('123456');

  // 3) คลิก Sign in และรอ network เงียบ
  const signInBtn = page.getByRole('button', { name: /sign in|เข้าสู่ระบบ/i }).first();
  await Promise.all([
    page.waitForLoadState('networkidle'),
    signInBtn.click(),
  ]);

  // 4) ยืนยันความสำเร็จ: รอ "หลักฐานหลังล็อกอิน"
  // 4.1 รอ URL เปลี่ยนไปหน้าหลังล็อกอิน (ครอบคลุม route ที่เป็นไปได้ในโปรเจ็กต์คุณ)
  const urlWait = page.waitForURL(/(app|admin|verifier|book|dashboard|home)/i, { timeout: 10_000 })
    .catch(() => null);

  // 4.2 รอ element ที่มีเฉพาะหลังล็อกอิน (เช่น ปุ่ม Logout/เมนูด้านซ้าย)
  const uiWait = page.getByRole('button', { name: /log ?out|sign ?out|ออกจากระบบ/i })
    .or(page.getByText(/room booking|จองห้อง/i))
    .or(page.getByRole('navigation'))
    .waitFor({ state: 'visible', timeout: 10_000 })
    .catch(() => null);

  // รอแข่งกัน อันไหนมาก่อนก็ยอมรับว่า "สำเร็จ"
  const ok = await Promise.race([urlWait, uiWait]);

  // 5) ถ้าไม่เจอทั้งสองอย่าง แสดงว่าน่าจะล็อกอินไม่สำเร็จ → เก็บหลักฐานและ fail
  if (!ok) {
    // ถ้า Sign in ยังคงมองเห็น แปลว่ายังอยู่หน้าเดิม
    const stillOnLogin = await signInBtn.isVisible().catch(() => false);
    await page.screenshot({ path: 'test-results/login-failed.png', fullPage: true });
    const html = await page.content();
    console.error('Login failed. Current URL:', page.url());
    console.error('Sign-in still visible:', stillOnLogin);
    console.error('Page snippet:', html.slice(0, 500));
    throw new Error('Login did not navigate or reveal post-login UI within timeout.');
  }

  // 6) เพิ่ม assertion สั้นๆ เพื่อสรุปผล
  await expect(page).not.toHaveURL(/login/i); // ไม่ควรอยู่หน้า login แล้ว
});

