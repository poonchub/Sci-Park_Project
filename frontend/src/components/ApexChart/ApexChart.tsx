import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { MaintenanceRequestsInterface } from '../../interfaces/IMaintenanceRequests';

function ApexChart(props: { data: MaintenanceRequestsInterface[], height: number }) {
    const { data, height } = props;

    const [countRequests, setCountRequest] = useState<Record<string, number>>({});
    const [state, setState] = useState<{
        series: { name: string; data: number[] }[]; // กำหนดประเภทของ series ให้ถูกต้อง
        options: ApexOptions;
    }>({
        series: [{
            name: 'Requests',
            data: []
        }],
        options: {
            chart: {
                height: height,
                type: 'area' as 'area',
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth'
            },
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
                labels: {
                    style: {
                        colors: 'text.primary', 
                        fontSize: '14px',
                        fontFamily: 'Noto Sans Thai, sans-serif'
                    }
                }
            },
            tooltip: {
                x: {
                    format: 'dd/MM/yy'
                },
            },
        },
    });

    useEffect(() => {
        // คำนวณจำนวนคำขอในแต่ละวัน
        const countR: Record<string, number> = data.reduce((acc, item) => {
            const date = item.CreatedAt?.slice(0, 10) || "Unknown";
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // จัดเรียงข้อมูลตามวันที่
        const sortedCountR = Object.entries(countR)
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .reduce((acc, [date, value]) => {
                acc[date] = value;
                return acc;
            }, {} as Record<string, number>);

        setCountRequest(sortedCountR);
    }, [data]);


    useEffect(() => {
        // อัปเดตข้อมูลกราฟตาม countRequests
        const categories = Object.keys(countRequests);
        const dataSeries = categories.map(date => countRequests[date]);

        // แปลง categories ให้อยู่ในรูปแบบ '29 Mar'
        const formattedCategories = categories.map(date => {
            const parsedDate = new Date(date);
            return new Intl.DateTimeFormat('en-GB', {
                day: '2-digit',
                month: 'short'
            }).format(parsedDate);
        });

        setState(prevState => ({
            ...prevState,
            series: [{
                name: 'Requests',
                data: dataSeries,
            }],
            options: {
                ...prevState.options,
                xaxis: {
                    type: 'category',
                    categories: formattedCategories,
                },
            },
        }));
    }, [countRequests]);


    return (
        <div>
            <div id="chart">
                <ReactApexChart options={state.options} series={state.series} type="area" height={height} />
            </div>
            <div id="html-dist"></div>
        </div>
    );
}

export default ApexChart;