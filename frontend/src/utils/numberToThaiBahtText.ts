export function numberToThaiBahtText(amount: number): string {
    if (isNaN(amount)) return "";

    const numberText = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
    const digitText = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

    const [integerPart, decimalPart] = amount.toFixed(2).split("."); // ตัดทศนิยม 2 หลัก
    let bahtText = "";
    let satangText = "";

    // ฟังก์ชันแปลงเลข
    const convertNumber = (numStr: string) => {
        let result = "";
        const len = numStr.length;
        for (let i = 0; i < len; i++) {
            const digit = parseInt(numStr.charAt(i));
            const position = len - i - 1;

            if (digit !== 0) {
                if (position === 1 && digit === 1) {
                    result += "สิบ";
                } else if (position === 1 && digit === 2) {
                    result += "ยี่สิบ";
                } else if (position === 0 && digit === 1 && len > 1) {
                    result += "เอ็ด";
                } else {
                    result += numberText[digit] + (digitText[position] || "");
                }
            }
        }
        return result;
    };

    // แปลงบาท
    bahtText = convertNumber(integerPart) + "บาท";

    // แปลงสตางค์
    if (decimalPart === "00") {
        satangText = "ถ้วน";
    } else {
        satangText = convertNumber(decimalPart) + "สตางค์";
    }

    return bahtText + satangText;
}
