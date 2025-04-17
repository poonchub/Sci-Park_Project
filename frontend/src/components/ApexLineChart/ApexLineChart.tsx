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
            chart: { height, type: 'area' },
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth' },
            xaxis: {
                type: 'category',
                categories: [],
                labels: {
                    style: {
                        colors: 'text.primary',
                        fontSize: '14px',
                        fontFamily: 'Noto Sans Thai, sans-serif'
                    }
                }
            },
            yaxis: {
                min: 0,
                labels: {
                    style: {
                        colors: 'text.primary',
                        fontSize: '14px',
                        fontFamily: 'Noto Sans Thai, sans-serif'
                    }
                }
            },
        },
    });

    useEffect(() => {
        const countR: Record<string, number> = {};

        data.forEach(item => {
            const createdDate = dayjs(item.CreatedAt);

            let key = '';
            if (dayjs(selectedDate).isValid()) {
                // แบบรายวัน
                key = createdDate.format('YYYY-MM-DD');
            } else {
                // แบบรายเดือน
                key = createdDate.format('YYYY-MM');
            }

            countR[key] = (countR[key] || 0) + 1;
        });

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
                ? d.format('D')       // รายวัน: แสดงวันที่ (เช่น "1", "2")
                : d.format('MMM');    // รายเดือน: แสดงชื่อเดือน (เช่น "Jan")
        });
    
        setState(prev => ({
            ...prev,
            series: [{ name: 'Requests', data: dataSeries }],
            options: {
                ...prev.options,
                xaxis: { ...prev.options.xaxis, categories: formattedCategories }
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