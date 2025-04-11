import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Card, CardContent, Grid2, ImageList, ImageListItem, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faUserTie, faXmark } from "@fortawesome/free-solid-svg-icons";
import StepperComponent from "../../components/Stepper/Stepper";
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";
import { apiUrl, GetMaintenanceRequestByID, GetOperators, GetRequestStatuses } from "../../services/http";
import './CheckRequest.css'
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses";
import AlertGroup from "../../components/AlertGroup/AlertGroup";
import dateFormat from "../../utils/dateFormat";
import RequestInfoTable from "../../components/RequestInfoTable/RequestInfoTable";
import handleAssignWork from "../../utils/handleAssignWork";
import AssignPopup from "../../components/AssignPopup/AssignPopup";
import { UserInterface } from "../../interfaces/IUser";
import { maintenanceTypeConfig } from "../../constants/maintenanceTypeConfig";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import handleAction from "../../utils/handleAction";
import { MaintenaceImagesInterface } from "../../interfaces/IMaintenaceImages";

function CheckRequest() {
    const [maintenanceRequest, setMaintenanceRequest] = useState<MaintenanceRequestsInterface>()
    const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([])
    const [operators, setOperators] = useState<UserInterface[]>([])
    const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);

    const [requestStatusID, setRequestStatusID] = useState(0)

    const [openPopupAssign, setOpenPopupAssign] = useState(false)
    const [selectedOperator, setSelectedOperator] = useState(0)
    const [openConfirmApproved, setOpenConfirmApproved] = useState<boolean>(false);
    const [openConfirmRejected, setOpenConfirmRejected] = useState<boolean>(false);

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

    const getOperators = async () => {
        try {
            const res = await GetOperators();
            if (res) {
                setOperators(res);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    }

    const onClickAssign = () => {
        handleAssignWork({
            selectedOperator,
            requestSelected: maintenanceRequest || {},
            setAlerts,
            refreshRequestData: getMaintenanceRequest,
            setOpenPopupAssign,
        });
    };

    const handleClick = (statusID: number, message: string) => {
        handleAction(statusID, message, {
            userID: maintenanceRequest?.UserID,
            requestSelected: maintenanceRequest?.ID,
            setAlerts,
            refreshRequestData: getMaintenanceRequest,
            setOpenConfirmApproved,
            setOpenConfirmRejected,
        });
    };

    const managerApproval = maintenanceRequest?.ManagerApproval;
    const maintenanceTask = maintenanceRequest?.MaintenanceTask;

    const managerName = managerApproval
        ? `${managerApproval.User?.FirstName} ${managerApproval.User?.LastName}`
        : null;

    const operatorName = maintenanceTask
        ? `${maintenanceTask.User?.FirstName} ${maintenanceTask.User?.LastName}`
        : null;

    const approvalTime = managerApproval?.CreatedAt
        ? dateFormat(managerApproval.CreatedAt)
        : null;

    const assignTime = maintenanceTask?.CreatedAt
        ? dateFormat(maintenanceTask.CreatedAt)
        : null;

    const statusFlowMap: {
        [key: string]: string[];
    } = {
        Normal: ["Creating Request", "Pending", "Approved", "In Progress", "Completed"],
        Rejected: ["Creating Request", "Pending", "Rejected", "In Progress", "Completed"],
        Failed: ["Creating Request", "Pending", "Approved", "In Progress", "Failed"]
    };

    const getStatusGroup = (statusName: string): keyof typeof statusFlowMap => {
        if (statusName === "Rejected") return "Rejected";
        if (statusName === "Failed") return "Failed";
        return "Normal";
    };

    const filteredSteps = useMemo(() => {
        const currentStatus = requestStatuses.find(s => s.ID === requestStatusID);
        if (!currentStatus) return [];

        const group = getStatusGroup(currentStatus.Name || "");
        const flow = statusFlowMap[group];

        // กรองเฉพาะสถานะที่อยู่ใน flow ที่เลือก
        const steps = requestStatuses.filter(s => flow.includes(s.Name || ""));

        // เรียงตาม flow ที่เรากำหนดไว้
        steps.sort((a, b) => flow.indexOf(a.Name || "") - flow.indexOf(b.Name || ""));

        // เพิ่ม Creating Request ไว้หน้า (ถ้าไม่มีในฐานข้อมูล)
        return flow.includes("Creating Request")
            ? [{ ID: -1, Name: "Creating Request" }, ...steps]
            : steps;
    }, [requestStatuses, requestStatusID]);

    const activeStep = useMemo(() => {
        if (!requestStatusID) return 0;
        return filteredSteps.findIndex(s => s.ID === requestStatusID);
    }, [filteredSteps, requestStatusID]);

    type InfoCardProps = {
        type: string;
        title: string;
        name: string | null;
        time: string | null;
    };

    const InfoCard: React.FC<InfoCardProps> = ({ type, title, name, time }) => (
        <Grid2 size={{ xs: 10, md: 2 }}>
            <Card className="card" sx={{ width: "100%", borderRadius: 2, px: 2.5, py: 2, minHeight: '100%' }}>
                <CardContent className="card-content" sx={{ pt: 3 }}>
                    <Grid2 size={{ xs: 10, md: 12 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500, fontSize: 16 }}>
                            {title}
                        </Typography>
                        {
                            name == null && type == 'approved' ? (
                                <Typography variant="body1" sx={{ fontSize: 14, color: '#6D6E70', mb: '4px' }}>
                                    ยังไม่ได้อนุมัติ
                                </Typography>
                            ) : name == null && type == 'assigned' ? (
                                <Typography variant="body1" sx={{ fontSize: 14, color: '#6D6E70', mb: '4px' }}>
                                    ยังไม่ได้มอบหมาย
                                </Typography>
                            ) : (
                                <Typography variant="body1" sx={{ fontWeight: 600, fontSize: 20 }}>
                                    {name}
                                </Typography>
                            )
                        }
                        {
                            time == null && type == 'approved' ? (
                                <>
                                    <Button
                                        onClick={() => {
                                            setOpenConfirmApproved(true)
                                        }}
                                        sx={{
                                            bgcolor: '#08aff1',
                                            color: '#fff',
                                            fontSize: '14px',
                                            border: '1px solid #08aff1',
                                            mr: 0.6,
                                            "&:hover": {
                                                borderColor: 'transparent'
                                            }
                                        }}
                                    >
                                        อนุมัติ
                                    </Button>
                                    <Button
                                        // variant="outlined"
                                        onClick={() => {
                                            setOpenConfirmRejected(true)
                                        }}
                                        sx={{
                                            color: '#f00',
                                            fontSize: '14px',
                                            border: '1px solid',
                                            py: 0.75,
                                            px: 0.5,
                                            minWidth: 25
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faXmark} size="xl" />
                                    </Button></>
                            ) : time == null && type == 'assigned' ? (
                                <Button
                                    onClick={() => {
                                        setOpenPopupAssign(true)
                                    }}
                                    sx={{
                                        bgcolor: '#08aff1',
                                        color: '#fff',
                                        fontSize: '14px',
                                        border: '1px solid #08aff1',
                                        "&:hover": {
                                            borderColor: 'transparent'
                                        }
                                    }}
                                >
                                    มอบหมายงาน
                                </Button>
                            ) : (
                                <Typography variant="body1" sx={{ fontWeight: 500, fontSize: 16, color: "#6D6E70" }}>
                                    {time}
                                </Typography>
                            )
                        }

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
        </Grid2 >
    );

    const renderImages = (images: MaintenaceImagesInterface[], apiUrl: string) => {
        const count = images.length;
      
        if (count === 1) {
          return (
            <Grid2 size={{ xs: 12, md: 12 }} sx={{ alignItems: "center" }}>
              <img
                src={`${apiUrl}/${images[0].FilePath}`}
                alt="image"
                style={{ width: '100%', borderRadius: 8 }}
              />
            </Grid2>
          );
        }
      
        if (count === 2) {
          return (
            <>
              <Grid2 size={{ xs: 12, md: 6 }} sx={{ alignItems: "center" }}>
                <img
                  src={`${apiUrl}/${images[0].FilePath}`}
                  alt="image1"
                  style={{ width: '100%', borderRadius: 8 }}
                />
              </Grid2>
              <Grid2 size={{ xs: 12, md: 6 }} sx={{ alignItems: "center" }}>
                <img
                  src={`${apiUrl}/${images[1].FilePath}`}
                  alt="image2"
                  style={{ width: '100%', borderRadius: 8 }}
                />
              </Grid2>
            </>
          );
        }
      
        if (count === 3) {
          return (
            <>
              <Grid2 size={{ xs: 12, md: 8 }} sx={{ alignItems: "center" }}>
                <img
                  src={`${apiUrl}/${images[0].FilePath}`}
                  alt="image1"
                  style={{ width: '100%', borderRadius: 8 }}
                />
              </Grid2>
              <Grid2 size={{ xs: 12, md: 4 }} sx={{ alignItems: "center" }}>
                <Stack spacing={2}>
                  <img
                    src={`${apiUrl}/${images[1].FilePath}`}
                    alt="image2"
                    style={{ width: '100%', borderRadius: 8 }}
                  />
                  <img
                    src={`${apiUrl}/${images[2].FilePath}`}
                    alt="image3"
                    style={{ width: '100%', borderRadius: 8 }}
                  />
                </Stack>
              </Grid2>
            </>
          );
        }
      
        return (
          <ImageList cols={3} gap={12} sx={{ width: '100%' }}>
            {images.map((img, i) => (
              <ImageListItem key={i}>
                <img
                  src={`${apiUrl}/${img.FilePath}`}
                  alt={`image-${i + 1}`}
                  style={{ borderRadius: 8 }}
                />
              </ImageListItem>
            ))}
          </ImageList>
        );
      };

    useEffect(() => {
        getMaintenanceRequest()
        getRequestStatuses()
        getOperators()
    }, [])

    return (
        <div className="check-requests-page">
            {/* Show Alerts */}
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            {/* Assign Popup */}
            <AssignPopup
                open={openPopupAssign}
                onClose={() => setOpenPopupAssign(false)}
                onConfirm={onClickAssign}
                requestSelected={maintenanceRequest || {}}
                selectedOperator={selectedOperator}
                setSelectedOperator={setSelectedOperator}
                operators={operators}
                maintenanceTypeConfig={maintenanceTypeConfig}
            />

            {/* Approved Confirm */}
            <ConfirmDialog
                open={openConfirmApproved}
                setOpenConfirm={setOpenConfirmApproved}
                handleFunction={() => handleClick(2, "Approval successful")}
                title="ยืนยันการอนุมัติงานแจ้งซ่อม"
                message="คุณแน่ใจหรือไม่ว่าต้องการอนุมัติงานแจ้งซ่อมนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
            />

            {/* Rejected Confirm */}
            <ConfirmDialog
                open={openConfirmRejected}
                setOpenConfirm={setOpenConfirmRejected}
                handleFunction={() => handleClick(3, "Rejection successful")}
                title="ยืนยันการปฏิเสธงานแจ้งซ่อม"
                message="คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธงานแจ้งซ่อมนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
            />

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
                    <Card sx={{
                        width: '100%',
                        borderRadius: 2,
                        height: '100%',
                        alignItems: 'center',
                        display: 'flex'
                    }}>
                        <CardContent sx={{ p: '16px 24px', width: '100%' }}>
                            <StepperComponent
                                activeStep={activeStep}
                                steps={filteredSteps
                                    .map((s) => s.Name)
                                    .filter((name): name is string => typeof name === "string")}
                            />
                        </CardContent>
                    </Card>
                </Grid2>

                {
                    maintenanceRequest && (
                        <>
                            <InfoCard type="approved" title="ผู้อนุมัติ" name={managerName} time={approvalTime} />
                            <InfoCard type="assigned" title="ผู้ดำเนินการ" name={operatorName} time={assignTime} />
                        </>
                    )
                }

                {/* Data Card Section */}
                <Card className="data-card" sx={{ width: '100%', borderRadius: 2 }}>
                    <CardContent>
                        <Grid2 container
                            spacing={3}
                            sx={{ px: 6, py: 2 }}
                        >
                            <Grid2 size={{ xs: 10, md: 12 }} >
                                <Typography variant="body1" sx={{ fontSize: 18, fontWeight: 500 }}>ข้อมูลการแจ้งซ่อม</Typography>
                            </Grid2>
                            <Grid2 size={{ xs: 10, md: 6 }} >
                                <RequestInfoTable data={maintenanceRequest} />
                            </Grid2>

                            <Grid2 container
                                size={{ xs: 10, md: 6 }}
                                direction="column"
                                sx={{
                                }}
                            >
                                <Typography className="title-list" variant="body1" sx={{ width: '100%', pt: '10px' }}>ภาพประกอบ</Typography>
                                <Grid2 container size={{ xs: 10, md: 12 }}>
                                    {
                                        maintenanceRequest?.MaintenanceImages &&
                                        renderImages(maintenanceRequest.MaintenanceImages, apiUrl)
                                    }
                                </Grid2>
                            </Grid2>
                        </Grid2>
                    </CardContent>
                </Card>
            </Grid2>
        </div>
    )
}
export default CheckRequest