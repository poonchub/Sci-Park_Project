const timeFormat = (date: string | undefined | null) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";

    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    if (hours === 0) hours = 12; // 0 เท่ากับ 12 ในระบบ 12 ชม.

    const minutesStr = minutes.toString().padStart(2, '0');

    return `${hours}:${minutesStr} ${ampm}`;
}
export default timeFormat;