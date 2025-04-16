import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { MaintenanceRequestsInterface } from '../../interfaces/IMaintenanceRequests';

function ApexLineChart(props: { data: MaintenanceRequestsInterface[], height: number }) {
    const { data, height } = props;

    // State to store the count of requests per day
    const [countRequests, setCountRequest] = useState<Record<string, number>>({});
    // State to store chart data and options
    const [state, setState] = useState<{
        series: { name: string; data: number[] }[]; // Data for the chart
        options: ApexOptions; // Configuration for the chart
    }>({
        series: [{ name: 'Requests', data: [] }],
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

    // Calculate the number of requests per day
    useEffect(() => {
        const countR = data.reduce((acc, item) => {
            const date = item.CreatedAt?.slice(0, 10) || "Unknown";
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Sort the requests by date
        const sortedCountR = Object.entries(countR)
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .reduce((acc, [date, value]) => {
                acc[date] = value;
                return acc;
            }, {} as Record<string, number>);

        // Update the state with the sorted data
        setCountRequest(sortedCountR);
    }, [data]);

    // Update chart state based on the request counts
    useEffect(() => {
        const categories = Object.keys(countRequests);
        const dataSeries = categories.map(date => countRequests[date]);

        // Format the dates for the x-axis labels
        const formattedCategories = categories.map(date => {
            const parsedDate = new Date(date);
            return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(parsedDate);
        });

        // Update the chart state with new categories and series data
        setState(prevState => ({
            ...prevState,
            series: [{ name: 'Requests', data: dataSeries }],
            options: { ...prevState.options, xaxis: { categories: formattedCategories } },
        }));
    }, [countRequests]);

    return (
        <div>
            {/* Render the chart */}
            <ReactApexChart options={state.options} series={state.series} type="area" height={height} />
        </div>
    );
}

export default ApexLineChart;