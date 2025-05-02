import { Box, Button, FormControl, Grid2, InputAdornment, MenuItem, Typography } from "@mui/material";
import { TextField } from "../../components/TextField/TextField";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faMagnifyingGlass, faPaperPlane, faQuestionCircle, faRotateRight, faToolbox, faTools, faXmark, } from "@fortawesome/free-solid-svg-icons";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { GridColDef } from '@mui/x-data-grid';
import { GetMaintenanceTask, GetMaintenanceTypes, GetRequestStatuses } from "../../services/http";
import { DatePicker } from "../../components/DatePicker/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { Select } from "../../components/Select/Select";

import './AcceptWork.css';
import { MaintenanceTypesInteface } from "../../interfaces/IMaintenanceTypes";
import dateFormat from "../../utils/dateFormat";
import AlertGroup from "../../components/AlertGroup/AlertGroup";
import { maintenanceTypeConfig } from "../../constants/maintenanceTypeConfig";
import { Link } from "react-router-dom";
import { MaintenanceTasksInterface } from "../../interfaces/IMaintenanceTasks";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import handleActionAcception from "../../utils/handleActionAcception";
import timeFormat from "../../utils/timeFormat";
import MaintenanceTaskTable from "../../components/MaintenanceTaskTable/MaintenanceTaskTable";
import SubmitPopup from "../../components/SubmitPopup/SubmitPopup";
import handleSubmitWork from "../../utils/handleSubmitWork";
import { CalendarMonth } from "@mui/icons-material";
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses";

function AcceptWork() {

	const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceTypesInteface[]>([])
	const [pendingMaintenanceTasks, setPendingMaintenanceTasks] = useState<MaintenanceTasksInterface[]>([]);
	const [inProgressMaintenanceTasks, setInProgressMaintenanceTasks] = useState<MaintenanceTasksInterface[]>([]);
	const [selectedTask, setSelectedTask] = useState<MaintenanceTasksInterface>()
	const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([])

	const [searchText, setSearchText] = useState('')
	const [selectedType, setSelectedType] = useState(0)
	const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null)

	const [pagePending, setPagePending] = useState(0);
	const [limitPending, setLimitPending] = useState(10);
	const [totalPending, setTotalPending] = useState(0);

	const [pageInProgress, setPageInProgress] = useState(0);
	const [limitInProgress, setLimitInProgress] = useState(10);
	const [totalInProgress, setTotalInProgress] = useState(0);

	const [openConfirmAccepted, setOpenConfirmAccepted] = useState<boolean>(false);
	const [openConfirmCancelled, setOpenConfirmCancelled] = useState<boolean>(false);
	const [openPopupSubmit, setOpenPopupSubmit] = useState(false)

	const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
	const [files, setFiles] = useState<File[]>([]);

	const pendingColumns: GridColDef<(typeof pendingMaintenanceTasks)[number]>[] = [
		{
			field: 'ID',
			headerName: 'ID',
			flex: 0.4,
			renderCell: (params) => {
				return params.row.MaintenanceRequest?.ID
			}
		},
		{
			field: 'CreatedAt',
			headerName: 'วันที่ได้รับมอบ',
			type: 'string',
			flex: 1,
			// editable: true,
			renderCell: (params) => {
				const date = dateFormat(params.row.UpdatedAt || '')
				const time = timeFormat(params.row.UpdatedAt || '')
				return (
					<Box >
						<Typography
							sx={{
								fontSize: 14,
								whiteSpace: "nowrap",
								overflow: "hidden",
								textOverflow: "ellipsis",
								maxWidth: "100%"
							}}
						>{date}</Typography>
						<Typography
							sx={{
								fontSize: 14,
								whiteSpace: "nowrap",
								overflow: "hidden",
								textOverflow: "ellipsis",
								maxWidth: "100%",
								color: 'gray'
							}}
						>{time}</Typography>
					</Box>
				)
			}
		},
		{
			field: 'Description',
			headerName: 'รายละเอียด',
			type: 'string',
			flex: 1.6,
			// editable: true,
			renderCell: (params) => {
				const requests = params.row.MaintenanceRequest
				const areaID = requests?.Area?.ID
				const areaDetail = requests?.AreaDetail
				const roomtype = requests?.Room?.RoomType?.TypeName
				const roomNum = requests?.Room?.RoomNumber
				const roomFloor = requests?.Room?.Floor?.Number

				const typeName = requests?.MaintenanceType?.TypeName || "งานไฟฟ้า"
				const maintenanceKey = requests?.MaintenanceType?.TypeName as keyof typeof maintenanceTypeConfig;
				const { color, colorLite, icon } = maintenanceTypeConfig[maintenanceKey] ?? { color: "#000", colorLite: "#000", icon: faQuestionCircle };

				return (
					<Box >
						<Typography
							sx={{
								fontSize: 14,
								whiteSpace: "nowrap",
								overflow: "hidden",
								textOverflow: "ellipsis",
								maxWidth: "100%"
							}}
						>
							{
								areaID === 2 ? (
									`${areaDetail}`
								) : (
									`${roomtype} ชั้น ${roomFloor} ห้อง ${roomNum}`
								)
							}
						</Typography>
						<Typography
							sx={{
								fontSize: 14,
								whiteSpace: "nowrap",
								overflow: "hidden",
								textOverflow: "ellipsis",
								maxWidth: "100%",
								color: '#6D6E70'
							}}
						>
							{requests?.Description}
						</Typography>
						<Box sx={{
							bgcolor: colorLite,
							borderRadius: 10,
							px: 1.5,
							py: 0.5,
							display: 'inline-flex',
							gap: 1,
							color: color,
							alignItems: 'center',
							mt: 1
						}}>
							<FontAwesomeIcon icon={icon} />
							<Typography sx={{ fontSize: 14, fontWeight: 600 }}>
								{typeName}
							</Typography>
						</Box>
					</Box>
				)
			},
		},
		{
			field: 'Acception',
			headerName: 'จัดการ',
			type: 'string',
			flex: 1.2,
			// editable: true,
			renderCell: (item) => {
				const isApproved = item.row.RequestStatus?.Name === 'Approved'
				const isRework = item.row.RequestStatus?.Name === 'Rework Requested'

				return isApproved || isRework ? (
					<Box>
						<Button
							variant="containedBlue"
							onClick={() => {
								setOpenConfirmAccepted(true)
								setSelectedTask(item.row)
							}}
							sx={{ mr: 0.8 }}
						>
							<FontAwesomeIcon icon={faTools} />
							<Typography variant="textButtonClassic" >เริ่มงาน</Typography>
						</Button>
						<Button
							variant="outlinedCancel"
							onClick={() => {
								setOpenConfirmCancelled(true)
								setSelectedTask(item.row)
							}}
							sx={{
								minWidth: '0px',
								px: '6px',
							}}
						>
							<FontAwesomeIcon icon={faXmark} size="xl" />
						</Button>
					</Box>
				) : (
					<></>
				)
			},
		},
		{
			field: 'Check',
			headerName: '',
			type: 'string',
			flex: 1.2,
			// editable: true,
			renderCell: (item) => {
				const requestID = String(item.row.MaintenanceRequest?.ID)
				return (
					<Link to="/check-requests" >
						<Button
							variant="contained"
							onClick={() => localStorage.setItem('requestID', requestID)}
						>
							<FontAwesomeIcon icon={faEye} />
							<Typography variant="textButtonClassic" >ดูรายละเอียด</Typography>
						</Button>
					</Link>

				)
			}
		},
	];

	const inProgressColumns: GridColDef<(typeof inProgressMaintenanceTasks)[number]>[] = [
		{
			field: 'ID',
			headerName: 'ID',
			flex: 0.4,
			renderCell: (params) => {
				return params.row.MaintenanceRequest?.ID
			}
		},
		{
			field: 'UpdatedAt',
			headerName: 'วันที่รับงาน',
			type: 'string',
			flex: 1,
			// editable: true,
			renderCell: (params) => {
				const date = dateFormat(params.row.CreatedAt || '')
				const time = timeFormat(params.row.CreatedAt || '')
				return (
					<Box >
						<Typography
							sx={{
								fontSize: 14,
								whiteSpace: "nowrap",
								overflow: "hidden",
								textOverflow: "ellipsis",
								maxWidth: "100%"
							}}
						>{date}</Typography>
						<Typography
							sx={{
								fontSize: 14,
								whiteSpace: "nowrap",
								overflow: "hidden",
								textOverflow: "ellipsis",
								maxWidth: "100%",
								color: 'gray'
							}}
						>{time}</Typography>
					</Box>
				)
			}
		},
		{
			field: 'Description',
			headerName: 'รายละเอียด',
			type: 'string',
			flex: 1.6,
			// editable: true,
			renderCell: (params) => {
				const requests = params.row.MaintenanceRequest
				const areaID = requests?.Area?.ID
				const areaDetail = requests?.AreaDetail
				const roomtype = requests?.Room?.RoomType?.TypeName
				const roomNum = requests?.Room?.RoomNumber
				const roomFloor = requests?.Room?.Floor?.Number

				const typeName = requests?.MaintenanceType?.TypeName || "งานไฟฟ้า"
				const maintenanceKey = requests?.MaintenanceType?.TypeName as keyof typeof maintenanceTypeConfig;
				const { color, colorLite, icon } = maintenanceTypeConfig[maintenanceKey] ?? { color: "#000", colorLite: "#000", icon: faQuestionCircle };

				return (
					<Box >
						<Typography
							sx={{
								fontSize: 14,
								whiteSpace: "nowrap",
								overflow: "hidden",
								textOverflow: "ellipsis",
								maxWidth: "100%"
							}}
						>
							{
								areaID === 2 ? (
									`${areaDetail}`
								) : (
									`${roomtype} ชั้น ${roomFloor} ห้อง ${roomNum}`
								)
							}
						</Typography>
						<Typography
							sx={{
								fontSize: 14,
								whiteSpace: "nowrap",
								overflow: "hidden",
								textOverflow: "ellipsis",
								maxWidth: "100%",
								color: '#6D6E70'
							}}
						>
							{requests?.Description}
						</Typography>
						<Box sx={{
							bgcolor: colorLite,
							borderRadius: 10,
							px: 1.5,
							py: 0.5,
							display: 'inline-flex',
							gap: 1,
							color: color,
							alignItems: 'center',
							mt: 1
						}}>
							<FontAwesomeIcon icon={icon} />
							<Typography sx={{ fontSize: 14, fontWeight: 600 }}>
								{typeName}
							</Typography>
						</Box>
					</Box>
				)
			},
		},
		{
			field: 'Acception',
			headerName: 'จัดการ',
			type: 'string',
			flex: 1.2,
			// editable: true,
			renderCell: (item) => {
				return item.row.RequestStatus?.Name === 'In Progress' ? (
					<Box>
						<Button
							variant="containedBlue"
							onClick={() => {
								setOpenPopupSubmit(true)
								setSelectedTask(item.row)
							}}
							sx={{ mr: 0.8 }}
						>
							<FontAwesomeIcon icon={faPaperPlane} />
							<Typography variant="textButtonClassic" >ส่งงาน</Typography>
						</Button>
						<Button
							variant="outlinedCancel"
							onClick={() => {
								setOpenConfirmCancelled(true)
								setSelectedTask(item.row)
							}}
							sx={{
								minWidth: '0px',
								px: '6px',
							}}
						>
							<FontAwesomeIcon icon={faXmark} size="xl" />
						</Button>
					</Box>
				) : (
					<></>
				)
			},
		},
		{
			field: 'Check',
			headerName: '',
			type: 'string',
			flex: 1.2,
			// editable: true,
			renderCell: (item) => {
				const requestID = String(item.row.MaintenanceRequest?.ID)
				return (
					<Link to="/check-requests" >
						<Button
							variant="contained"
							onClick={() => localStorage.setItem('requestID', requestID)}
						>
							<FontAwesomeIcon icon={faEye} />
							<Typography variant="textButtonClassic" >ดูรายละเอียด</Typography>
						</Button>
					</Link>

				)
			}
		},
	];

	const getMaintenanceTypes = async () => {
		try {
			const res = await GetMaintenanceTypes();
			if (res) {
				setMaintenanceTypes(res);
			}
		} catch (error) {
			console.error("Error fetching maintenance types:", error);
		}
	};

	const getPendingMaintenanceTasks = async () => {
		try {
			const PendingID = requestStatuses?.find(item => item.Name === "Approved")?.ID || null;
			const ReworkID = requestStatuses?.find(item => item.Name === "Rework Requested")?.ID || null;
			const statusFormat = `${PendingID},${ReworkID}`

			const res = await GetMaintenanceTask(statusFormat, pagePending, limitPending, selectedType, selectedDate ? selectedDate.format('YYYY-MM-DD') : "");
			if (res) {
				setPendingMaintenanceTasks(res.data);
				setTotalPending(res.total);
			}
		} catch (error) {
			console.error("Error fetching request maintenance requests:", error);
		}
	};

	const getInProgressMaintenanceTasks = async () => {
		const InProgressID = requestStatuses?.find(item => item.Name === "In Progress")?.ID || null;
		try {
			const res = await GetMaintenanceTask(String(InProgressID), pageInProgress, limitInProgress, selectedType, selectedDate ? selectedDate.format('YYYY-MM-DD') : "");
			if (res) {
				setInProgressMaintenanceTasks(res.data);
				setTotalInProgress(res.total);
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

	const handleClickAcceptWork = (
		statusName: "In Progress" | "Unsuccessful",
		actionType: "accept" | "cancel",
		note?: string
	) => {
		const statusID = requestStatuses?.find(item => item.Name === statusName)?.ID || 0;

		handleActionAcception(statusID, {
			selectedTask,
			setAlerts,
			refreshPendingTaskData: getPendingMaintenanceTasks,
			refreshInProgressTaskData: getInProgressMaintenanceTasks,
			setOpenConfirmAccepted,
			setOpenConfirmCancelled,
			actionType,
			note
		});
	};

	const onClickSubmit = () => {
		if (!selectedTask) {
			setAlerts((prev) => [
				...prev,
				{ type: "error", message: "ไม่พบข้อมูลงานซ่อมที่เลือก" }
			]);
			return;
		}
		const statusID = requestStatuses?.find(item => item.Name === "Waiting For Review")?.ID || 0;

		handleSubmitWork(statusID, {
			selectedTask,
			setAlerts,
			refreshTaskData: getInProgressMaintenanceTasks,
			setOpenPopupSubmit,
			files
		});
	};

	const handleClearFillter = () => {
		setSelectedDate(null);
		setSearchText('');
		setSelectedType(0)
	}

	const filteredPendingTasks = pendingMaintenanceTasks.filter((item) => {
		const request = item.MaintenanceRequest
		const requestId = request?.ID ? Number(request.ID) : null;
		const firstName = request?.User?.FirstName?.toLowerCase() || "";
		const lastName = request?.User?.LastName?.toLowerCase() || "";

		const matchText =
			!searchText ||
			requestId === Number(searchText) ||
			firstName.includes(searchText.toLowerCase()) ||
			lastName.includes(searchText.toLowerCase())

		// คืนค่าเฉพาะรายการที่ตรงกับทุกเงื่อนไข
		return matchText
	});

	const filteredInProgressTasks = inProgressMaintenanceTasks.filter((item) => {
		const request = item.MaintenanceRequest
		const requestId = request?.ID ? Number(request.ID) : null;
		const firstName = request?.User?.FirstName?.toLowerCase() || "";
		const lastName = request?.User?.LastName?.toLowerCase() || "";

		const matchText =
			!searchText ||
			requestId === Number(searchText) ||
			firstName.includes(searchText.toLowerCase()) ||
			lastName.includes(searchText.toLowerCase())

		// คืนค่าเฉพาะรายการที่ตรงกับทุกเงื่อนไข
		return matchText
	});

	useEffect(() => {

		const fetchInitialData = async () => {
			try {
				await Promise.all([
					getMaintenanceTypes(),
					getRequestStatuses()
				]);
			} catch (error) {
				console.error("Error fetching initial data:", error);
			}
		};

		fetchInitialData();
	}, []);

	useEffect(() => {
		getPendingMaintenanceTasks()
		getInProgressMaintenanceTasks()
	}, [requestStatuses])

	useEffect(() => {
		getPendingMaintenanceTasks()
	}, [pagePending, limitPending, selectedType, selectedDate])

	useEffect(() => {
		getInProgressMaintenanceTasks()
	}, [pageInProgress, limitInProgress, selectedType, selectedDate])

	return (
		<div className="assign-work-page">
			{/* Show Alerts */}
			<AlertGroup alerts={alerts} setAlerts={setAlerts} />

			{/* Submit Popup */}
			<SubmitPopup
				open={openPopupSubmit}
				onClose={() => setOpenPopupSubmit(false)}
				onConfirm={onClickSubmit}
				setAlerts={setAlerts}
				files={files}
				onChange={setFiles}
			/>

			{/* Accepted Confirm */}
			<ConfirmDialog
				open={openConfirmAccepted}
				setOpenConfirm={setOpenConfirmAccepted}
				handleFunction={() => handleClickAcceptWork("In Progress", "accept")}
				title="ยืนยันการดำเนินการงานแจ้งซ่อม"
				message="คุณแน่ใจหรือไม่ว่าต้องการดำเนินการงานแจ้งซ่อมนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
			/>

			{/* Cancelled Confirm */}
			<ConfirmDialog
				open={openConfirmCancelled}
				setOpenConfirm={setOpenConfirmCancelled}
				handleFunction={(note) => handleClickAcceptWork("Unsuccessful", "cancel", note)}
				title="ยืนยันการยกเลิกงานแจ้งซ่อม"
				message="คุณแน่ใจหรือไม่ว่าต้องการยกเลิกงานแจ้งซ่อมนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
				showNoteField
			/>

			<Grid2
				container
				spacing={3}
			>
				<Grid2 className='title-box' size={{ xs: 10, md: 12 }}>
					<Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
						งานของฉัน
					</Typography>
				</Grid2>

				{/* Filters Section */}
				<Grid2 container
					spacing={1}
					className='filter-section'
					size={{ xs: 10, md: 12 }}
					sx={{
						alignItems: "flex-end",
						height: 'auto'
					}}>
					<Grid2 size={{ xs: 10, md: 6 }}>
						<TextField
							fullWidth
							className="search-box"
							variant="outlined"
							placeholder="ค้นหา"
							margin="none"
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							slotProps={{
								input: {
									startAdornment: (
										<InputAdornment position="start" sx={{ px: 0.5 }}>
											<FontAwesomeIcon icon={faMagnifyingGlass} size="lg" />
										</InputAdornment>
									),
								}
							}}
						/>
					</Grid2>
					<Grid2 size={{ xs: 10, md: 2.5 }}>
						<LocalizationProvider dateAdapter={AdapterDayjs}>
							<DatePicker
								format="DD/MM/YYYY"
								value={selectedDate}
								onChange={(newValue) => setSelectedDate(newValue)}
								slots={{
									openPickerIcon: CalendarMonth,
								}}
							/>
						</LocalizationProvider>
					</Grid2>
					<Grid2 size={{ xs: 10, md: 2.5 }}>
						<FormControl fullWidth>
							<Select
								value={selectedType}
								onChange={(e) => setSelectedType(Number(e.target.value))}
								displayEmpty
								startAdornment={
									<InputAdornment position="start" sx={{ pl: 0.5 }}>
										<FontAwesomeIcon icon={faToolbox} size="lg" />
									</InputAdornment>
								}
							>
								<MenuItem value={0}>{'ทุกประเภทงาน'}</MenuItem>
								{
									maintenanceTypes.map((item, index) => {
										return (
											<MenuItem key={index} value={index + 1}>{item.TypeName}</MenuItem>
										)
									})
								}
							</Select>
						</FormControl>
					</Grid2>
					<Grid2 size={{ xs: 10, md: 1 }}>
						<Button onClick={handleClearFillter}
							sx={{
								minWidth: 0,
								width: '100%',
								height: '45px',
								borderRadius: '10px',
								border: '1px solid rgb(109, 110, 112, 0.4)',
								"&:hover": {
									boxShadow: 'none',
									borderColor: 'primary.main',
									backgroundColor: 'transparent'
								},
							}}
						><FontAwesomeIcon icon={faRotateRight} size="lg" style={{ color: 'gray' }} /></Button>
					</Grid2>
				</Grid2>

				{/* Data Table */}
				<Grid2 container size={{ xs: 12, md: 12 }} spacing={1}>
					<Grid2 size={{ xs: 12, md: 6 }} >
						<MaintenanceTaskTable
							title="รอดำเนินการ"
							rows={filteredPendingTasks}
							columns={pendingColumns}
							rowCount={totalPending}
							page={pagePending}
							limit={limitPending}
							onPageChange={(p) => setPagePending(p + 1)}
							onLimitChange={setLimitPending}
							noData={'ไม่พบงานที่รอดำเนินการ'}
						/>
					</Grid2>
					<Grid2 size={{ xs: 12, md: 6 }} >
						<MaintenanceTaskTable
							title="กำลังดำเนินการ"
							rows={filteredInProgressTasks}
							columns={inProgressColumns}
							rowCount={totalInProgress}
							page={pageInProgress}
							limit={limitInProgress}
							onPageChange={(p) => setPageInProgress(p + 1)}
							onLimitChange={setLimitInProgress}
							noData={'ไม่พบการที่กำลังดำเนินการ'}
						/>
					</Grid2>
				</Grid2>
			</Grid2>
		</div>
	)
}
export default AcceptWork;