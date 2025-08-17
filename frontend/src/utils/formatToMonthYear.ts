export function formatToMonthYear(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
}