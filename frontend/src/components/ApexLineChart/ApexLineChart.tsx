import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";
import { ApexOptions } from "apexcharts";

type CountItem =
    | { day: string; count: number }
    | { month: string; count: number };

function ApexLineChart(props: {
    data?: MaintenanceRequestsInterface[],
    height: number,
    selectedDate?: Dayjs | null,
    counts?: CountItem[]
}) {
    const { data, height, selectedDate, counts } = props;
    const [countRequests, setCountRequest] = useState<Record<string, number>>({});

    console.log(counts)

    const [state, setState] = useState<{
        series: { name: string; data: number[] }[];
        options: ApexOptions;
    }>({
        series: [{ name: 'Requests', data: [] }],
        options: {
            chart: {
                height,
                type: 'area',
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: true,
                        zoom: false,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: true
                    }
                }
            },
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth' },
            xaxis: {
                type: 'category',
                categories: [],
                labels: {
                    style: {
                        colors: 'text.primary',
                        fontSize: '14px',
                        fontFamily: 'Noto Sans Thai, sans-serif',
                    },
                    offsetY: 7,
                },
            },
            yaxis: {
                min: 0,
                labels: {
                    style: {
                        colors: 'text.primary',
                        fontSize: '14px',
                        fontFamily: 'Noto Sans Thai, sans-serif'
                    },
                    offsetX: -9,
                },
                tickAmount: undefined,
                forceNiceScale: true,
                decimalsInFloat: 0,
            },
        },
    });

    useEffect(() => {
        const now = dayjs();

        if (data && data.length > 0) {
            const countR: Record<string, number> = {};

            data.forEach(item => {
                const createdDate = dayjs(item.CreatedAt);
                const key = dayjs(selectedDate).isValid()
                    ? createdDate.format('YYYY-MM-DD')
                    : createdDate.format('YYYY-MM');

                countR[key] = (countR[key] || 0) + 1;
            });

            if (dayjs(selectedDate).isValid()) {
                const selected = selectedDate!;
                const startOfMonth = selected.startOf('month');
                const endOfMonth = selected.isSame(now, 'month') ? now : selected.endOf('month');
                let current = startOfMonth.clone();

                while (current.isBefore(endOfMonth) || current.isSame(endOfMonth, 'day')) {
                    const key = current.format('YYYY-MM-DD');
                    if (!(key in countR)) countR[key] = 0;
                    current = current.add(1, 'day');
                }
            } else {
                const years = data.map(item => dayjs(item.CreatedAt).year());
                const minYear = Math.min(...years);
                const maxYear = Math.min(Math.max(...years), now.year());

                for (let year = minYear; year <= maxYear; year++) {
                    const maxMonth = year === now.year() ? now.month() + 1 : 12;
                    for (let month = 1; month <= maxMonth; month++) {
                        const key = dayjs(`${year}-${month}`, 'YYYY-M').format('YYYY-MM');
                        if (!(key in countR)) countR[key] = 0;
                    }
                }
            }

            const sortedCount = Object.entries(countR)
                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                .reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {} as Record<string, number>);

            setCountRequest(sortedCount);

        } else if (counts && counts.length > 0) {
            const isDaily = 'day' in counts[0];
            const countR: Record<string, number> = {};

            counts.forEach(item => {
                console.log(item);
                let key: string;

                if ('day' in item) {
                    key = item.day;
                } else if ('month' in item) {
                    key = item.month;
                } else {
                    return;
                }
                
                if (dayjs(key, isDaily ? 'YYYY-MM-DD' : 'YYYY-MM', true).isValid()) {
                    countR[key] = item.count;
                } else {
                    console.warn(`Invalid date format: ${key}`);
                }
            });

            if (isDaily && selectedDate) {
                const startOfMonth = selectedDate.startOf('month');
                const endOfMonth = selectedDate.isSame(now, 'month') ? now : selectedDate.endOf('month');
                let current = startOfMonth.clone();

                while (current.isBefore(endOfMonth) || current.isSame(endOfMonth, 'day')) {
                    const key = current.format('YYYY-MM-DD');
                    if (!(key in countR)) countR[key] = 0;
                    current = current.add(1, 'day');
                }
            } else {
                const years = Array.from(
                    new Set(
                        counts
                            .map(item => {
                                let key: string;
                                if ('day' in item) {
                                    key = item.day;
                                } else if ('month' in item) {
                                    key = item.month;
                                } else {
                                    return null;
                                }

                                return dayjs(key, isDaily ? 'YYYY-MM-DD' : 'YYYY-MM', true);
                            })
                            .filter(d => d?.isValid())
                            .map(d => d?.year())
                    )
                );

                years.forEach(year => {
                    for (let month = 0; month < 12; month++) {
                        const date = dayjs(`${year}-${month + 1}`, 'YYYY-M');
                        const key = date.format('YYYY-MM');

                        if (date.isAfter(now, 'month')) continue;
                        if (!(key in countR)) countR[key] = 0;
                    }
                });
            }

            const sortedCount = Object.entries(countR)
                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                .reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {} as Record<string, number>);

            setCountRequest(sortedCount);
        } else {
            setCountRequest({});
        }
    }, [data, counts, selectedDate]);

    useEffect(() => {
        const categories = Object.keys(countRequests);
        const dataSeries = categories.map(date => countRequests[date]);

        // ตรวจสอบว่า key เป็นแบบวันหรือเดือน
        const isDaily = categories[0]?.length === 10; // YYYY-MM-DD

        const formattedCategories = categories.map(date => {
            const d = dayjs(date);
            return isDaily
                ? d.format('D MMM')       // รายวัน: แสดงวันที่ (เช่น "1", "2")
                : d.format('MMM YYYY');   // รายเดือน: แสดงชื่อเดือน (เช่น "Jan")
        });

        setState(prev => ({
            ...prev,
            series: [{ name: 'Requests', data: dataSeries }],
            options: {
                ...prev.options,
                xaxis: {
                    ...prev.options.xaxis,
                    categories: formattedCategories,
                    tickPlacement: 'on',
                    range: isDaily ? 6 : (categories.length >= 5 ? 5 : undefined),
                }
            }
        }));
    }, [countRequests, selectedDate]);

    return (
        <div>
            <ReactApexChart options={state.options} series={state.series} type="area" height={height} />
        </div>
    );
}
export default ApexLineChart;