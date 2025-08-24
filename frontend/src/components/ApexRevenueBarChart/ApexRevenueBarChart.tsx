import ReactApexChart from "react-apexcharts";
import { PaymentInterface } from "../../interfaces/IPayments";
import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { useEffect, useMemo, useState } from "react";

dayjs.extend(isoWeek);

const getModeFromClass = () => {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

const ApexRevenueBarChart = (props: {
    bookingPaymentData: PaymentInterface[];
    invoicePaymentData: PaymentInterface[];
    height: number;
    dateRange?: { start: Dayjs | null; end: Dayjs | null };
    selectedDateOption: string;
}) => {
    const { bookingPaymentData, invoicePaymentData, height, dateRange, selectedDateOption } = props;

    type DateOption = "daily" | "weekly" | "monthly" | "yearly";
    const [mode, setMode] = useState<"light" | "dark">(getModeFromClass());

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setMode(getModeFromClass());
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);

    const { bookingSeries, invoiceSeries, formattedCategories } = useMemo(() => {
        const option = (selectedDateOption ?? "monthly") as DateOption;
        const now = dayjs();

        let start: dayjs.Dayjs;
        let end: dayjs.Dayjs;

        if (dateRange?.start) {
            start = dateRange.start.startOf("day");
            end = dateRange.end?.endOf("day") ?? start.endOf("day");
        } else {
            switch (option) {
                case "daily":
                    end = now.endOf("day");
                    start = end.subtract(6, "day");
                    break;
                case "weekly":
                    end = now.endOf("isoWeek");
                    start = end.subtract(3, "week");
                    break;
                case "monthly":
                    end = now.endOf("month");
                    start = end.subtract(5, "month");
                    break;
                case "yearly":
                    end = now.endOf("year");
                    start = end.subtract(3, "year");
                    break;
                default:
                    end = now.endOf("month");
                    start = end.subtract(5, "month");
            }
        }

        // ✅ key สำหรับเก็บข้อมูล
        function formatKey(date: dayjs.Dayjs) {
            switch (option) {
                case "daily":
                    return date.format("YYYY-MM-DD");
                case "weekly":
                    return date.startOf("isoWeek").format("YYYY-MM-DD");
                case "monthly":
                    return date.format("YYYY-MM");
                case "yearly":
                    return date.format("YYYY");
                default:
                    return date.format("YYYY-MM-DD");
            }
        }

        // ✅ label ที่จะโชว์บนแกน X
        function formatLabel(raw: string) {
            const d = dayjs(raw);
            if (!d.isValid()) return raw;
            switch (option) {
                case "daily":
                    return d.format("D MMM");
                case "weekly":
                    return d.endOf("isoWeek").format("D MMM");
                case "monthly":
                    return d.format("MMM YYYY");
                case "yearly":
                    return d.format("YYYY");
                default:
                    return d.format("D MMM");
            }
        }

        // ✅ รวมยอดรายได้
        const sumByKey = (data: PaymentInterface[]) => {
            const sum: Record<string, number> = {};
            data.forEach((item) => {
                const d = dayjs(item.PaymentDate);
                if (d.isBefore(start) || d.isAfter(end)) return;
                const key = formatKey(d);
                sum[key] = (sum[key] || 0) + (item.Amount ?? 0);
            });
            return sum;
        };

        const bookingSum = sumByKey(bookingPaymentData);
        const invoiceSum = sumByKey(invoicePaymentData);

        // ✅ เติม key ที่ไม่มี
        let cursor = start.clone();
        const categories: string[] = [];
        const bookingSeries: number[] = [];
        const invoiceSeries: number[] = [];

        while (cursor.isBefore(end) || cursor.isSame(end)) {
            const key = formatKey(cursor);
            categories.push(key);
            bookingSeries.push(bookingSum[key] || 0);
            invoiceSeries.push(invoiceSum[key] || 0);

            switch (option) {
                case "daily":
                    cursor = cursor.add(1, "day");
                    break;
                case "weekly":
                    cursor = cursor.add(1, "week");
                    break;
                case "monthly":
                    cursor = cursor.add(1, "month");
                    break;
                case "yearly":
                    cursor = cursor.add(1, "year");
                    break;
            }
        }

        const formattedCategories = categories.map(formatLabel);

        return { categories, bookingSeries, invoiceSeries, formattedCategories };
    }, [bookingPaymentData, invoicePaymentData, dateRange, selectedDateOption]);

    const totalSeries = bookingSeries.map((val, i) => val + invoiceSeries[i]);
    const maxY = Math.max(
        1,
        Math.ceil(Math.max(...bookingSeries, ...invoiceSeries, ...totalSeries) * 1.1)
    );

    const chartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: "bar",
            toolbar: {
                show: false,
            },
            height,
        },
        plotOptions: {
            bar: { horizontal: false, columnWidth: "50%", borderRadius: 6 },
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ["transparent"] },
        xaxis: {
            categories: formattedCategories,
            labels: {
                style: {
                    fontSize: "14px",
                    fontFamily: "Noto Sans Thai, sans-serif",
                    colors: mode === "dark" ? "#FFF" : "#000",
                },
                offsetY: 7,
            },
        },
        yaxis: {
            min: 0,
            max: maxY,
            labels: {
                formatter: (val) => {
                    const rounded = Math.ceil(val / 100) * 100;
                    return `฿${rounded.toLocaleString()}`;
                },
                style: {
                    fontSize: "14px",
                    fontFamily: "Noto Sans Thai, sans-serif",
                    colors: mode === "dark" ? "#FFF" : "#000",
                },
                offsetX: -9,
            },
        },
        tooltip: {
            theme: mode,
            custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                const value = series[seriesIndex][dataPointIndex];
                const label = w.config.xaxis.categories?.[dataPointIndex] ?? "ไม่ทราบเวลา";
                const seriesName = w.globals.seriesNames[seriesIndex] || "";
                return `
                    <div style="
                        padding: 10px 16px;
                        font-size: 14px;
                        font-family: 'Noto Sans Thai', sans-serif;
                        color: ${mode === "dark" ? "#fff" : "#000"};
                        background-color: ${mode === "dark" ? "#333" : "#fff"};
                        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                    ">
                        <div><strong>${label}</strong></div>
                        <div>${seriesName}: <b>฿${value.toLocaleString()}</b></div>
                    </div>
                `;
            },
        },
        colors: ["#3B82F6", "#10B981", "#F59E0B"],
        legend: {
            horizontalAlign: "center",
            fontSize: "14px",
            fontWeight: 500,
            fontFamily: "Noto Sans Thai, sans-serif",
            labels: { colors: mode === "dark" ? "#FFF" : "#000" },
            offsetY: 22,
        },
    };

    const chartSeries = [
        { name: "Meeting Rooms", data: bookingSeries },
        { name: "Rental Rooms", data: invoiceSeries },
        {
            name: "Total Revenue",
            data: bookingSeries.map((val, i) => val + invoiceSeries[i]),
        },
    ];

    return (
        <div>
            <ReactApexChart
                options={chartOptions}
                series={chartSeries}
                type="bar"
                height={height}
            />
        </div>
    );
};

export default ApexRevenueBarChart;
