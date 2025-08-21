import { useEffect, useState } from "react";
import { Box, Button, Card, CardContent, Container, Grid, Skeleton, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faCheck, faPaperPlane, faRepeat, faXmark } from "@fortawesome/free-solid-svg-icons";

import "./CheckRequest.css";

import { apiUrl, GetMaintenanceRequestByID, GetOperators, GetRequestStatuses, socketUrl, UpdateMaintenanceRequestByID } from "../../services/http";
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses";
import { UserInterface } from "../../interfaces/IUser";

import AlertGroup from "../../components/AlertGroup/AlertGroup";
import RequestInfoTable from "../../components/RequestInfoTable/RequestInfoTable";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import InfoCard from "../../components/InfoCard/InfoCard";
import RequestStepper from "../../components/RequestStepper/RequestStepper";
import RequestImages from "../../components/RequestImages/RequestImages";

import dateFormat from "../../utils/dateFormat";

import { maintenanceTypeConfig } from "../../constants/maintenanceTypeConfig";
import SubmitPopup from "../../components/SubmitPopup/SubmitPopup";
import handleSubmitWork from "../../utils/handleSubmitWork";
import TaskInfoTable from "../../components/TaskInfoTable/TaskInfoTable";
import { isAdmin, isManager, isOperator } from "../../routes";
import handleActionApproval from "../../utils/handleActionApproval";
import ApprovePopup from "../../components/ApprovePopup/ApprovePopup";
import handleActionAcception from "../../utils/handleActionAcception";
import handleActionInspection from "../../utils/handleActionInspection";
import ReworkPopup from "../../components/ReworkPopup/ReworkPopup";
import { MaintenaceImagesInterface } from "../../interfaces/IMaintenaceImages";

import { io } from "socket.io-client";

import { useSearchParams } from "react-router-dom";
import { Base64 } from "js-base64";
import { Check, ChevronLeft, NotebookText, Repeat, Send, X } from "lucide-react";

function CheckRequest() {
    // Request data
    const [maintenanceRequest, setMaintenanceRequest] = useState<MaintenanceRequestsInterface>();
    const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([]);
    const [requestStatusID, setRequestStatusID] = useState(0);

    // Users eligible for assignment
    const [operators, setOperators] = useState<UserInterface[]>([]);

    // UI state
    const [selectedOperator, setSelectedOperator] = useState(0);
    const [openPopupApproved, setOpenPopupApproved] = useState(false);
    const [openConfirmRejected, setOpenConfirmRejected] = useState<boolean>(false);
    const [openPopupSubmit, setOpenPopupSubmit] = useState(false);
    const [openConfirmAccepted, setOpenConfirmAccepted] = useState<boolean>(false);
    const [openConfirmCancelledFromOwnRequest, setOpenConfirmCancelledFromOwnRequest] = useState<boolean>(false);
    const [openConfirmCancelledFromOperator, setOpenConfirmCancelledFromOperator] = useState<boolean>(false);
    const [openConfirmInspection, setOpenConfirmInspection] = useState<boolean>(false);
    const [openConfirmRework, setOpenConfirmRework] = useState<boolean>(false);

    const [requestfiles, setRequestFiles] = useState<File[]>([]);
    const [submitfiles, setSubmitFiles] = useState<File[]>([]);
    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);

    const navigate = useNavigate();

    const [isLoadingData, setIsLoadingData] = useState(true);

    const [searchParams] = useSearchParams();

    const [isBottonActive, setIsBottonActive] = useState(false);

    // Extract info for cards
    const managerApproval = maintenanceRequest?.ManagerApproval;
    const maintenanceTask = maintenanceRequest?.MaintenanceTask;
    const maintenanceImages = maintenanceRequest?.MaintenanceImages;
    const taskImages = maintenanceTask?.HandoverImages;

    const managerName = managerApproval ? `${managerApproval.User?.FirstName} ${managerApproval.User?.LastName}` : null;

    const operatorName = maintenanceTask ? `${maintenanceTask.User?.FirstName} ${maintenanceTask.User?.LastName}` : null;

    const approvalDate = managerApproval?.CreatedAt ? dateFormat(managerApproval.CreatedAt) : null;

    const assignDate = maintenanceTask?.CreatedAt ? dateFormat(maintenanceTask.CreatedAt) : null;

    const cancellerName =
        maintenanceRequest?.RequestStatus?.Name === "Unsuccessful"
            ? maintenanceTask?.Note
                ? `${maintenanceTask?.User?.FirstName} ${maintenanceTask.User?.LastName}`
                : managerApproval?.Note
                  ? `${managerApproval.User?.FirstName} ${managerApproval.User?.LastName}`
                  : `${maintenanceRequest.User?.FirstName} ${maintenanceRequest.User?.LastName}`
            : "";

    const cancelDate =
        maintenanceRequest?.RequestStatus?.Name === "Unsuccessful"
            ? maintenanceTask?.Note
                ? dateFormat(maintenanceTask?.UpdatedAt || "")
                : managerApproval?.Note
                  ? dateFormat(managerApproval?.UpdatedAt || "")
                  : dateFormat(maintenanceRequest?.UpdatedAt || "")
            : "";

    const userID = Number(localStorage.getItem("userId"));
    const isOwnRequest = maintenanceRequest?.UserID === userID;
    const isOwnTask = maintenanceTask?.UserID === userID;

    const RequestStatus = maintenanceRequest?.RequestStatus?.Name;
    const isPending = RequestStatus === "Pending";
    const isApproved = RequestStatus === "Approved";
    const isInProgress = RequestStatus === "In Progress";
    const isWaitingForReview = RequestStatus === "Waiting For Review";
    const isRework = RequestStatus === "Rework Requested";
    const isUnsuccessful = RequestStatus === "Unsuccessful";

    const isNotApproved = maintenanceRequest?.ManagerApproval === null;

    // Fetch request by ID
    const getMaintenanceRequest = async () => {
        try {
            const encodedId = searchParams.get("request_id");
            const requestID = encodedId ? Base64.decode(decodeURIComponent(encodedId)) : null;
            const res = await GetMaintenanceRequestByID(Number(requestID));
            if (res) {
                setMaintenanceRequest(res);
                setRequestStatusID(res.RequestStatusID);
            }
        } catch (error) {
            console.error("Error fetching maintenance request:", error);
        }
    };

    // Fetch all statuses for the stepper
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

    // Fetch assignable users
    const getOperators = async () => {
        try {
            const res = await GetOperators();
            if (res) {
                setOperators(res);
            }
        } catch (error) {
            console.error("Error fetching operators:", error);
        }
    };

    // Handle sumitting task to an operator
    const onClickSubmit = () => {
        setIsBottonActive(true);

        if (!maintenanceRequest) {
            setAlerts((prev) => [...prev, { type: "error", message: "Selected maintenance request not found" }]);
            setIsBottonActive(false);
            return;
        }

        const statusID = requestStatuses?.find((item) => item.Name === "Waiting For Review")?.ID || 0;
        handleSubmitWork(statusID, {
            selectedTask: maintenanceRequest.MaintenanceTask,
            setAlerts,
            setOpenPopupSubmit,
            files: submitfiles,
            setFiles: setSubmitFiles,
        });
        setIsBottonActive(false);
    };

    // Handle approval or rejection
    const handleClickApprove = (statusName: "Approved" | "Unsuccessful", actionType: "approve" | "reject", note?: string) => {
        const statusID = requestStatuses?.find((item) => item.Name === statusName)?.ID || 0;
        setIsBottonActive(true);
        handleActionApproval(statusID, {
            userID: Number(userID),
            selectedRequest: maintenanceRequest || {},
            selectedOperator,
            setSelectedOperator,
            setAlerts,
            setOpenPopupApproved,
            setOpenConfirmRejected,
            actionType,
            note,
        });
        setIsBottonActive(false);
    };

    const handleClickAcceptWork = (statusName: "In Progress" | "Unsuccessful", actionType: "accept" | "cancel", note?: string) => {
        const statusID = requestStatuses?.find((item) => item.Name === statusName)?.ID || 0;
        setIsBottonActive(true);
        handleActionAcception(statusID, {
            selectedTask: maintenanceTask,
            setAlerts,
            setOpenConfirmAccepted,
            setOpenConfirmCancelled: setOpenConfirmCancelledFromOperator,
            actionType,
            note,
        });
        setIsBottonActive(false);
    };

    const handleClickInspection = (statusName: "Completed" | "Rework Requested", actionType: "confirm" | "rework", note?: string) => {
        const statusID = requestStatuses?.find((item) => item.Name === statusName)?.ID || 0;
        setIsBottonActive(true);
        handleActionInspection(statusID, {
            userID,
            selectedRequest: maintenanceRequest,
            setAlerts,
            setOpenConfirmInspection,
            setOpenConfirmRework,
            actionType,
            note,
            files: requestfiles,
        });
        setIsBottonActive(false);
    };

    const handleClickCancel = async () => {
        try {
            setIsBottonActive(true);
            const statusID = requestStatuses?.find((item) => item.Name === "Unsuccessful")?.ID || 0;

            const request: MaintenanceRequestsInterface = {
                RequestStatusID: statusID,
            };

            const resRequest = await UpdateMaintenanceRequestByID(request, maintenanceRequest?.ID);
            if (!resRequest || resRequest.error) throw new Error(resRequest?.error || "Failed to update request status");

            setTimeout(() => {
                setAlerts((prev) => [...prev, { type: "success", message: "Request cancelled successfully" }]);

                setOpenConfirmCancelledFromOwnRequest(false);
                setIsBottonActive(false);
            }, 500);
        } catch (error) {
            console.error("API Error:", error);
            const errMessage = (error as Error).message || "Unknown error!";
            setAlerts((prev) => [...prev, { type: "error", message: errMessage }]);
            setIsBottonActive(false);
        }
    };

    // Handle back navigation
    const handleBack = () => {
        localStorage.removeItem("requestID");
        navigate(-1);
    };

    const convertPathsToFiles = async (images: MaintenaceImagesInterface[]): Promise<File[]> => {
        return await Promise.all(
            images.map(async (img, index) => {
                const url = apiUrl + "/" + img.FilePath;
                const response = await fetch(url);
                const blob = await response.blob();
                const fileType = blob.type || "image/jpeg";
                const fileName = img.FilePath?.split("/").pop() || `image${index + 1}.jpg`;
                return new File([blob], fileName, { type: fileType });
            })
        );
    };

    // Load all necessary data on mount
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                await Promise.all([getMaintenanceRequest(), getRequestStatuses(), getOperators()]);
                setIsLoadingData(false);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        const fetchFiles = async () => {
            const fileList = await convertPathsToFiles(maintenanceImages || []);
            if (fileList) {
                setRequestFiles(fileList);
            }
        };

        fetchFiles();
    }, [maintenanceImages]);

    useEffect(() => {
        const socket = io(socketUrl);

        socket.on("maintenance_updated", (data) => {
            console.log("🔄 Maintenance request updated:", data);
            getMaintenanceRequest();
        });

        return () => {
            socket.off("maintenance_updated");
        };
    }, []);

    console.log(maintenanceRequest)

    return (
        <Box className="check-requests-page">
            {/* Alert messages */}
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            {/* Popup for submiting work */}
            <SubmitPopup open={openPopupSubmit} onClose={() => setOpenPopupSubmit(false)} onConfirm={onClickSubmit} setAlerts={setAlerts} files={submitfiles} onChange={setSubmitFiles} />

            {/* Cancellation From OwnRequest Confirm */}
            <ConfirmDialog
                open={openConfirmCancelledFromOwnRequest}
                setOpenConfirm={setOpenConfirmCancelledFromOwnRequest}
                handleFunction={() => handleClickCancel()}
                title="Confirm Cancel Request"
                message="Are you sure you want to cancel this request? This action cannot be undone."
                buttonActive={isBottonActive}
            />

            {/* Approve Popup */}
            <ApprovePopup
                open={openPopupApproved}
                onClose={() => setOpenPopupApproved(false)}
                onConfirm={() => handleClickApprove("Approved", "approve")}
                requestSelected={maintenanceRequest || {}}
                selectedOperator={selectedOperator}
                setSelectedOperator={setSelectedOperator}
                operators={operators}
                maintenanceTypeConfig={maintenanceTypeConfig}
                buttonActive={isBottonActive}
            />

            {/* Rejected Confirm */}
            <ConfirmDialog
                open={openConfirmRejected}
                setOpenConfirm={setOpenConfirmRejected}
                handleFunction={(note) => handleClickApprove("Unsuccessful", "reject", note)}
                title="Confirm Maintenance Request Rejection"
                message="Are you sure you want to reject this maintenance request? This action cannot be undone."
                showNoteField
                buttonActive={isBottonActive}
            />

            {/* Accepted Confirm */}
            <ConfirmDialog
                open={openConfirmAccepted}
                setOpenConfirm={setOpenConfirmAccepted}
                handleFunction={() => handleClickAcceptWork("In Progress", "accept")}
                title="Confirm Maintenance Request Processing"
                message="Are you sure you want to start this maintenance request? This action cannot be undone."
                buttonActive={isBottonActive}
            />

            {/* Cancellation From Operator Confirm */}
            <ConfirmDialog
                open={openConfirmCancelledFromOperator}
                setOpenConfirm={setOpenConfirmCancelledFromOperator}
                handleFunction={(note) => handleClickAcceptWork("Unsuccessful", "cancel", note)}
                title="Confirm Maintenance Cancellation"
                message="Are you sure you want to cancel this maintenance request? This action cannot be undone."
                showNoteField
                buttonActive={isBottonActive}
            />

            {/* Inspection Confirm */}
            <ConfirmDialog
                open={openConfirmInspection}
                setOpenConfirm={setOpenConfirmInspection}
                handleFunction={() => handleClickInspection("Completed", "confirm")}
                title="Confirm Maintenance Inspection"
                message="Are you sure you want to confirm the inspection of this maintenance request? This action cannot be undone."
                buttonActive={isBottonActive}
            />

            {/* Rework Confirm */}
            <ReworkPopup
                open={openConfirmRework}
                setOpenConfirm={setOpenConfirmRework}
                handleFunction={(note) => handleClickInspection("Rework Requested", "rework", note)}
                setAlerts={setAlerts}
                title="Confirm Rework Request"
                message="Are you sure you want to request a rework for this maintenance job? This action cannot be undone."
                showNoteField
                files={requestfiles}
                onChangeFiles={setRequestFiles}
            />

            {/* Header section with title and back button */}
            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3}>
                    <Grid container className="title-box" direction={"row"} size={{ xs: 5 }} sx={{ gap: 1 }}>
                        <NotebookText size={26} />
                        <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                            Maintenance Request Review
                        </Typography>
                    </Grid>
                    <Grid container size={{ xs: 7, md: 7 }} sx={{ justifyContent: "flex-end" }}>
                        <Box>
                            <Button variant="outlined" onClick={handleBack}>
                                <ChevronLeft size={20} style={{ minWidth: "20px", minHeight: "20px" }}/>
                                <Typography variant="textButtonClassic">Back</Typography>
                            </Button>
                        </Box>
                    </Grid>

                    {isLoadingData ? (
                        <Skeleton variant="rectangular" width="100%" height={140} sx={{ borderRadius: 2 }} />
                    ) : (
                        <>
                            {/* Stepper showing request progress */}
                            <Grid size={{ xs: 12, lg: isUnsuccessful ? 10 : 8 }}>
                                <RequestStepper requestStatuses={requestStatuses} requestStatusID={requestStatusID} />
                            </Grid>

                            {/* Info cards for approval and assignment */}
                            {maintenanceRequest && !isUnsuccessful ? (
                                <>
                                    <InfoCard type="approved" title="Approved By" name={managerName} date={approvalDate} />

                                    <InfoCard type="assigned" title="Assigned To" name={operatorName} date={assignDate} />
                                </>
                            ) : (
                                <InfoCard type="unsuccessful" title="Cancelled By" name={cancellerName} date={cancelDate} />
                            )}
                        </>
                    )}

                    {/* Main data section */}
                    {isLoadingData ? (
                        <Skeleton variant="rectangular" width="100%" height={250} sx={{ borderRadius: 2 }} />
                    ) : (
                        <Card className="data-card" sx={{ width: "100%", borderRadius: 2 }}>
                            <CardContent>
                                <Grid
                                    container
                                    spacing={{
                                        xs: 3,
                                    }}
                                    sx={{
                                        px: {
                                            xs: 2,
                                            md: 6,
                                        },
                                        py: {
                                            xs: 1,
                                            md: 4,
                                        },
                                    }}
                                >
                                    <Grid size={{ xs: 12, md: 12 }}>
                                        <Typography variant="body1" sx={{ fontSize: 18, fontWeight: 600 }}>
                                            Information
                                        </Typography>
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 12, lg: 6 }}>
                                        <RequestInfoTable data={maintenanceRequest} />
                                    </Grid>

                                    <Grid container size={{ xs: 12, md: 12, lg: 6 }} direction="column">
                                        {!isNotApproved && maintenanceRequest ? (
                                            <Grid size={{ xs: 12, md: 12 }} sx={{ pt: 2 }}>
                                                <Typography className="title-list" variant="body1" sx={{ pb: 1 }}>
                                                    Task Operation
                                                </Typography>
                                                <Box sx={{ border: "1px solid #08aff1", borderRadius: 2, px: 2 }}>
                                                    <TaskInfoTable data={maintenanceRequest} />
                                                </Box>
                                            </Grid>
                                        ) : (
                                            <></>
                                        )}

                                        <Grid container size={{ xs: 12, md: 12 }} spacing={1} sx={{ pt: isNotApproved ? 1.2 : 0 }}>
                                            {taskImages && taskImages.length !== 0 && !isRework ? (
                                                <Box>
                                                    <Typography className="title-list" variant="body1" sx={{ width: "100%", mb: 1 }}>
                                                        Handover Images
                                                    </Typography>
                                                    <RequestImages images={maintenanceTask?.HandoverImages ?? []} apiUrl={apiUrl} />
                                                </Box>
                                            ) : maintenanceImages && maintenanceImages?.length !== 0 ? (
                                                <Box>
                                                    <Typography className="title-list" variant="body1" sx={{ width: "100%", mb: 1 }}>
                                                        Request Images
                                                    </Typography>
                                                    <RequestImages images={maintenanceImages ?? []} apiUrl={apiUrl} />
                                                </Box>
                                            ) : (
                                                <></>
                                            )}
                                        </Grid>
                                    </Grid>

                                    <Grid container size={{ xs: 12, md: 12 }} spacing={2} sx={{ justifyContent: "flex-end", mt: 1 }}>
                                        {isPending && (isAdmin || isManager) ? (
                                            <Box sx={{ gap: 1, display: "flex" }}>
                                                {/* Reject button */}
                                                <Button
                                                    variant="containedCancel"
                                                    onClick={() => setOpenConfirmRejected(true)}
                                                    sx={{
                                                        minWidth: "0px",
                                                        px: 2,
                                                        py: 1,
                                                    }}
                                                >
                                                    <X size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
                                                    <Typography variant="textButtonClassic">Reject</Typography>
                                                </Button>

                                                {/* Approve button */}
                                                <Button variant="containedBlue" onClick={() => setOpenPopupApproved(true)} sx={{ px: 4, py: 1 }}>
                                                    <Check size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
                                                    <Typography variant="textButtonClassic">Approve</Typography>
                                                </Button>
                                            </Box>
                                        ) : (
                                            <></>
                                        )}

                                        {(isOwnRequest || isAdmin || isManager) && (
                                            <Grid
                                                container
                                                size={{ xs: 12, md: 12 }}
                                                sx={{
                                                    justifyContent: "flex-end",
                                                }}
                                            >
                                                {isOwnRequest && isPending ? (
                                                    <Button
                                                        variant="containedCancel"
                                                        onClick={() => {
                                                            setOpenConfirmCancelledFromOwnRequest(true);
                                                        }}
                                                        sx={{
                                                            minWidth: "0px",
                                                            px: 4,
                                                            py: 1,
                                                        }}
                                                    >
                                                        <X size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
                                                        <Typography variant="textButtonClassic">Cancel</Typography>
                                                    </Button>
                                                ) : isWaitingForReview ? (
                                                    <Box sx={{ gap: 1, display: "flex" }}>
                                                        <Button
                                                            variant="outlined"
                                                            onClick={() => {
                                                                setOpenConfirmRework(true);
                                                            }}
                                                        >
                                                            <Repeat size={16} style={{ minWidth: "16px", minHeight: "16px" }}/>
                                                            <Typography variant="textButtonClassic">Rework</Typography>
                                                        </Button>

                                                        <Button
                                                            variant="contained"
                                                            onClick={() => {
                                                                setOpenConfirmInspection(true);
                                                            }}
                                                            sx={{ px: 4, py: 1 }}
                                                        >
                                                            <Check size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
                                                            <Typography variant="textButtonClassic">Confirm</Typography>
                                                        </Button>
                                                    </Box>
                                                ) : (
                                                    <></>
                                                )}
                                            </Grid>
                                        )}

                                        {(isApproved || isInProgress || isRework) && isOperator && isOwnTask && (
                                            <Box sx={{ gap: 1, display: "flex" }}>
                                                <Button
                                                    variant="containedCancel"
                                                    onClick={() => {
                                                        setOpenConfirmCancelledFromOperator(true);
                                                    }}
                                                    sx={{
                                                        minWidth: "0px",
                                                        px: 2,
                                                        py: 1,
                                                    }}
                                                >
                                                    <X size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
                                                    <Typography variant="textButtonClassic">Cancel</Typography>
                                                </Button>

                                                {isApproved || isRework ? (
                                                    <Button
                                                        variant="containedBlue"
                                                        onClick={() => {
                                                            setOpenConfirmAccepted(true);
                                                        }}
                                                        sx={{ px: 4, py: 1 }}
                                                    >
                                                        <Check size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
                                                        <Typography variant="textButtonClassic">Start</Typography>
                                                    </Button>
                                                ) : isInProgress || isWaitingForReview ? (
                                                    <Button
                                                        variant="containedBlue"
                                                        onClick={() => {
                                                            setOpenPopupSubmit(true);
                                                        }}
                                                    >
                                                        <Send size={16} style={{ minWidth: "16px", minHeight: "16px" }}/>
                                                        <Typography variant="textButtonClassic">Submit</Typography>
                                                    </Button>
                                                ) : (
                                                    <></>
                                                )}
                                            </Box>
                                        )}
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Container>
        </Box>
    );
}

export default CheckRequest;
