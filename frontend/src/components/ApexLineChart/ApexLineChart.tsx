import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";
import { ApexOptions } from "apexcharts";

function ApexLineChart(props: { data: MaintenanceRequestsInterface[], height: number, selectedDate?: Dayjs | null }) {
    const { data, height, selectedDate } = props;
    const [countRequests, setCountRequest] = useState<Record<string, number>>({});

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
        const countR: Record<string, number> = {};
    
        data.forEach(item => {
            const createdDate = dayjs(item.CreatedAt);
            const key = dayjs(selectedDate).isValid()
                ? createdDate.format('YYYY-MM-DD') // รายวัน
                : createdDate.format('YYYY-MM');   // รายเดือน
    
            countR[key] = (countR[key] || 0) + 1;
        });
    
        const now = dayjs();
    
        if (dayjs(selectedDate).isValid()) {
            // ✅ รายวัน: เติมวันในเดือนที่เลือก จนถึงวันนี้ (ถ้าเดือนปัจจุบัน)
            const selected = selectedDate!;
            const startOfMonth = selected.startOf('month');
            const endOfMonth = selected.isSame(now, 'month') ? now : selected.endOf('month');
    
            let current = startOfMonth.clone();
            while (current.isBefore(endOfMonth) || current.isSame(endOfMonth, 'day')) {
                const key = current.format('YYYY-MM-DD');
                if (!(key in countR)) {
                    countR[key] = 0;
                }
                current = current.add(1, 'day');
            }
    
        } else {
            // ✅ รายเดือน: เติมเดือนให้ครบ แต่ไม่เกินเดือนปัจจุบัน
            const years = data.map(item => dayjs(item.CreatedAt).year());
            const minYear = Math.min(...years);
            const maxYear = Math.min(Math.max(...years), now.year()); // จำกัดไม่เกินปีปัจจุบัน
    
            for (let year = minYear; year <= maxYear; year++) {
                const maxMonth = year === now.year() ? now.month() + 1 : 12; // เดือนใน dayjs เริ่มที่ 0
                for (let month = 1; month <= maxMonth; month++) {
                    const key = dayjs(`${year}-${month}`, 'YYYY-M').format('YYYY-MM');
                    if (!(key in countR)) {
                        countR[key] = 0;
                    }
                }
            }
        }
    
        // ✅ จัดเรียงตามเวลา
        const sortedCount = Object.entries(countR)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {} as Record<string, number>);
    
        setCountRequest(sortedCount);
    }, [data, selectedDate]);
    
    

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
                    range: isDaily ? 7 : (categories.length >= 5 ? 5 : undefined),
                }
            }
        }));
    }, [countRequests, selectedDate]);    

    console.log(data)
    console.log('countRequests: ', countRequests)

    return (
        <div>
            <ReactApexChart options={state.options} series={state.series} type="area" height={height} />
        </div>
    );
}
export default ApexLineChart;