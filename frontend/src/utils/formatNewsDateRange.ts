export default function formatNewsDateRange(startIso: string, endIso: string): string {
    const start = new Date(startIso);
    const end = new Date(endIso);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';

    const sameYear = start.getFullYear() === end.getFullYear();
    const sameMonth = sameYear && start.getMonth() === end.getMonth();

    const optionsFull = { year: 'numeric', month: 'short', day: 'numeric' } as const;
    const optionsNoYear = { month: 'short', day: 'numeric' } as const;
    const optionsDayOnly = { day: 'numeric' } as const;

    if (sameYear && sameMonth) {
        return `${start.toLocaleDateString('en-US', optionsNoYear)} - ${end.toLocaleDateString('en-US', optionsDayOnly)}, ${start.getFullYear()}`;
    } else if (sameYear) {
        return `${start.toLocaleDateString('en-US', optionsNoYear)} - ${end.toLocaleDateString('en-US', optionsNoYear)}, ${start.getFullYear()}`;
    } else {
        return `${start.toLocaleDateString('en-US', optionsFull)} - ${end.toLocaleDateString('en-US', optionsFull)}`;
    }
}