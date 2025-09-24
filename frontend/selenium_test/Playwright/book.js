import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const context = await browser.newContext({
    recordVideo: { dir: 'artifacts/video' },
  });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });

  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  try {
    // 1) ไปหน้า login
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });

    // 2) ยอมรับ cookie ถ้ามี
    try {
      await page.getByRole('button', { name: /accept all/i }).click({ timeout: 3000 });
    } catch (_) {}

    // 3) ล็อกอิน
    await page.getByRole('textbox', { name: /email/i }).fill('admin@gmail.com');
    await page.getByRole('textbox', { name: /password/i }).fill('123456');

    await Promise.all([
      page.waitForLoadState('networkidle'),
      page.getByRole('button', { name: /sign in/i }).click(),
    ]);

    // (แนะนำ) ยืนยันว่าเข้าสู่ระบบแล้ว – เปลี่ยน regex ให้เข้ากับ path จริงของคุณ
    await page.waitForURL(/(dashboard|app|home)/i, { timeout: 10000 });

    // 4) ไปหน้า Room Booking — ลองทั้ง link และ button
    let navigated = false;
    for (const loc of [
      page.getByRole('link', { name: /room booking/i }),
      page.getByRole('button', { name: /room booking/i }),
      page.getByText(/room booking|จองห้อง/i),
    ]) {
      try {
        await loc.first().waitFor({ state: 'visible', timeout: 3000 });
        await Promise.all([
          page.waitForLoadState('domcontentloaded'),
          loc.first().click(),
        ]);
        navigated = true;
        break;
      } catch {}
    }
    if (!navigated) throw new Error('ไม่พบปุ่ม/ลิงก์ "Room Booking"');

    // 5) เปิดการ์ดจอง (ทำให้เสถียรขึ้นด้วยการรอ)
    const openCardBtn = page.locator('.MuiButtonBase-root.MuiButton-root').first();
    await openCardBtn.waitFor({ state: 'visible' });
    await openCardBtn.click();

    // 6) เลือกห้อง
    await page.getByText('-- Select a Room --', { exact: true }).click();
    await page.getByRole('option', { name: 'A304' }).click();

    // 7) เลือกเวลา (Full Day + Select All)
    await page.getByText('Full Day (8 hours)').click();
    await page.getByText('Select All').click();

    // 8) เลือกวัน (ตรวจว่ามี 24 อยู่จริงในปฏิทิน)
    await page.getByText('24', { exact: true }).click();

    // 9) กรอกข้อมูล
    await page.getByRole('textbox', { name: /e\.g\./i }).fill('123');
    await page.getByRole('textbox', { name: /special equipment|จัดเลี้ยง/i }).fill('456');

    // 10) Room Setup Style
    await page.getByRole('combobox', { name: /room setup style/i }).click();
    await page.getByRole('option', { name: 'Class Room' }).click();

    // 11) กด Confirm Booking (รอโหลด)
    await Promise.all([
      page.waitForLoadState('networkidle'),
      page.getByRole('button', { name: /confirm booking/i }).click(),
    ]);

    // 12) ติ๊กยอมรับเงื่อนไข + เลือกวิธีจ่าย + Confirm
    await page.locator('label:has-text("I have read and accepted")').click();
    await page.locator('label:has-text("I have read and acknowledged")').click();

    await page.getByText('-- Select Payment Option --').click();
    await page.getByRole('option', { name: 'Full' }).click();

    await Promise.all([
      page.waitForLoadState('networkidle'),
      page.getByRole('button', { name: /^confirm booking$/i }).click(),
    ]);

  } catch (err) {
    // ถ้าพัง: เก็บ Screenshot
    await page.screenshot({ path: 'artifacts/failed.png', fullPage: true }).catch(() => {});
    console.error('❌ Failed:', err.message);
    throw err;
  } finally {
    await context.tracing.stop({ path: 'artifacts/trace.zip' });
    await context.close();
    await browser.close();
  }
})();
