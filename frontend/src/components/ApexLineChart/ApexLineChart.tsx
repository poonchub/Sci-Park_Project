import dayjs, { Dayjs } from "dayjs";
import { useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";
import { ApexOptions } from "apexcharts";
import isBetween from "dayjs/plugin/isBetween";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isoWeek from "dayjs/plugin/isoWeek";
import { useMediaQuery, useTheme } from "@mui/system";

dayjs.extend(isBetween);
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);


type CountItem =
    | { day: string; count: number }
    | { month: string; count: number };

const getModeFromClass = () => {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

function ApexLineChart(props: {
    data?: MaintenanceRequestsInterface[];
    height: number;
    dateRange?: { start: Dayjs | null; end: Dayjs | null };
    counts?: CountItem[];
    selectedDateOption: string
}) {
    const { data, height, dateRange, counts, selectedDateOption } = props;
    const [mode, setMode] = useState<"light" | "dark">(getModeFromClass());
    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.up('xs'));
    const isMobile = useMediaQuery(theme.breakpoints.up('mobileS'));
    const isSm = useMediaQuery(theme.breakpoints.up('sm'));
    const isSm650 = useMediaQuery(theme.breakpoints.up('sm650'));
    const isMd = useMediaQuery(theme.breakpoints.up('md'));
    const isMd1000 = useMediaQuery(theme.breakpoints.up('md1000'));

    // ติดตามการเปลี่ยน theme
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

    // const countRequests = useMemo(() => {
    //     const option = selectedDateOption ?? 'daily';
    //     const now = dayjs();

    //     let start: dayjs.Dayjs;
    //     let end: dayjs.Dayjs;

    //     // ✅ ถ้ามี dateRange ใช้จาก user
    //     if (dateRange?.start && dateRange?.end) {
    //         start = dateRange.start.startOf('day');
    //         end = dateRange.end.endOf('day');
    //     } else {
    //         // ✅ กำหนดช่วง default ถ้าไม่มี dateRange
    //         switch (option) {
    //             case 'daily':
    //                 end = now.endOf('day');
    //                 start = end.subtract(15, 'day'); // รวมวันนี้ = 16 วัน
    //                 break;
    //             case 'weekly':
    //                 end = now.endOf('isoWeek');
    //                 start = end.subtract(11, 'week'); // รวมวันนี้ = 12 สัปดาห์
    //                 break;
    //             case 'monthly':
    //                 end = now.endOf('month');
    //                 start = end.subtract(11, 'month'); // รวมวันนี้ = 12 เดือน
    //                 break;
    //             case 'yearly':
    //                 end = now.endOf('year');
    //                 start = end.subtract(5, 'year'); // รวมวันนี้ = 6 ปี
    //                 break;
    //             default:
    //                 end = now.endOf('day');
    //                 start = end.subtract(15, 'day');
    //                 break;
    //         }
    //     }

    //     const countR: Record<string, number> = {};

    //     // ✅ ฟิลเตอร์ข้อมูลให้อยู่ในช่วงเวลาที่สนใจ
    //     const filteredData = data?.filter((item) => {
    //         const created = dayjs(item.CreatedAt);
    //         return created.isBetween(start, end, null, '[]'); // inclusive
    //     }) ?? [];

    //     // ✅ สร้าง key ตาม option
    //     function formatKey(date: dayjs.Dayjs) {
    //         switch (option) {
    //             case 'daily':
    //                 return date.format('YYYY-MM-DD');
    //             case 'weekly':
    //                 return date.startOf("isoWeek").format('YYYY-MM-DD');
    //             case 'monthly':
    //                 return date.format('YYYY-MM');
    //             case 'yearly':
    //                 return date.format('YYYY');
    //             default:
    //                 return date.format('YYYY-MM-DD');
    //         }
    //     }

    //     // ✅ สร้าง count เริ่มจากข้อมูลจริง
    //     filteredData.forEach((item) => {
    //         const created = dayjs(item.CreatedAt);
    //         const key = formatKey(created);
    //         countR[key] = (countR[key] || 0) + 1;
    //     });

    //     // ✅ เติม key ที่ไม่มีข้อมูลให้ครบ
    //     let cursor = start.clone();

    //     while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
    //         const key = formatKey(cursor);
    //         if (!(key in countR)) {
    //             countR[key] = 0;
    //         }

    //         // เพิ่ม cursor ไปข้างหน้าตาม option
    //         switch (option) {
    //             case 'daily':
    //                 cursor = cursor.add(1, 'day');
    //                 break;
    //             case 'weekly':
    //                 cursor = cursor.add(1, 'week');
    //                 break;
    //             case 'monthly':
    //                 cursor = cursor.add(1, 'month');
    //                 break;
    //             case 'yearly':
    //                 cursor = cursor.add(1, 'year');
    //                 break;
    //         }
    //     }

    //     // ✅ เรียง key ตามเวลา
    //     return Object.fromEntries(
    //         Object.entries(countR).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    //     );

    // }, [data, dateRange, selectedDateOption]);

    const countRequests = useMemo(() => {
        const option = selectedDateOption ?? 'daily';
        const now = dayjs();

        let start: dayjs.Dayjs;
        let end: dayjs.Dayjs;

        // ✅ กำหนดช่วงเวลา
        if (dateRange?.start) {
            start = dateRange.start.startOf('day');
            end = dateRange.end?.endOf('day') ?? start.endOf('day');
        } else {
            switch (option) {
                case 'hourly':
                    start = now.startOf('day');
                    end = now.endOf('day');
                    break;
                case 'daily':
                    end = now.endOf('day');
                    start = end.subtract(15, 'day');
                    break;
                case 'weekly':
                    end = now.endOf('isoWeek');
                    start = end.subtract(11, 'week');
                    break;
                case 'monthly':
                    end = now.endOf('month');
                    start = end.subtract(11, 'month');
                    break;
                case 'yearly':
                    end = now.endOf('year');
                    start = end.subtract(5, 'year');
                    break;
                default:
                    end = now.endOf('day');
                    start = end.subtract(15, 'day');
            }
        }

        const countR: Record<string, number> = {};

        // ✅ กรองข้อมูลในช่วงเวลา
        const filteredData = data?.filter((item) => {
            const created = dayjs(item.CreatedAt);
            return created.isBetween(start, end, null, '[]');
        }) ?? [];

        // ✅ ฟอร์แมตรูปแบบ key
        function formatKey(date: dayjs.Dayjs) {
            switch (option) {
                case 'hourly':
                    return date.format('h A'); // เช่น 3 PM
                case 'daily':
                    return date.format('YYYY-MM-DD');
                case 'weekly':
                    return date.startOf('isoWeek').format('YYYY-MM-DD');
                case 'monthly':
                    return date.format('YYYY-MM');
                case 'yearly':
                    return date.format('YYYY');
                default:
                    return date.format('YYYY-MM-DD');
            }
        }

        // ✅ นับจำนวน request ตาม key
        filteredData.forEach((item) => {
            const created = dayjs(item.CreatedAt);
            const key = formatKey(created);
            countR[key] = (countR[key] || 0) + 1;
        });

        // ✅ เติมค่า key ที่ไม่มีให้ครบ
        let cursor = start.clone();
        while (cursor.isBefore(end) || cursor.isSame(end, option === 'hourly' ? 'hour' : 'day')) {
            const key = formatKey(cursor);
            if (!(key in countR)) {
                countR[key] = 0;
            }

            switch (option) {
                case 'hourly':
                    cursor = cursor.add(1, 'hour');
                    break;
                case 'daily':
                    cursor = cursor.add(1, 'day');
                    break;
                case 'weekly':
                    cursor = cursor.add(1, 'week');
                    break;
                case 'monthly':
                    cursor = cursor.add(1, 'month');
                    break;
                case 'yearly':
                    cursor = cursor.add(1, 'year');
                    break;
            }
        }

        // ✅ เรียง key ตามลำดับเวลา
        return Object.fromEntries(
            Object.entries(countR).sort(([a], [b]) => {
                if (option === 'hourly') {
                    const parseTime = (t: string) => dayjs(t, 'h A').toDate().getTime();
                    return parseTime(a) - parseTime(b);
                } else {
                    return new Date(a).getTime() - new Date(b).getTime();
                }
            })
        );

    }, [data, dateRange, selectedDateOption]);


    const chartConfig = useMemo(() => {
        const categories = Object.keys(countRequests);
        const option = selectedDateOption ?? 'daily'; // fallback daily
        const dataSeries = categories.map((key) => countRequests[key]);

        // ฟังก์ชัน format label แกน x ตาม option
        function formatLabel(dateStr: string) {
            const d = dayjs(dateStr);
            if (!d.isValid()) return dateStr;

            switch (option) {
                case 'daily':
                    return d.format("D MMM"); // เช่น 14 Jul
                case 'weekly':
                    const endWeek = d.endOf("isoWeek");
                    return `${endWeek.format("D MMM")}`;
                case 'monthly':
                    return d.format("MMM YYYY"); // Jul 2025
                case 'yearly':
                    return d.format("YYYY"); // 2025
                case 'hourly':
                    return d.format("HH:mm"); // เช่น 08:00
                default:
                    return d.format("D MMM");
            }
        }

        const formattedCategories = categories.map(formatLabel);

        const options: ApexOptions = {
            chart: {
                height,
                type: "area",
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: true,
                        zoom: false,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: true,
                    },
                },
            },
            dataLabels: { enabled: false },
            stroke: { curve: "smooth" },
            xaxis: {
                type: "category",
                categories: formattedCategories,
                tickPlacement: "on",
                range:
                    option === "daily"
                        ? (isMd ? 15 : isSm650 ? 9 : isMobile ? 7 : 4)
                        : option === "weekly"
                            ? (isMd ? 11 : isSm650 ? 7 : isMobile ? 4 : 3)
                            : option === "monthly"
                                ? (isMd ? 11 : isSm650 ? 7 : isMobile ? 4 : 3)
                                : option === "yearly"
                                    ? (isMd ? 5 : isSm650 ? 5 : isMobile ? 4 : 3)
                                    : option === "hourly"
                                        ? (isMd ? 11 : isSm650 ? 8 : isMobile ? 5 : 4)
                                        : undefined,
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
                    const value = series[seriesIndex][dataPointIndex]; // ค่า Y
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
                        <div>Request: <b>${value}</b></div>
                    </div>
                `;
                },
            },
        };

        const series = [{ name: "Requests", data: dataSeries }];

        return { options, series };
    }, [countRequests, mode, height, selectedDateOption]);

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

export default ApexLineChart;
