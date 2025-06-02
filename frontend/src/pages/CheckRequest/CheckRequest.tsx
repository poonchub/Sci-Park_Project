import { useEffect, useState } from "react";
import { Box, Button, Card, CardContent, Grid, Skeleton, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faPaperPlane, faRepeat, faTools, faXmark } from "@fortawesome/free-solid-svg-icons";

import './CheckRequest.css';

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

import { io } from 'socket.io-client';

function CheckRequest() {
	// Request data
	const [maintenanceRequest, setMaintenanceRequest] = useState<MaintenanceRequestsInterface>();
	const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([]);
	const [requestStatusID, setRequestStatusID] = useState(0);

	// Users eligible for assignment
	const [operators, setOperators] = useState<UserInterface[]>([]);

	// UI state
	const [selectedOperator, setSelectedOperator] = useState(0);
	const [openPopupApproved, setOpenPopupApproved] = useState(false)
	const [openConfirmRejected, setOpenConfirmRejected] = useState<boolean>(false);
	const [openPopupSubmit, setOpenPopupSubmit] = useState(false)
	const [openConfirmAccepted, setOpenConfirmAccepted] = useState<boolean>(false);
	const [openConfirmCancelledFromOwnRequest, setOpenConfirmCancelledFromOwnRequest] = useState<boolean>(false);
	const [openConfirmCancelledFromManager, setOpenConfirmCancelledFromManager] = useState<boolean>(false);
	const [openConfirmInspection, setOpenConfirmInspection] = useState<boolean>(false);
	const [openConfirmRework, setOpenConfirmRework] = useState<boolean>(false);

	const [requestfiles, setRequestFiles] = useState<File[]>([]);
	const [submitfiles, setSubmitFiles] = useState<File[]>([]);
	const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);

	const navigate = useNavigate();

	const [isLoadingData, setIsLoadingData] = useState(true)

	// Extract info for cards
	const managerApproval = maintenanceRequest?.ManagerApproval;
	const maintenanceTask = maintenanceRequest?.MaintenanceTask;
	const maintenanceImages = maintenanceRequest?.MaintenanceImages;
	const taskImages = maintenanceTask?.HandoverImages;

	const managerName = managerApproval
		? `${managerApproval.User?.FirstName} ${managerApproval.User?.LastName}`
		: null;

	const operatorName = maintenanceTask
		? `${maintenanceTask.User?.FirstName} ${maintenanceTask.User?.LastName}`
		: null;

	const approvalDate = managerApproval?.CreatedAt
		? dateFormat(managerApproval.CreatedAt)
		: null;

	const assignDate = maintenanceTask?.CreatedAt
		? dateFormat(maintenanceTask.CreatedAt)
		: null;

	const cancellerName = maintenanceRequest?.RequestStatus?.Name === 'Unsuccessful' ?
		(
			maintenanceTask?.Description ? `${maintenanceTask?.User?.FirstName} ${maintenanceTask.User?.LastName}` :
				managerApproval?.Description ? `${managerApproval.User?.FirstName} ${managerApproval.User?.LastName}` :
					`${maintenanceRequest.User?.FirstName} ${maintenanceRequest.User?.LastName}`
		) : ""

	const cancelDate = maintenanceRequest?.RequestStatus?.Name === 'Unsuccessful' ?
		(
			maintenanceTask?.Description ? dateFormat(maintenanceTask?.UpdatedAt || '') :
				managerApproval?.Description ? dateFormat(managerApproval?.UpdatedAt || '') : dateFormat(maintenanceRequest?.UpdatedAt || '')
		) : ""

	const userID = Number(localStorage.getItem("userId"))
	const isOwnRequest = maintenanceRequest?.UserID === userID
	const isOwnTask = maintenanceTask?.UserID === userID

	const RequestStatus = maintenanceRequest?.RequestStatus?.Name
	const isPending = RequestStatus === 'Pending'
	const isApproved = RequestStatus === 'Approved'
	const isInProgress = RequestStatus === 'In Progress'
	const isWaitingForReview = RequestStatus === 'Waiting For Review'
	const isRework = RequestStatus === 'Rework Requested'
	const isUnsuccessful = RequestStatus === 'Unsuccessful'

	const isNotApproved = maintenanceRequest?.ManagerApproval === null

	// Fetch request by ID
	const getMaintenanceRequest = async () => {
		try {
			const requestID = localStorage.getItem('requestID');
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
		if (!maintenanceRequest) {
			setAlerts((prev) => [
				...prev,
				{ type: "error", message: "ไม่พบข้อมูลงานซ่อมที่เลือก" }
			]);
			return;
		}

		const statusID = requestStatuses?.find(item => item.Name === "Waiting For Review")?.ID || 0;
		handleSubmitWork(
			statusID, {
			selectedTask: maintenanceRequest.MaintenanceTask,
			setAlerts,
			setOpenPopupSubmit,
			files: submitfiles,
			setFiles: setSubmitFiles
		});
	};

	// Handle approval or rejection
	const handleClickApprove = (
		statusName: "Approved" | "Unsuccessful",
		actionType: "approve" | "reject",
		note?: string
	) => {

		const statusID = requestStatuses?.find(item => item.Name === statusName)?.ID || 0;

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
	};

	const handleClickAcceptWork = (
		statusName: "In Progress" | "Unsuccessful",
		actionType: "accept" | "cancel",
		note?: string
	) => {
		const statusID = requestStatuses?.find(item => item.Name === statusName)?.ID || 0;

		handleActionAcception(statusID, {
			selectedTask: maintenanceTask,
			setAlerts,
			setOpenConfirmAccepted,
			setOpenConfirmCancelled: setOpenConfirmCancelledFromManager,
			actionType,
			note
		});
	};

	const handleClickInspection = (
		statusName: "Completed" | "Rework Requested",
		actionType: "confirm" | "rework",
		note?: string
	) => {
		const statusID = requestStatuses?.find(item => item.Name === statusName)?.ID || 0;

		handleActionInspection(statusID, {
			userID,
			selectedRequest: maintenanceRequest,
			setAlerts,
			setOpenConfirmInspection,
			setOpenConfirmRework,
			actionType,
			note,
			files: requestfiles
		});
	};

	const handleClickCancel = async () => {
		try {
			const statusID = requestStatuses?.find(item => item.Name === "Unsuccessful")?.ID || 0;

			const request: MaintenanceRequestsInterface = {
				RequestStatusID: statusID,
			};

			const resRequest = await UpdateMaintenanceRequestByID(request, maintenanceRequest?.ID);
			if (!resRequest || resRequest.error)
				throw new Error(resRequest?.error || "Failed to update request status");

			setTimeout(() => {
				setAlerts((prev) => [
					...prev,
					{ type: "success", message: "Cancellation successful" }
				]);

				getMaintenanceRequest();
				setOpenConfirmCancelledFromOwnRequest(false);
			}, 500);
		} catch (error) {
			console.error("API Error:", error);
			const errMessage = (error as Error).message || "Unknown error!";
			setAlerts((prev) => [...prev, { type: "error", message: errMessage }]);
		}
	}

	// Handle back navigation
	const handleBack = () => {
		localStorage.removeItem('requestID');
		navigate(-1);
	};

	const convertPathsToFiles = async (images: MaintenaceImagesInterface[]): Promise<File[]> => {
		return await Promise.all(
			images.map(async (img, index) => {
				const url = apiUrl + '/' + img.FilePath;
				const response = await fetch(url);
				const blob = await response.blob();
				const fileType = blob.type || "image/jpeg";
				const fileName = img.FilePath?.split("/").pop() || `image${index + 1}.jpg`;
				return new File([blob], fileName, { type: fileType });
			})
		);
	}

	// Load all necessary data on mount
	useEffect(() => {
		getMaintenanceRequest();
		getRequestStatuses();
		getOperators();
	}, []);

	useEffect(() => {
		const fetchFiles = async () => {
			const fileList = await convertPathsToFiles(maintenanceImages || []);
			if (fileList) {
				setRequestFiles(fileList);
				setIsLoadingData(false)
			}
		};

		fetchFiles();
	}, [maintenanceImages]);

	useEffect(() => {
        const socket = io(socketUrl);

        socket.on("maintenance_updated", (data) => {
            console.log("🔄 Maintenance request updated:", data);
            getMaintenanceRequest()
        });

        return () => {
            socket.off("maintenance_updated");
        };
    }, []);

	return (
		<Box className="check-requests-page">
			{/* Alert messages */}
			<AlertGroup alerts={alerts} setAlerts={setAlerts} />

			{/* Popup for submiting work */}
			<SubmitPopup
				open={openPopupSubmit}
				onClose={() => setOpenPopupSubmit(false)}
				onConfirm={onClickSubmit}
				setAlerts={setAlerts}
				files={submitfiles}
				onChange={setSubmitFiles}
			/>

			{/* Cancellation From OwnRequest Confirm */}
			<ConfirmDialog
				open={openConfirmCancelledFromOwnRequest}
				setOpenConfirm={setOpenConfirmCancelledFromOwnRequest}
				handleFunction={() => handleClickCancel()}
				title="ยืนยันการยกเลิกคำร้อง"
				message="คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำร้องนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
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
			/>

			{/* Rejected Confirm */}
			<ConfirmDialog
				open={openConfirmRejected}
				setOpenConfirm={setOpenConfirmRejected}
				handleFunction={(note) => handleClickApprove("Unsuccessful", "reject", note)}
				title="ยืนยันการปฏิเสธงานแจ้งซ่อม"
				message="คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธงานแจ้งซ่อมนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
				showNoteField
			/>

			{/* Accepted Confirm */}
			<ConfirmDialog
				open={openConfirmAccepted}
				setOpenConfirm={setOpenConfirmAccepted}
				handleFunction={() => handleClickAcceptWork("In Progress", "accept")}
				title="ยืนยันการดำเนินการงานแจ้งซ่อม"
				message="คุณแน่ใจหรือไม่ว่าต้องการดำเนินการงานแจ้งซ่อมนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
			/>

			{/* Cancellation From Manager Confirm */}
			<ConfirmDialog
				open={openConfirmCancelledFromManager}
				setOpenConfirm={setOpenConfirmCancelledFromManager}
				handleFunction={(note) => handleClickAcceptWork("Unsuccessful", "cancel", note)}
				title="ยืนยันการยกเลิกงานแจ้งซ่อม"
				message="คุณแน่ใจหรือไม่ว่าต้องการยกเลิกงานแจ้งซ่อมนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
				showNoteField
			/>

			{/* Inspection Confirm */}
			<ConfirmDialog
				open={openConfirmInspection}
				setOpenConfirm={setOpenConfirmInspection}
				handleFunction={() => handleClickInspection("Completed", "confirm")}
				title="ยืนยันการตรวจรับงาน"
				message="คุณแน่ใจหรือไม่ว่าต้องการตรวจรับงานแจ้งซ่อมนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
			/>

			{/* Rework Confirm */}
			<ReworkPopup
				open={openConfirmRework}
				setOpenConfirm={setOpenConfirmRework}
				handleFunction={(note) => handleClickInspection("Rework Requested", "rework", note)}
				setAlerts={setAlerts}
				title="ยืนยันการขอซ่อมซ้ำ"
				message="คุณแน่ใจหรือไม่ว่าต้องการขอซ่อมซ้ำงานแจ้งซ่อมนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
				showNoteField
				files={requestfiles}
				onChangeFiles={setRequestFiles}
			/>

			{/* Header section with title and back button */}
			<Grid container spacing={2}>
				<Grid className="title-box" size={{ xs: 5, md: 5 }}>
					<Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
						ตรวจสอบคำร้องแจ้งซ่อม
					</Typography>
				</Grid>
				<Grid container size={{ xs: 7, md: 7 }} sx={{ justifyContent: "flex-end" }}>
					<Button variant="outlined" onClick={handleBack}>
						<FontAwesomeIcon icon={faAngleLeft} size="lg" />
						<Typography variant="textButtonClassic">ย้อนกลับ</Typography>
					</Button>
				</Grid>

				{/* Stepper showing request progress */}
				<Grid size={{ xs: 12, lg: isUnsuccessful ? 10 : 8 }}>
					<RequestStepper
						requestStatuses={requestStatuses}
						requestStatusID={requestStatusID}
					/>
				</Grid>

				{/* Info cards for approval and assignment */}
				{
					maintenanceRequest && !isUnsuccessful ? (
						<>
							<InfoCard
								type="approved"
								title="ผู้อนุมัติ"
								name={managerName}
								date={approvalDate}
							/>

							<InfoCard
								type="assigned"
								title="ผู้รับผิดชอบ"
								name={operatorName}
								date={assignDate}
							/>
						</>
					) : (
						<InfoCard
							type="unsuccessful"
							title="ผู้ยกเลิก"
							name={cancellerName}
							date={cancelDate}
						/>
					)
				}

				{/* Main data section */}
				{
					isLoadingData ? (
						<Skeleton variant="rectangular" width="100%" height={'70vh'} sx={{ borderRadius: 2 }} />
					) : (
						<Card className="data-card" sx={{ width: '100%', borderRadius: 2 }}>
							<CardContent>
								<Grid container
									spacing={{
										xs: 3
									}}
									sx={{
										px: {
											xs: 2,
											md: 6
										},
										py: {
											xs: 1,
											md: 4
										},
									}}>
									<Grid size={{ xs: 12, md: 12 }}>
										<Typography variant="body1" sx={{ fontSize: 18, fontWeight: 600 }}>
											ข้อมูลการแจ้งซ่อม
										</Typography>

									</Grid>

									<Grid size={{ xs: 12, md: 6 }}>
										<RequestInfoTable data={maintenanceRequest} />
									</Grid>

									<Grid container size={{ xs: 12, md: 6 }} direction="column">
										{
											isNotApproved ? (
												<></>
											) : (
												<Grid size={{ xs: 12, md: 12 }} sx={{ pt: 2 }}>
													<Typography className="title-list" variant="body1" sx={{ pb: 1 }}>
														การดำเนินงาน
													</Typography>
													<Box sx={{ border: '1px solid #08aff1', borderRadius: 2, px: 2 }}>
														<TaskInfoTable data={maintenanceRequest} />
													</Box>
												</Grid>
											)
										}

										<Grid container size={{ xs: 12, md: 12 }} spacing={1} sx={{ pt: isNotApproved ? 1.2 : 0 }}>
											{
												taskImages && taskImages.length !== 0 && !isRework ? (
													<Box>
														<Typography className="title-list" variant="body1" sx={{ width: '100%', mb: 1 }}>
															ภาพประกอบการส่งมอบ
														</Typography>
														<RequestImages
															images={maintenanceTask?.HandoverImages ?? []}
															apiUrl={apiUrl}
														/>
													</Box>
												) : (maintenanceImages && maintenanceImages?.length !== 0) ? (
													<Box>
														<Typography className="title-list" variant="body1" sx={{ width: '100%', mb: 1 }}>
															ภาพประกอบการแจ้งซ่อม
														</Typography>
														<RequestImages
															images={maintenanceImages ?? []}
															apiUrl={apiUrl}
														/>
													</Box>
												) : (
													<></>
												)
											}

										</Grid>
									</Grid>

									<Grid container size={{ xs: 12, md: 12 }} spacing={2} sx={{ justifyContent: "flex-end", mt: 1 }}>
										{
											isPending && (isAdmin || isManager) ? (
												<Box sx={{ gap: 1, display: 'flex' }}>
													{/* Reject button */}
													<Button
														variant="outlinedCancel"
														onClick={() => setOpenConfirmRejected(true)}
														sx={{
															minWidth: '0px',
															px: '8px',
															py: 1,
															color: 'gray',
															borderColor: 'gray',
															'&:hover': {
																borderColor: '#FF3B30',
															}
														}}
													>
														<FontAwesomeIcon icon={faXmark} size="lg" />
														<Typography variant="textButtonClassic" >ปฏิเสธคำร้อง</Typography>
													</Button>

													{/* Approve button */}
													<Button
														variant="containedBlue"
														onClick={() => setOpenPopupApproved(true)}
														sx={{ px: 4, py: 1 }}
													>
														<FontAwesomeIcon icon={faTools} />
														<Typography variant="textButtonClassic">อนุมัติคำร้อง</Typography>
													</Button>


												</Box>
											) : (
												<></>
											)
										}

										{
											(isOwnRequest || isAdmin || isManager) &&
											<Grid container size={{ xs: 12, md: 12 }}
												sx={{
													justifyContent: "flex-end",
												}}
											>
												{
													isOwnRequest && isPending ? (
														<Button
															variant="outlinedCancel"
															onClick={() => {
																setOpenConfirmCancelledFromOwnRequest(true)
															}}
															sx={{
																minWidth: '0px',
																px: 4,
																py: 1,
																'&:hover': {
																	borderColor: '#FF3B30',
																}
															}}
														>
															<FontAwesomeIcon icon={faXmark} size="lg" />
															<Typography variant="textButtonClassic" >ยกเลิกคำร้อง</Typography>
														</Button>
													) : isWaitingForReview ? (
														<Box sx={{ gap: 1, display: 'flex' }}>
															<Button
																variant="outlined"
																onClick={() => {
																	setOpenConfirmRework(true)
																}}
															>
																<FontAwesomeIcon icon={faRepeat} />
																<Typography variant="textButtonClassic" >ขอซ่อมซ้ำ</Typography>
															</Button>

															<Button
																variant="contained"
																onClick={() => {
																	setOpenConfirmInspection(true)
																}}
																sx={{ px: 4, py: 1 }}
															>
																<FontAwesomeIcon icon={faTools} />
																<Typography variant="textButtonClassic">ยืนยันการตรวจรับ</Typography>
															</Button>

														</Box>
													) : (
														<></>
													)
												}
											</Grid>
										}

										{
											(isApproved || isInProgress || isRework) && isOperator && isOwnTask && <Box sx={{ gap: 1, display: 'flex' }}>
												<Button
													variant="outlinedCancel"
													onClick={() => {
														setOpenConfirmCancelledFromManager(true)
													}}
													sx={{
														minWidth: '0px',
														px: '8px',
														py: 1,
														color: 'gray',
														borderColor: 'gray',
														'&:hover': {
															borderColor: '#FF3B30',
														}
													}}
												>
													<FontAwesomeIcon icon={faXmark} size="lg" />
													<Typography variant="textButtonClassic" >ยกเลิกงาน</Typography>
												</Button>

												{
													isApproved || isRework ? (
														<Button
															variant="containedBlue"
															onClick={() => {
																setOpenConfirmAccepted(true)
															}}
															sx={{ px: 4, py: 1 }}
														>
															<FontAwesomeIcon icon={faTools} />
															<Typography variant="textButtonClassic">เริ่มงาน</Typography>
														</Button>
													) : isInProgress || isWaitingForReview ? (
														<Button
															variant="containedBlue"
															onClick={() => {
																setOpenPopupSubmit(true)
															}}
														>
															<FontAwesomeIcon icon={faPaperPlane} />
															<Typography variant="textButtonClassic">ส่งงาน</Typography>
														</Button>
													) : (
														<></>
													)
												}
											</Box>
										}
									</Grid>
								</Grid>
							</CardContent>
						</Card>
					)
				}
			</Grid>
		</Box>
	);
}

export default CheckRequest;