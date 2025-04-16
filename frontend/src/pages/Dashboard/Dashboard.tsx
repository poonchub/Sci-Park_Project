import { useEffect, useState } from 'react'
import AlertGroup from '../../components/AlertGroup/AlertGroup';
import { Card, Grid2, Typography } from '@mui/material';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import handleAction from '../../utils/handleAction';
import { GetMaintenanceRequests, GetRequestStatuses, GetUserById } from '../../services/http';
import { UserInterface } from '../../interfaces/IUser';
import { MaintenanceRequestsInterface } from '../../interfaces/IMaintenanceRequests';
import { RequestStatusesInterface } from '../../interfaces/IRequestStatuses';

import "./DashBoard.css"
import ApexLineChart from '../../components/ApexLineChart/ApexLineChart';
import RequestStatusCards from '../../components/RequestStatusCards/RequestStatusCards';
import ApexDonutChart from '../../components/ApexDonutChart/ApexDonutChart';

function Dashboard() {

    const [user, setUser] = useState<UserInterface>()
    const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequestsInterface[]>([])
    const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([])

    const [countRequestStatus, setCountRequestStatus] = useState<Record<string, number>>()

    const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);
    const [openConfirmApproved, setOpenConfirmApproved] = useState<boolean>(false);
    const [openConfirmRejected, setOpenConfirmRejected] = useState<boolean>(false);

    const [requestSelected, setRequestSelected] = useState(0)

    const [total, setTotal] = useState(0);

    const getUser = async () => {
        try {
            const res = await GetUserById(Number(localStorage.getItem('userId')));
            if (res) {
                setUser(res);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    }

    const getMaintenanceRequests = async () => {
        try {
            const res = await GetMaintenanceRequests(0, 0, 5, 0, "");
            if (res) {
                setMaintenanceRequests(res.data);
                setTotal(res.total);
            }
        } catch (error) {
            console.error("Error fetching request maintenance requests:", error);
        }
    };

    const getRequestStatuses = async () => {
        try {
            const res = await GetRequestStatuses();
            if (res) {
                setRequestStatuses(res);
            }
        } catch (error) {
            console.error("Error fetching request statuses:", error);
        }
    };

    const handleClick = (statusID: number, message: string) => {
        handleAction(statusID, message, {
            userID: user?.ID,
            requestSelected,
            setAlerts,
            refreshRequestData: getMaintenanceRequests,
            setOpenConfirmApproved,
            setOpenConfirmRejected,
        });
    };

    useEffect(() => {
        getRequestStatuses();
        getMaintenanceRequests()
        getUser()
    }, []);

    useEffect(() => {
        const countStatus = maintenanceRequests.reduce<Record<string, number>>((acc, item) => {
            const status = item.RequestStatus?.Name || "Unknown";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        setCountRequestStatus(countStatus)
    }, [maintenanceRequests])

    return (
        <div className="dashboard-page">
            {/* Show Alerts */}
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            {/* Approved Confirm */}
            <ConfirmDialog
                open={openConfirmApproved}
                setOpenConfirm={setOpenConfirmApproved}
                handleFunction={() => handleClick(2, "Approval successful")}
                title="ยืนยันการอนุมัติงานแจ้งซ่อม"
                message="คุณแน่ใจหรือไม่ว่าต้องการอนุมัติงานแจ้งซ่อมนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
            />

            {/* Rejected Confirm */}
            <ConfirmDialog
                open={openConfirmRejected}
                setOpenConfirm={setOpenConfirmRejected}
                handleFunction={() => handleClick(3, "Rejection successful")}
                title="ยืนยันการปฏิเสธงานแจ้งซ่อม"
                message="คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธงานแจ้งซ่อมนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
            />

            <Grid2 container spacing={3}>

                {/* Header Section */}
                <Grid2 className='title-box' size={{ xs: 10, md: 12 }}>
                    <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                        แดชบอร์ด
                    </Typography>
                </Grid2>

                <Grid2 container size={{ xs: 10, md: 8 }} spacing={3}>

                    {/* Status Section */}
                    <RequestStatusCards countRequestStatus={countRequestStatus || {}} />

                    {/* Chart Line Section */}
                    <Grid2 size={{ xs: 10, md: 12 }} >
                        <Card sx={{ bgcolor: "secondary.main", borderRadius: 2, py: 2, px: 3 }}>
                            <Typography variant="body1" color="text.primary" sx={{ fontWeight: 600 }}>รายการแจ้งซ่อม</Typography>
                            <Typography sx={{ fontWeight: 700, fontSize: 24, color: '#F26522' }}>{`${total} รายการ`}</Typography>
                            <ApexLineChart data={maintenanceRequests} height={250} />
                        </Card>
                    </Grid2>
                </Grid2>

                {/* Chart Circle Section */}
                <Grid2 size={{ xs: 10, md: 4 }} >
                    <ApexDonutChart
                        data={{
                            'งานไฟฟ้า': 25,
                            'งานเฟอร์นิเจอร์': 12,
                            'งานประปา': 3,
                            'งานเครื่องใช้ไฟฟ้า': 3,
                        }}
                    />

                </Grid2>
            </Grid2>
        </div>
    )
}
export default Dashboard;