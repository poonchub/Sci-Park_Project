import { useEffect, useState } from "react";
import { Box, Button, Card, CardContent, Grid2, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faPaperPlane, faTools, faXmark } from "@fortawesome/free-solid-svg-icons";

import './CheckRequest.css';

import { apiUrl, GetMaintenanceRequestByID, GetOperators, GetRequestStatuses, UpdateMaintenanceRequestByID } from "../../services/http";
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

	const [files, setFiles] = useState<File[]>([]);
	const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);

	const navigate = useNavigate();

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

	const approvalTime = managerApproval?.CreatedAt
		? dateFormat(managerApproval.CreatedAt)
		: null;

	const assignTime = maintenanceTask?.CreatedAt
		? dateFormat(maintenanceTask.CreatedAt)
		: null;

	const userID = Number(localStorage.getItem("userId"))
	const isOwnRequest = maintenanceRequest?.UserID === userID
	const isOwnTask = maintenanceTask?.UserID === userID

	const RequestStatus = maintenanceRequest?.RequestStatus?.Name
	const isPending = RequestStatus === 'Pending'
	const isApproved = RequestStatus === 'Approved'
	const isInProgress = RequestStatus === 'In Progress'
	const isWaitingForReview = RequestStatus === 'Waiting For Review'

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
			refreshTaskData: getMaintenanceRequest,
			setOpenPopupSubmit,
			files
		});
	};

	// Handle approval or rejection
	const handleClickApprove = (
		statusName: "Approved" | "Unsuccessful",
		actionType: "approve" | "reject",
		note?: string
	) => {

		const userID = localStorage.getItem('userId')
		const statusID = requestStatuses?.find(item => item.Name === statusName)?.ID || 0;

		handleActionApproval(statusID, {
			userID: Number(userID),
			selectedRequest: maintenanceRequest || {},
			selectedOperator,
			setAlerts,
			refreshRequestData: getMaintenanceRequest,
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
			refreshMaintenanceData: getMaintenanceRequest,
			setOpenConfirmAccepted,
			setOpenConfirmCancelled: setOpenConfirmCancelledFromManager,
			actionType,
			note
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

	// Load all necessary data on mount
	useEffect(() => {
		getMaintenanceRequest();
		getRequestStatuses();
		getOperators();
	}, []);

	return (
		<div className="check-requests-page">
			{/* Alert messages */}
			<AlertGroup alerts={alerts} setAlerts={setAlerts} />


			{/* Popup for submiting work */}
			<SubmitPopup
				open={openPopupSubmit}
				onClose={() => setOpenPopupSubmit(false)}
				onConfirm={onClickSubmit}
				setAlerts={setAlerts}
				files={files}
				onChange={setFiles}
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
				handleFunction={() => handleClickCancel()}
				title="ยืนยันการยกเลิกงานแจ้งซ่อม"
				message="คุณแน่ใจหรือไม่ว่าต้องการยกเลิกงานแจ้งซ่อมนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
				showNoteField
			/>

			{/* Header section with title and back button */}
			<Grid2 container spacing={2}>
				<Grid2 className="title-box" size={{ xs: 12, md: 10 }}>
					<Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
						ตรวจสอบคำร้องแจ้งซ่อม
					</Typography>
				</Grid2>
				<Grid2 container size={{ xs: 12, md: 2 }} sx={{ justifyContent: "flex-end" }}>
					<Button variant="outlined" onClick={handleBack}>
						<FontAwesomeIcon icon={faAngleLeft} size="lg" />
						<Typography variant="textButtonClassic">ย้อนกลับ</Typography>
					</Button>
				</Grid2>

				{/* Stepper showing request progress */}
				<Grid2 size={{ xs: 12, md: 8 }}>
					<RequestStepper
						requestStatuses={requestStatuses}
						requestStatusID={requestStatusID}
					/>
				</Grid2>

				{/* Info cards for approval and assignment */}
				{maintenanceRequest && (
					<>
						<InfoCard
							type="approved"
							title="ผู้อนุมัติ"
							name={managerName}
							time={approvalTime}
							status={maintenanceRequest.RequestStatus?.Name}
						/>

						<InfoCard
							type="assigned"
							title="ผู้รับผิดชอบ"
							name={operatorName}
							time={assignTime}
							status={maintenanceRequest.RequestStatus?.Name}
						/>
					</>
				)}

				{/* Main data section */}
				<Card className="data-card" sx={{ width: '100%', borderRadius: 2 }}>
					<CardContent>
						<Grid2 container spacing={3} sx={{ px: 6, py: 2 }}>
							<Grid2 size={{ xs: 12, md: 12 }}>
								<Typography variant="body1" sx={{ fontSize: 18, fontWeight: 600 }}>
									ข้อมูลการแจ้งซ่อม
								</Typography>

							</Grid2>

							<Grid2 size={{ xs: 12, md: 6 }}>
								<RequestInfoTable data={maintenanceRequest} />
							</Grid2>

							<Grid2 container size={{ xs: 12, md: 6 }} direction="column">
								{
									isNotApproved ? (
										<></>
									) : (
										<Grid2 size={{ xs: 12, md: 12 }} sx={{ pt: 2 }}>
											<Typography className="title-list" variant="body1" sx={{ pb: 1 }}>
												การดำเนินงาน
											</Typography>
											<Box sx={{ border: '1px solid #08aff1', borderRadius: 2, px: 2 }}>
												<TaskInfoTable data={maintenanceRequest?.MaintenanceTask} />
											</Box>
										</Grid2>
									)
								}

								<Grid2 container size={{ xs: 12, md: 12 }} spacing={1} sx={{ pt: isNotApproved ? 1.2 : 0 }}>
									{
										taskImages && taskImages.length !== 0 ? (
											<Box>
												<Typography className="title-list" variant="body1" sx={{ width: '100%', mb: 1 }}>
													ภาพประกอบการส่งมอบ
												</Typography>
												<RequestImages
													images={maintenanceTask?.HandoverImages ?? []}
													apiUrl={apiUrl}
												/>
											</Box>
										) : maintenanceImages && maintenanceImages?.length !== 0 ? (
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

								</Grid2>
								<Grid2 container size={{ xs: 12, md: 12 }}
									sx={{
										justifyContent: "flex-end",
									}}
								>
									{/* Handle actions (approve, reject, assign) based on the 'time' value */}
									{
										isPending && (isAdmin || isManager) ? (
											<Box>
												{/* Reject button */}
												<Button
													variant="outlinedCancel"
													onClick={() => setOpenConfirmRejected(true)}
													sx={{
														minWidth: '0px',
														px: '6px',
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
													sx={{ ml: 0.8 }}
												>
													<FontAwesomeIcon icon={faTools} />
													<Typography variant="textButtonClassic">อนุมัติคำร้อง</Typography>
												</Button>


											</Box>
										) : (
											<></>
										)
									}

									<Grid2 container size={{ xs: 12, md: 12 }}
										sx={{
											justifyContent: "flex-end",
										}}
									>
										{
											(isPending && isOwnRequest) ? (
												<Button
													variant="outlinedCancel"
													onClick={() => {
														setOpenConfirmCancelledFromOwnRequest(true)
													}}
													sx={{
														minWidth: '0px',
														px: '6px',
														'&:hover': {
															borderColor: '#FF3B30',
														}
													}}
												>
													<FontAwesomeIcon icon={faXmark} size="lg" />
													<Typography variant="textButtonClassic" >ยกเลิกคำร้อง</Typography>
												</Button>
											) : (
												<></>
											)
										}
									</Grid2>

									{
										(isApproved || isInProgress) && isOperator && isOwnTask && <Box>
											<Button
												variant="outlinedCancel"
												onClick={() => {
													setOpenConfirmCancelledFromManager(true)
												}}
												sx={{
													minWidth: '0px',
													px: '6px',
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
												isApproved ? (
													<Button
														variant="containedBlue"
														onClick={() => {
															setOpenConfirmAccepted(true)
														}}
														sx={{ ml: 0.8 }}
													>
														<FontAwesomeIcon icon={faTools} />
														<Typography variant="textButtonClassic">เริ่มงาน</Typography>
													</Button>
												) : isInProgress ? (
													<Button
														variant="containedBlue"
														onClick={() => {
															setOpenPopupSubmit(true)
														}}
														sx={{ ml: 0.8 }}
													>
														<FontAwesomeIcon icon={faPaperPlane} />
														<Typography variant="textButtonClassic">ส่งงาน</Typography>
													</Button>
												) : isWaitingForReview ? (
													<Button
														variant="containedBlue"
														onClick={() => {
															setOpenPopupSubmit(true)
														}}
													>
														<FontAwesomeIcon icon={faPaperPlane} />
														<Typography variant="textButtonClassic" >ส่งงาน</Typography>
													</Button>
												) : (
													<></>
												)
											}
										</Box>
									}
								</Grid2>
							</Grid2>
						</Grid2>
					</CardContent>
				</Card>
			</Grid2>
		</div>
	);
}

export default CheckRequest;