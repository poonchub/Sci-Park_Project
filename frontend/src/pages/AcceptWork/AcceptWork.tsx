import { Box, Button, FormControl, Grid, InputAdornment, MenuItem, Skeleton, Tab, Tabs, Typography } from "@mui/material";
import { TextField } from "../../components/TextField/TextField";
import { useEffect, useRef, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faMagnifyingGlass, faPaperPlane, faQuestionCircle, faRotateRight, faToolbox, faTools, faXmark, } from "@fortawesome/free-solid-svg-icons";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { GridColDef } from '@mui/x-data-grid';
import { GetMaintenanceTask, GetMaintenanceTaskByID, GetMaintenanceTypes, GetRequestStatuses, socketUrl } from "../../services/http";
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
import { useMediaQuery } from "@mui/system";
import theme from "../../styles/Theme";

import { io } from 'socket.io-client';
import CustomTabPanel from "../../components/CustomTabPanel/CustomTabPanel";

function a11yProps(index: number) {
	return {
		id: `simple-tab-${index}`,
		'aria-controls': `simple-tabpanel-${index}`,
	};
}

function AcceptWork() {

	const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceTypesInteface[]>([])
	const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTasksInterface[]>([]);
	const [selectedTask, setSelectedTask] = useState<MaintenanceTasksInterface>()
	const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([])

	const [searchText, setSearchText] = useState('')
	const [selectedType, setSelectedType] = useState(0)
	const [selectedDate, setSelectedDate] = useState<Dayjs | null>();

	const [page, setPage] = useState(0);
	const [limit, setLimit] = useState(10);
	const [total, setTotal] = useState(0);

	const [openConfirmAccepted, setOpenConfirmAccepted] = useState<boolean>(false);
	const [openConfirmCancelled, setOpenConfirmCancelled] = useState<boolean>(false);
	const [openPopupSubmit, setOpenPopupSubmit] = useState(false)

	const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
	const [files, setFiles] = useState<File[]>([]);

	const [valueTab, setValueTab] = useState(0);

	const [isLoadingData, setIsLoadingData] = useState(true)

	const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

	const valueTabRef = useRef(valueTab);

	const columnVisibilityModel = {
		Acception: valueTab !== 2,
		Inspection: valueTab === 2,
	}

	const getColumns = (): GridColDef[] => {
		if (isSmallScreen) {
			return [
				{
					field: '',
					headerName: 'รายการแจ้งซ่อมท้้งหมด',
					flex: 1,
					renderCell: (params) => {
						const requestID = String(params.row.MaintenanceRequest?.ID)
						const requests = params.row.MaintenanceRequest

						const date = dateFormat(params.row.CreatedAt || '')

						const areaID = requests?.Area?.ID
						const areaDetail = requests?.AreaDetail
						const roomtype = requests?.Room?.RoomType?.TypeName
						const roomNum = requests?.Room?.RoomNumber
						const roomFloor = requests?.Room?.Floor?.Number
						const description = requests?.Description

						const typeName = requests?.MaintenanceType?.TypeName || "งานไฟฟ้า"
						const maintenanceKey = requests?.MaintenanceType?.TypeName as keyof typeof maintenanceTypeConfig;
						const { color, icon } = maintenanceTypeConfig[maintenanceKey] ?? { color: "#000", colorLite: "#000", icon: faQuestionCircle };

						return (
							<Grid
								container
								size={{ xs: 12 }}
								sx={{ px: 1 }}
							>
								<Grid size={{ xs: 7 }}>
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
											color: 'text.secondary'
										}}
									>
										{description}
									</Typography>
									<Box sx={{
										borderRadius: 10,
										py: 0.5,
										display: 'inline-flex',
										gap: 1,
										color: color,
										alignItems: 'center',
									}}>
										<FontAwesomeIcon icon={icon} />
										<Typography sx={{ fontSize: 14, fontWeight: 600 }}>
											{typeName}
										</Typography>
									</Box>
								</Grid>

								<Grid size={{ xs: 5 }}
									container
									direction="column"
									sx={{
										justifyContent: "flex-start",
										alignItems: "flex-end",
									}}
								>
									<Box>
										<Typography sx={{
											fontSize: 13,
											color: 'text.secondary'
										}}>{date}</Typography>
									</Box>
								</Grid>

								<Grid
									size={{ xs: 12 }}
									container
									direction="column"
									sx={{
										justifyContent: "flex-start",
										alignItems: "flex-end",
										gap: 1
									}}
								>
									<Link to="/maintenance/check-requests" >
										<Button
											variant="contained"
											color="primary"
											size="small"
											onClick={() => localStorage.setItem('requestID', requestID)}
										>
											<FontAwesomeIcon icon={faEye} />
											<Typography variant="textButtonClassic" >ดูรายละเอียด</Typography>
										</Button>
									</Link>
								</Grid>
							</Grid>
						);
					},
				},
			]
		} else {
			return [
				{
					field: 'ID',
					headerName: 'หมายเลข',
					flex: 0.5,
					align: 'center',
					headerAlign: 'center',
					renderCell: (params) => {
						return params.row.MaintenanceRequest?.ID
					}
				},
				{
					field: 'UpdatedAt',
					headerName: (
						valueTab === 0 ? 'วันที่ได้รับมอบ' :
							valueTab === 1 ? 'วันที่รับงาน' :
								valueTab === 2 ? 'วันที่ส่งมอบ' : ''
					),
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
										color: 'text.secondary'
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
						const { color, icon } = maintenanceTypeConfig[maintenanceKey] ?? { color: "#000", colorLite: "#000", icon: faQuestionCircle };

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
										color: 'text.secondary'
									}}
								>
									{requests?.Description}
								</Typography>
								<Box sx={{
									borderRadius: 10,
									py: 0.5,
									display: 'inline-flex',
									gap: 1,
									color: color,
									alignItems: 'center',
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
						const isInProgress = item.row.RequestStatus?.Name === 'In Progress'

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
						) : isInProgress ? (
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
					field: 'Inspection',
					headerName: 'ผู้ตรวจรับ',
					type: 'string',
					flex: 1.6,
					// editable: true,
					renderCell: (params) => {
						const task = params.row
						const inspection = params.row.MaintenanceRequest?.Inspection
						const user = inspection?.User
						const name = `${user?.FirstName} ${user?.LastName}`
						const date = dateFormat(inspection?.CreatedAt || '')
						const time = timeFormat(inspection?.CreatedAt || '')
						return inspection ? (
							<Box >
								<Typography
									sx={{
										fontSize: 14,
										whiteSpace: "nowrap",
										overflow: "hidden",
										textOverflow: "ellipsis",
										maxWidth: "100%"
									}}
								>{name}</Typography>
								<Typography
									sx={{
										fontSize: 14,
										whiteSpace: "nowrap",
										overflow: "hidden",
										textOverflow: "ellipsis",
										maxWidth: "100%",
										color: 'text.secondary'
									}}
								>{`${date}, ${time}`}</Typography>
							</Box>
						) : (
							<Typography
								sx={{
									fontSize: 14,
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
									maxWidth: "100%",
								}}
							>{task.RequestStatus.Name}</Typography>
						)
					}
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
							<Link to="/maintenance/check-requests" >
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
			]
		}
	}

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

	const getMaintenanceTasks = async () => {
		try {
			setIsLoadingData(true)

			const statusNames =
				valueTab === 0 ? ["Approved", "Rework Requested"] :
					valueTab === 1 ? ["In Progress"] :
						valueTab === 2 ? ["Waiting For Review", "Completed"] : [""]

			const statusIDs = statusNames
				.map(name => requestStatuses?.find(item => item.Name === name)?.ID)
				.filter(Boolean)

			if (statusIDs.length === 0) return;

			const statusFormat = statusIDs.join(",");

			const res = await GetMaintenanceTask(
				statusFormat,
				page,
				limit,
				selectedType,
				selectedDate ? selectedDate.format('YYYY-MM-DD') : ""
			);

			if (res) {
				setMaintenanceTasks(res.data);
				setTotal(res.total);
				setIsLoadingData(false)
			}
		} catch (error) {
			console.error("Error fetching maintenance tasks:", error);
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

	const getNewMaintenanceTask = async (ID: number) => {
		try {
			const res = await GetMaintenanceTaskByID(ID);
			if (res) {
				setMaintenanceTasks(prev => [res, ...prev]);
				setTotal(prev => prev + 1);
			}
		} catch (error) {
			console.error("Error fetching maintenance request:", error);
		}
	};

	const getUpdatedMaintenanceTask = async (data: MaintenanceTasksInterface) => {
		try {
			const res = await GetMaintenanceTaskByID(data.ID || 0);
			if (res) {
				const statusName = res.RequestStatus.Name

				if (statusName === 'Waiting For Review' || statusName === 'In Progress' || statusName === 'Unsuccessful' || (statusName === 'Rework Requested' )) {
					setMaintenanceTasks(prev => prev.filter(task => task.ID !== data.ID));
					setTotal(prev => (prev > 0 ? prev - 1 : 0));
				}
				else {
					setMaintenanceTasks(prev =>
						prev.map(item => item.ID === res.ID ? res : item)
					);
				}

				if (statusName === 'Rework Requested' && valueTabRef.current	 === 0) {
					setMaintenanceTasks(prev => [res, ...prev]);
					setTotal(prev => prev + 1);
				}
			}
		} catch (error) {
			console.error("Error fetching maintenance request:", error);
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
			setOpenPopupSubmit,
			files,
			setFiles,
		});
	};

	const handleClearFillter = () => {
		setSelectedDate(null);
		setSearchText('');
		setSelectedType(0)
	}

	const filteredTasks = maintenanceTasks.filter((item) => {
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
		getMaintenanceTasks()
	}, [requestStatuses])

	useEffect(() => {
		getMaintenanceTasks()
	}, [page, limit, selectedType, selectedDate, valueTab])


	const handleChange = (_: React.SyntheticEvent, newValue: number) => {
		setValueTab(newValue);
	};

	useEffect(() => {
		const socket = io(socketUrl);
		const userId = Number(localStorage.getItem('userId'))

		socket.on("task_created", (data) => {
			if (data.UserID === userId && valueTabRef.current === 0) {
				getNewMaintenanceTask(data.ID)
			}
		});

		socket.on("task_updated", (data) => {
			if (data.UserID === userId) {
				getUpdatedMaintenanceTask(data);
			}
		});

		return () => {
			socket.off("task_created");
			socket.off("task_updated");
		};
	}, []);

	useEffect(() => {
		valueTabRef.current = valueTab;
	}, [valueTab]);
	
	return (
		<Box className="accept-work-page">
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

			<Grid
				container
				spacing={3}
			>
				<Grid className='title-box' size={{ xs: 10, md: 12 }}>
					<Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
						งานของฉัน
					</Typography>
				</Grid>

				{/* Filters Section */}
				<Grid container
					spacing={1}
					className='filter-section'
					size={{ xs: 12 }}
					sx={{
						alignItems: "flex-end",
						height: 'auto'
					}}>
					<Grid size={{ xs: 12, sm: 5 }}>
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
					</Grid>
					<Grid size={{ xs: 5, sm: 3 }}>
						<LocalizationProvider dateAdapter={AdapterDayjs}>
							<DatePicker
								format="DD/MM/YYYY"
								value={selectedDate}
								onChange={(value, _) => {
									if (dayjs.isDayjs(value)) {
										setSelectedDate(value);
									} else {
										setSelectedDate(null);
									}
								}}
								slots={{
									openPickerIcon: CalendarMonth,
								}}
								sx={{ width: '100%' }}
							/>
						</LocalizationProvider>
					</Grid>
					<Grid size={{ xs: 5, sm: 3 }}>
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
					</Grid>
					<Grid size={{ xs: 2, sm: 1 }}>
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
					</Grid>
				</Grid>

				{/* Data Table */}
				<Grid
					container
					size={{ xs: 12, md: 12 }}
					spacing={2.2}
				>
					<Grid size={{ xs: 12, md: 12 }} >
						<Tabs
							value={valueTab}
							onChange={handleChange}
							variant="scrollable"
							allowScrollButtonsMobile
						>
							<Tab label="รอดำเนินการ" {...a11yProps(0)} />
							<Tab label="กำลังดำเนินการ" {...a11yProps(1)} />
							<Tab label="ดำเนินการเสร็จสิ้น" {...a11yProps(2)} />
						</Tabs>
					</Grid>
					<CustomTabPanel value={valueTab} index={0}>
						<MaintenanceTaskTable
							title="รอดำเนินการ"
							rows={filteredTasks}
							columns={getColumns()}
							rowCount={total}
							page={page}
							limit={limit}
							onPageChange={(p) => setPage(p + 1)}
							onLimitChange={setLimit}
							noData={'ไม่พบงานที่รอดำเนินการ'}
							isLoading={isLoadingData}
							columnVisibilityModel={columnVisibilityModel}
						/>
					</CustomTabPanel>
					<CustomTabPanel value={valueTab} index={1}>
						<MaintenanceTaskTable
							title="กำลังดำเนินการ"
							rows={filteredTasks}
							columns={getColumns()}
							rowCount={total}
							page={page}
							limit={limit}
							onPageChange={(p) => setPage(p + 1)}
							onLimitChange={setLimit}
							noData={'ไม่พบงานที่กำลังดำเนินการ'}
							isLoading={isLoadingData}
							columnVisibilityModel={columnVisibilityModel}
						/>
					</CustomTabPanel>
					<CustomTabPanel value={valueTab} index={2}>
						<MaintenanceTaskTable
							title="ดำเนินการเสร็จสิ้น"
							rows={filteredTasks}
							columns={getColumns()}
							rowCount={total}
							page={page}
							limit={limit}
							onPageChange={(p) => setPage(p + 1)}
							onLimitChange={setLimit}
							noData={'ไม่พบงานที่ดำเนินการเสร็จสิ้น'}
							isLoading={isLoadingData}
							columnVisibilityModel={columnVisibilityModel}
						/>
					</CustomTabPanel>
				</Grid>
			</Grid>
		</Box>
	)
}
export default AcceptWork;