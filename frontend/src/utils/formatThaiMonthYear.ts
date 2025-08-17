export function formatThaiMonthYear(dateInput: string | Date): string {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

    const thaiMonthsShort = [
        "ม.ค.",
        "ก.พ.",
        "มี.ค.",
        "เม.ย.",
        "พ.ค.",
        "มิ.ย.",
        "ก.ค.",
        "ส.ค.",
        "ก.ย.",
        "ต.ค.",
        "พ.ย.",
        "ธ.ค.",
    ];

    const year = date.getFullYear() + 543;
    const shortYear = year.toString().slice(-2);

    return `เดือน ${thaiMonthsShort[date.getMonth()]} ${shortYear}`;
}
