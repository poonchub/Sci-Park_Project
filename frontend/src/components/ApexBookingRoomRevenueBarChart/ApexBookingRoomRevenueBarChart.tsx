import ReactApexChart from "react-apexcharts";
import { PaymentInterface } from "../../interfaces/IPayments";
import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { useEffect, useMemo, useState } from "react";

dayjs.extend(isoWeek);

const getModeFromClass = () => {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

const ApexBookingRoomRevenueBarChart = (props: {
    bookingPaymentData: PaymentInterface[];
    height: number;
    dateRange?: { start: Dayjs | null; end: Dayjs | null };
    selectedDateOption: string;
}) => {
    const { bookingPaymentData, height, dateRange, selectedDateOption } = props;

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

    const { bookingSeries, formattedCategories } = useMemo(() => {
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
                    start = end.subtract(6, "day").startOf("day");
                    break;
                case "weekly":
                    end = now.endOf("isoWeek");
                    start = end.subtract(3, "week").startOf("isoWeek");
                    break;
                case "monthly":
                    end = now.endOf("month");
                    start = end.subtract(5, "month").startOf("month");
                    break;
                case "yearly":
                    end = now.endOf("year");
                    start = end.subtract(3, "year").startOf("year");
                    break;
                default:
                    end = now.endOf("month");
                    start = end.subtract(5, "month").startOf("month");
            }
        }

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

        let cursor = start.clone();
        const categories: string[] = [];
        const bookingSeries: number[] = [];

        while (cursor.isBefore(end) || cursor.isSame(end)) {
            const key = formatKey(cursor);
            categories.push(key);
            bookingSeries.push(bookingSum[key] || 0);

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

        return { bookingSeries, formattedCategories };
    }, [bookingPaymentData, dateRange, selectedDateOption]);

    const maxY = Math.max(1, Math.ceil(Math.max(...bookingSeries) * 1.1));

    const chartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: "bar",
            toolbar: { show: false },
            height,
        },
        plotOptions: { bar: { horizontal: false, columnWidth: "50%", borderRadius: 6 } },
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
                formatter: (val) => `฿${Math.ceil(val / 100) * 100}`,
                style: {
                    fontSize: "14px",
                    fontFamily: "Noto Sans Thai, sans-serif",
                    colors: mode === "dark" ? "#FFF" : "#000",
                },
                offsetX: -9,
            },
        },
        tooltip: { theme: mode },
        colors: ["#F26522"],
        legend: { show: false },
    };

    const chartSeries = [{ name: "Meeting Rooms", data: bookingSeries }];

    return (
        <ReactApexChart options={chartOptions} series={chartSeries} type="bar" height={height} />
    );
};

export default ApexBookingRoomRevenueBarChart;
