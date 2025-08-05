export default function formatToLocalWithTimezone(utcString: string): string {
    const date = new Date(utcString);

    const pad = (num: number, size = 2) => num.toString().padStart(size, "0");

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());

    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    const second = pad(date.getSeconds());
    const millisecond = pad(date.getMilliseconds(), 3);
    const microsecond = "0000"; // JS รองรับถึง millisecond เท่านั้น

    // +07:00 offset (ไม่ใช้ getTimezoneOffset เพราะค่าจะเป็นลบสำหรับ +)
    const tzOffset = -date.getTimezoneOffset(); // หน่วยเป็นนาที
    const tzSign = tzOffset >= 0 ? "+" : "-";
    const tzHour = pad(Math.floor(Math.abs(tzOffset) / 60));
    const tzMinute = pad(Math.abs(tzOffset) % 60);

    return `${year}-${month}-${day} ${hour}:${minute}:${second}.${millisecond}${microsecond}${tzSign}${tzHour}:${tzMinute}`;
}