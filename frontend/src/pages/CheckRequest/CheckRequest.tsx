import React, { useEffect, useState } from "react";
import SuccessAlert from "../../components/Alert/SuccessAlert";
import ErrorAlert from "../../components/Alert/ErrorAlert";
import WarningAlert from "../../components/Alert/WarningAlert";
import { Box, Button, Card, CardContent, Grid2, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faUserTie } from "@fortawesome/free-solid-svg-icons";
import StepperComponent from "../../components/Stepper/Stepper";
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";
import { GetMaintenanceRequestByID } from "../../services/http";
import './CheckRequest.css'

function CheckRequest() {
    const [maintenanceRequest, setMaintenanceRequest] = useState<MaintenanceRequestsInterface>()
    const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);

    const [requestStatusID, setRequestStatusID] = useState(0)

    const steps = ["Creating Request", "Pending", "Approved", "In Progress", "Completed"];

    const getMaintenanceRequest = async () => {
        try {
            const requestID = localStorage.getItem('requestID')
            const res = await GetMaintenanceRequestByID(Number(requestID));
            if (res) {
                setMaintenanceRequest(res);
                setRequestStatusID(res.RequestStatusID)
            }
        } catch (error) {
            console.error("Error fetching request maintenance requests:", error);
        }
    };

    const dateFormat = (date: string) => {
        return `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`
    }

    const managerApproval = maintenanceRequest?.ManagerApproval;
    const maintenanceTask = maintenanceRequest?.MaintenanceTask;

    const managerName = managerApproval
        ? `${managerApproval.User?.FirstName} ${managerApproval.User?.LastName}`
        : "-";

    const operatorName = maintenanceTask
        ? `${maintenanceTask.User?.FirstName} ${maintenanceTask.User?.LastName}`
        : "-";

    const approvalTime = managerApproval?.CreatedAt
        ? dateFormat(managerApproval.CreatedAt)
        : "ยังไม่ได้รับการอนุมัติ";

    const assignTime = maintenanceTask?.CreatedAt
        ? dateFormat(maintenanceTask.CreatedAt)
        : "ยังไม่ได้มอบหมายงาน";

    type InfoCardProps = {
        title: string;
        name: string;
        time: string;
    };

    // ฟังก์ชันแสดง Card 
    const InfoCard: React.FC<InfoCardProps> = ({ title, name, time }) => (
        <Grid2 size={{ xs: 10, md: 2 }}>
            <Card className="card" sx={{ width: "100%", borderRadius: 2, px: 2.5, py: 2, minHeight: '100%' }}>
                <CardContent className="card-content" sx={{ pt: 3 }}>
                    <Grid2 size={{ xs: 10, md: 12 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500, fontSize: 16 }}>
                            {title}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: 20 }}>
                            {name}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, fontSize: 16, color: "#6D6E70" }}>
                            {time}
                        </Typography>
                    </Grid2>
                    <Grid2 size={{ xs: 10, md: 8 }} sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Box
                            sx={{
                                borderRadius: "50%",
                                bgcolor: "#F26522",
                                border: 1,
                                aspectRatio: "1/1",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 55,
                                color: "#fff",
                            }}
                        >
                            <FontAwesomeIcon icon={faUserTie} size="2xl" />
                        </Box>
                    </Grid2>
                </CardContent>
            </Card>
        </Grid2>
    );

    useEffect(() => {
        getMaintenanceRequest()
    }, [])

    console.log(maintenanceRequest)

    return (
        <div className="check-requests-page">
            {/* Show Alerts */}
            {alerts.map((alert, index) => {
                return (
                    <React.Fragment key={index}>
                        {alert.type === 'success' && (
                            <SuccessAlert
                                message={alert.message}
                                onClose={() => setAlerts(alerts.filter((_, i) => i !== index))}
                                index={Number(index)}
                                totalAlerts={alerts.length}
                            />
                        )}
                        {alert.type === 'error' && (
                            <ErrorAlert
                                message={alert.message}
                                onClose={() => setAlerts(alerts.filter((_, i) => i !== index))}
                                index={index}
                                totalAlerts={alerts.length}
                            />
                        )}
                        {alert.type === 'warning' && (
                            <WarningAlert
                                message={alert.message}
                                onClose={() => setAlerts(alerts.filter((_, i) => i !== index))}
                                index={index}
                                totalAlerts={alerts.length}
                            />
                        )}
                    </React.Fragment>
                );
            })}

            {/* Header Section */}
            <Grid2 container spacing={2}>
                <Grid2 className='title-box' size={{ xs: 10, md: 10 }}>
                    <Typography variant="h6" className="title">
                        ตรวจสอบคำร้องแจ้งซ่อม
                    </Typography>
                </Grid2>
                <Grid2 container size={{ xs: 10, md: 2 }} sx={{ justifyContent: "flex-end" }}>
                    <Link to="/maintenance-request" style={{ textAlign: 'center' }}>
                        <Button variant="outlined">
                            <FontAwesomeIcon icon={faAngleLeft} size="lg" />
                            <Typography sx={{ fontSize: 14, ml: 0.6 }}>ย้อนกลับ</Typography>
                        </Button>
                    </Link>
                </Grid2>

                <Grid2 size={{ xs: 10, md: 8 }}>
                    <Card sx={{ width: '100%', borderRadius: 2 }}>
                        <CardContent sx={{ p: '16px 24px' }}>
                            <StepperComponent activeStep={requestStatusID} steps={steps} />
                        </CardContent>
                    </Card>
                </Grid2>

                {
                    maintenanceRequest && (
                        <>
                            <InfoCard title="ผู้อนุมัติ" name={managerName} time={approvalTime} />
                            <InfoCard title="ผู้ดำเนินการ" name={operatorName} time={assignTime} />
                        </>
                    )
                }


                {/* Form Card Section */}
                <Card className="status-card" sx={{ width: '100%', borderRadius: 2 }}>
                    <CardContent>
                        <Grid2 container
                            spacing={8}
                            sx={{ px: 6, py: 4, alignItems: "flex-start" }}
                        >   
                            <Typography variant="body1" sx={{ fontSize: 18, fontWeight: 500 }}>{'ข้อมูลการแจ้งซ่อม'}</Typography>
                            {maintenanceRequest?.Area?.Name}
                            {maintenanceRequest?.AreaDetail}
                            {maintenanceRequest?.Description}
                            {dateFormat(maintenanceRequest?.CreatedAt ?? '')}
                            {maintenanceRequest?.Room?.RoomType?.TypeName}
                            {maintenanceRequest?.Room?.Floor?.Number}
                            {maintenanceRequest?.Room?.RoomNumber}

                        </Grid2>
                    </CardContent>
                </Card>
            </Grid2>
        </div>
    )
}
export default CheckRequest