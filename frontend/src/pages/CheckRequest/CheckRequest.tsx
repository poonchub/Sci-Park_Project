import { useEffect, useState } from "react";
import { Box, Button, Card, CardContent, Grid2, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faPaperPlane, faTools, faXmark } from "@fortawesome/free-solid-svg-icons";

import './CheckRequest.css';

import { apiUrl, GetMaintenanceRequestByID, GetOperators, GetRequestStatuses } from "../../services/http";
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses";
import { UserInterface } from "../../interfaces/IUser";

import AlertGroup from "../../components/AlertGroup/AlertGroup";
import RequestInfoTable from "../../components/RequestInfoTable/RequestInfoTable";
import AssignPopup from "../../components/AssignPopup/AssignPopup";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import InfoCard from "../../components/InfoCard/InfoCard";
import RequestStepper from "../../components/RequestStepper/RequestStepper";
import RequestImages from "../../components/RequestImages/RequestImages";

import dateFormat from "../../utils/dateFormat";
import handleAssignWork from "../../utils/handleAssignWork";
import handleAction from "../../utils/handleActionApproval";

import { maintenanceTypeConfig } from "../../constants/maintenanceTypeConfig";
import SubmitPopup from "../../components/SubmitPopup/SubmitPopup";
import handleSubmitWork from "../../utils/handleSubmitWork";
import TaskInfoTable from "../../components/TaskInfoTable/TaskInfoTable";
import { isOperator } from "../../routes";

function CheckRequest() {
	// Request data
	const [maintenanceRequest, setMaintenanceRequest] = useState<MaintenanceRequestsInterface>();
	const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([]);
	const [requestStatusID, setRequestStatusID] = useState(0);

	// Users eligible for assignment
	const [operators, setOperators] = useState<UserInterface[]>([]);

	// UI state
	const [openPopupAssign, setOpenPopupAssign] = useState(false);
	const [selectedOperator, setSelectedOperator] = useState(0);
	const [openConfirmApproved, setOpenConfirmApproved] = useState(false);
	const [openConfirmRejected, setOpenConfirmRejected] = useState(false);
	const [openConfirmAccepted, setOpenConfirmAccepted] = useState<boolean>(false);
	const [openConfirmCancelled, setOpenConfirmCancelled] = useState<boolean>(false);
	const [openPopupSubmit, setOpenPopupSubmit] = useState(false)
	const [files, setFiles] = useState<File[]>([]);
	const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);

	const navigate = useNavigate();

	const isAssigned = maintenanceRequest?.RequestStatus?.Name === 'Assigned'
	const isInProgress = maintenanceRequest?.RequestStatus?.Name === 'In Progress'
	const isCompleted = maintenanceRequest?.RequestStatus?.Name === 'Completed'

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

	// Handle assigning task to an operator
	const onClickAssign = () => {
		handleAssignWork({
			selectedOperator,
			requestSelected: maintenanceRequest || {},
			setAlerts,
			refreshRequestData: getMaintenanceRequest,
			setOpenPopupAssign,
		});
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

		handleSubmitWork({
			selectedTask: maintenanceRequest.MaintenanceTask,
			setAlerts,
			refreshTaskData: getMaintenanceRequest,
			setOpenPopupSubmit,
			files
		});
	};

	// Handle approval or rejection
	const handleClick = (statusID: number, message: string) => {
		handleAction(statusID, message, {
			userID: maintenanceRequest?.UserID,
			selectedRequest: maintenanceRequest?.ID,
			setAlerts,
			refreshRequestData: getMaintenanceRequest,
			setOpenConfirmApproved,
			setOpenConfirmRejected,
		});
	};

	// Handle back navigation
	const handleBack = () => {
		localStorage.removeItem('requestID');
		navigate(-1);
	};

	// Extract info for cards
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

			{/* Popup for assigning work */}
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

			{/* Popup for submiting work */}
			<SubmitPopup
				open={openPopupSubmit}
				onClose={() => setOpenPopupSubmit(false)}
				onConfirm={onClickSubmit}
				setAlerts={setAlerts}
				files={files}
				onChange={setFiles}
			/>

			{/* Confirmation dialog for approval */}
			<ConfirmDialog
				open={openConfirmApproved}
				setOpenConfirm={setOpenConfirmApproved}
				handleFunction={() => handleClick(2, "Approval successful")}
				title="ยืนยันการอนุมัติงานแจ้งซ่อม"
				message="คุณแน่ใจหรือไม่ว่าต้องการอนุมัติงานแจ้งซ่อมนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
			/>

			{/* Confirmation dialog for rejection */}
			<ConfirmDialog
				open={openConfirmRejected}
				setOpenConfirm={setOpenConfirmRejected}
				handleFunction={() => handleClick(3, "Rejection successful")}
				title="ยืนยันการปฏิเสธงานแจ้งซ่อม"
				message="คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธงานแจ้งซ่อมนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
			/>

			{/* Confirmation dialog for acception */}
			<ConfirmDialog
				open={openConfirmAccepted}
				setOpenConfirm={setOpenConfirmAccepted}
				handleFunction={() => handleClick(5, "Acception successful")}
				title="ยืนยันการดำเนินการงานแจ้งซ่อม"
				message="คุณแน่ใจหรือไม่ว่าต้องการดำเนินการงานแจ้งซ่อมนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
			/>

			{/* Confirmation dialog for cancellation */}
			<ConfirmDialog
				open={openConfirmCancelled}
				setOpenConfirm={setOpenConfirmCancelled}
				handleFunction={() => handleClick(8, "Cancellation successful")}
				title="ยืนยันการยกเลิกงานแจ้งซ่อม"
				message="คุณแน่ใจหรือไม่ว่าต้องการยกเลิกงานแจ้งซ่อมนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
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
							onApprove={() => setOpenConfirmApproved(true)}
							onReject={() => setOpenConfirmRejected(true)}
							status={maintenanceRequest.RequestStatus?.Name}
						/>

						<InfoCard
							type="assigned"
							title="ผู้รับผิดชอบ"
							name={operatorName}
							time={assignTime}
							onAssign={() => setOpenPopupAssign(true)}
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
									maintenanceRequest?.RequestStatus?.Name === 'Assigned' && <Grid2 size={{ xs: 12, md: 12 }} sx={{ pt: 2 }}>
										<Typography className="title-list" variant="body1" sx={{ pb: 1 }}>
											การดำเนินงาน
										</Typography>
										<Box sx={{ border: '1px solid #08aff1', borderRadius: 2, px: 2 }}>
											<TaskInfoTable data={maintenanceRequest?.MaintenanceTask} />
										</Box>
									</Grid2>
								}

								<Grid2 container size={{ xs: 12, md: 12 }} spacing={1} sx={{ pt: maintenanceRequest?.RequestStatus?.Name === 'Assigned' ? 0 : 1.2 }}>
									<Typography className="title-list" variant="body1" sx={{ width: '100%' }}>
										ภาพประกอบ
									</Typography>
									{
										maintenanceRequest?.MaintenanceImages && isCompleted ? (
											<RequestImages
												images={maintenanceRequest?.MaintenanceTask?.HandoverImages || []}
												apiUrl={apiUrl}
											/>
										) : maintenanceRequest?.MaintenanceImages && (
											<RequestImages
												images={maintenanceRequest?.MaintenanceImages}
												apiUrl={apiUrl}
											/>
										)

									}
								</Grid2>
								<Grid2 container size={{ xs: 12, md: 12 }}
									sx={{
										justifyContent: "flex-end",
									}}
								>
									{
										isOperator && !isCompleted && <Box>
											<Button
												variant="outlinedCancel"
												onClick={() => {
													setOpenConfirmCancelled(true)
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
												isAssigned ? (
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