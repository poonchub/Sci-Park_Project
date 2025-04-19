const dateFormat = (date: string) => {
    return `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`
}
export default dateFormat;