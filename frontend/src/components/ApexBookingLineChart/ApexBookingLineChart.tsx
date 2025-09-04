import dayjs, { Dayjs } from "dayjs";
import { useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import isBetween from "dayjs/plugin/isBetween";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isoWeek from "dayjs/plugin/isoWeek";
import { BookingRoomsInterface } from "../../interfaces/IBookingRooms";

dayjs.extend(isBetween);
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

type CountItem = { day: string; count: number } | { month: string; count: number };

const getModeFromClass = () => {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

function ApexBookingLineChart(props: {
    data?: BookingRoomsInterface[];
    height: number;
    dateRange?: { start: Dayjs | null; end: Dayjs | null };
    counts?: CountItem[];
    selectedDateOption: string;
}) {
    const { data, height, dateRange, selectedDateOption } = props;
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

    const countBookings = useMemo(() => {
        const option = selectedDateOption ?? "daily";
        const now = dayjs();

        let start: dayjs.Dayjs;
        let end: dayjs.Dayjs;

        if (dateRange?.start) {
            start = dateRange.start.startOf("day");
            end = dateRange.end?.endOf("day") ?? start.endOf("day");
        } else {
            switch (option) {
                case "hourly":
                    start = now.startOf("day");
                    end = now.endOf("day");
                    break;
                case "daily":
                    start = now.subtract(7, "day").startOf("day");
                    end = now.add(7, "day").endOf("day");
                    break;
                case "weekly":
                    start = now.subtract(6, "week").startOf("isoWeek");
                    end = now.add(5, "week").endOf("isoWeek");
                    break;
                case "monthly":
                    start = now.subtract(6, "month").startOf("month");
                    end = now.add(5, "month").endOf("month");
                    break;
                case "yearly":
                    start = now.subtract(2, "year").startOf("year");
                    end = now.add(2, "year").endOf("year");
                    break;
                default:
                    start = now.subtract(7, "day").startOf("day");
                    end = now.add(7, "day").endOf("day");
            }
        }

        const countR: Record<string, number> = {};

        // ✅ กรอง BookingDates
        const allDates =
            data?.flatMap((b) =>
                b.BookingDates.map((d) => ({
                    roomId: b.ID,
                    date: dayjs(d.Date),
                }))
            ) ?? [];

        const filteredDates = allDates.filter((item) =>
            item.date.isBetween(start, end, null, "[]")
        );

        // ✅ ฟอร์แมตรูปแบบ key
        function formatKey(date: dayjs.Dayjs) {
            switch (option) {
                case "hourly":
                    return date.format("h A");
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

        // ✅ นับจำนวน booking
        filteredDates.forEach((item) => {
            const key = formatKey(item.date);
            countR[key] = (countR[key] || 0) + 1;
        });

        // ✅ เติมค่า key ที่ไม่มี
        let cursor = start.clone();
        while (cursor.isBefore(end) || cursor.isSame(end, option === "hourly" ? "hour" : "day")) {
            const key = formatKey(cursor);
            if (!(key in countR)) {
                countR[key] = 0;
            }

            switch (option) {
                case "hourly":
                    cursor = cursor.add(1, "hour");
                    break;
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

        // ✅ เรียงตามเวลา
        return Object.fromEntries(
            Object.entries(countR).sort(([a], [b]) => {
                if (option === "hourly") {
                    const parseTime = (t: string) => dayjs(t, "h A").toDate().getTime();
                    return parseTime(a) - parseTime(b);
                } else {
                    return new Date(a).getTime() - new Date(b).getTime();
                }
            })
        );
    }, [data, dateRange, selectedDateOption]);

    const chartConfig = useMemo(() => {
        type DateOption = "daily" | "weekly" | "monthly" | "yearly" | "hourly";
        const option = (selectedDateOption ?? "daily") as DateOption;
        const categories = Object.keys(countBookings);
        const dataSeries = categories.map((key) => countBookings[key]);

        function formatLabel(dateStr: string) {
            const d = dayjs(dateStr);
            if (!d.isValid()) return dateStr;

            switch (option) {
                case "daily":
                    return d.format("D MMM");
                case "weekly":
                    return d.endOf("isoWeek").format("D MMM");
                case "monthly":
                    return d.format("MMM YYYY");
                case "yearly":
                    return d.format("YYYY");
                case "hourly":
                    return d.format("HH:mm");
                default:
                    return d.format("D MMM");
            }
        }

        const formattedCategories = categories.map(formatLabel);

        const options: ApexOptions = {
            chart: {
                height,
                type: "area",
                toolbar: { show: false },
                zoom: { enabled: false },
            },
            colors: ["#F26522"],
            dataLabels: { enabled: false },
            stroke: { curve: "smooth" },
            xaxis: {
                type: "category",
                categories: formattedCategories,
                tickPlacement: "on",
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
                max: Math.max(...dataSeries) + 2,
                forceNiceScale: true,
                decimalsInFloat: 0,
                labels: {
                    formatter: (val) => Math.round(val).toString(),
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
                    const label = w.globals.categoryLabels?.[dataPointIndex] || "ไม่ทราบเวลา";
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
              <div>Bookings: <b>${value}</b></div>
            </div>
          `;
                },
            },
        };

        const series = [{ name: "Bookings", data: dataSeries }];
        return { options, series };
    }, [countBookings, mode, height, selectedDateOption]);

    return (
        <div>
            <ReactApexChart
                options={chartConfig.options}
                series={chartConfig.series}
                type="area"
                height={height}
            />
        </div>
    );
}

export default ApexBookingLineChart;
