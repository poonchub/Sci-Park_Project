import dayjs, { Dayjs } from "dayjs";
import { useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";
import { ApexOptions } from "apexcharts";

type CountItem =
    | { day: string; count: number }
    | { month: string; count: number };

const getModeFromClass = () => {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

function ApexLineChart(props: {
    data?: MaintenanceRequestsInterface[];
    height: number;
    selectedDate?: Dayjs | null;
    counts?: CountItem[];
}) {
    const { data, height, selectedDate, counts } = props;
    const [mode, setMode] = useState<"light" | "dark">(getModeFromClass());

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

    // คำนวณข้อมูลที่ใช้แสดงกราฟ
    const countRequests = useMemo(() => {
        const now = dayjs();
        const countR: Record<string, number> = {};

        const isUsingData = data && data.length > 0;
        const isUsingCounts = !isUsingData && counts && counts.length > 0;

        if (isUsingData) {
            data!.forEach((item) => {
                const createdDate = dayjs(item.CreatedAt);
                const key = dayjs(selectedDate).isValid()
                    ? createdDate.format("YYYY-MM-DD")
                    : createdDate.format("YYYY-MM");

                countR[key] = (countR[key] || 0) + 1;
            });

            if (dayjs(selectedDate).isValid()) {
                const selected = selectedDate!;
                const startOfMonth = selected.startOf("month");
                const endOfMonth = selected.isSame(now, "month") ? now : selected.endOf("month");
                let current = startOfMonth.clone();

                while (current.isBefore(endOfMonth) || current.isSame(endOfMonth, "day")) {
                    const key = current.format("YYYY-MM-DD");
                    if (!(key in countR)) countR[key] = 0;
                    current = current.add(1, "day");
                }
            } else {
                const years = data!.map((item) => dayjs(item.CreatedAt).year());
                const minYear = Math.min(...years);
                const maxYear = Math.min(Math.max(...years), now.year());

                for (let year = minYear; year <= maxYear; year++) {
                    const maxMonth = year === now.year() ? now.month() + 1 : 12;
                    for (let month = 1; month <= maxMonth; month++) {
                        const key = dayjs(`${year}-${month}`, "YYYY-M").format("YYYY-MM");
                        if (!(key in countR)) countR[key] = 0;
                    }
                }
            }
        } else if (isUsingCounts) {
            const isDaily = "day" in counts![0];
            counts!.forEach((item) => {
                let key: string;
                if ("day" in item) {
                    key = item.day;
                } else if ("month" in item) {
                    key = item.month;
                } else {
                    return;
                }

                if (dayjs(key, isDaily ? "YYYY-MM-DD" : "YYYY-MM", true).isValid()) {
                    countR[key] = item.count;
                }
            });

            if (isDaily && selectedDate) {
                const startOfMonth = selectedDate.startOf("month");
                const endOfMonth = selectedDate.isSame(now, "month") ? now : selectedDate.endOf("month");
                let current = startOfMonth.clone();

                while (current.isBefore(endOfMonth) || current.isSame(endOfMonth, "day")) {
                    const key = current.format("YYYY-MM-DD");
                    if (!(key in countR)) countR[key] = 0;
                    current = current.add(1, "day");
                }
            } else {
                const years = Array.from(
                    new Set(
                        counts!
                            .map((item) => {
                                const key = "day" in item ? item.day : item.month;
                                return dayjs(key, isDaily ? "YYYY-MM-DD" : "YYYY-MM", true);
                            })
                            .filter((d) => d?.isValid())
                            .map((d) => d!.year())
                    )
                );

                years.forEach((year) => {
                    for (let month = 0; month < 12; month++) {
                        const date = dayjs(`${year}-${month + 1}`, "YYYY-M");
                        const key = date.format("YYYY-MM");
                        if (date.isAfter(now, "month")) continue;
                        if (!(key in countR)) countR[key] = 0;
                    }
                });
            }
        }

        return Object.fromEntries(
            Object.entries(countR).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        );
    }, [data, counts, selectedDate]);

    // เตรียม options และ series
    const chartConfig = useMemo(() => {
        const categories = Object.keys(countRequests);
        const isDaily = categories[0]?.length === 10;
        const dataSeries = categories.map((key) => countRequests[key]);

        const formattedCategories = categories.map((date) =>
            isDaily ? dayjs(date).format("D MMM") : dayjs(date).format("MMM YYYY")
        );

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
                range: isDaily ? 6 : categories.length >= 5 ? 5 : undefined,
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
                forceNiceScale: true,
                decimalsInFloat: 0,
                labels: {
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
                    const value = series[seriesIndex][dataPointIndex]; // ค่า Y (จำนวน request)
                    const label = w.globals.categoryLabels?.[dataPointIndex] || "ไม่ทราบวันที่";

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
            }

        };

        const series = [{ name: "Requests", data: dataSeries }];

        return { options, series };
    }, [countRequests, mode, height]);

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
