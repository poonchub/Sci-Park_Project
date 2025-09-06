// src/lib/ocrSlip.ts
// OCR สลิปไทย/อังกฤษ แล้วดึง "ยอดเงิน" ออกมาแบบง่าย ๆ

export type OcrAmountResult = {
  amount: number | null;   // ยอดเงินที่เดาได้ (null ถ้าอ่านไม่เจอ)
  text: string;            // ข้อความทั้งหมดที่ OCR ได้
};

export async function ocrExtractAmount(file: File): Promise<OcrAmountResult> {
  // โหลดเฉพาะตอนเรียกใช้ เพื่อลดขนาดบันเดิล
  const { createWorker } = await import("tesseract.js");

  // ใช้ CDN paths เพื่อลดปัญหาบันเดิล/พาธของ worker/wasm/languages
  const worker = await createWorker({
    workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js",
    corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@5/wasm/tesseract-core.wasm.js",
    langPath: "https://tessdata.projectnaptha.com/5",
    // logger: (m: any) => console.log(m), // เปิดถ้าต้องการ debug
  } as any);

  // โหลดภาษาไทย+อังกฤษ
  await worker.loadLanguage("eng+tha");
  await worker.initialize("eng+tha");

  // OCR
  const { data } = await worker.recognize(file);
  await worker.terminate();

  const text: string = data?.text || "";

  // ดึงจำนวนเงินจากข้อความที่ได้ (เช่น THB 1,234.56 / ฿1234.56 / 1,234.56 / 1234.56 / 1,234)
  const candidates: number[] = [];
  const regex =
    /(?:thb|฿|บาท)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.\d{1,2})|[0-9]+(?:\.\d{1,2})?)/gi;

  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const raw = m[1].replace(/,/g, "");
    const v = parseFloat(raw);
    if (!Number.isNaN(v) && v > 0) candidates.push(v);
  }

  // บางสลิปมีหลายตัวเลข (ยอด/คงเหลือ/ค่าธรรมเนียม) — เลือกค่ามากสุด
  const amount = candidates.length ? Math.max(...candidates) : null;

  return { amount, text };
}
