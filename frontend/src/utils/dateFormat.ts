const dateFormat = (date: string | undefined | null) => {
    if (!date) return "N/A";
    return `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`
}
export default dateFormat;