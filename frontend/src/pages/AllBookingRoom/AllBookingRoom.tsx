import { faMagnifyingGlass, faRotateRight, faToolbox } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Button, Card, Container, FormControl, Grid, InputAdornment, MenuItem, Skeleton, Typography, useMediaQuery } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { TextField } from "../../components/TextField/TextField";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "../../components/DatePicker/DatePicker";
import { CalendarMonth } from "@mui/icons-material";
import { Select } from "../../components/Select/Select";
import CustomDataGrid from "../../components/CustomDataGrid/CustomDataGrid";
import { useState } from "react";
import theme from "../../styles/Theme";
import { mockBookingRooms } from "./mockData";
import dateFormat from "../../utils/dateFormat";
import timeFormat from "../../utils/timeFormat";

function AllBookingRoom() {
    const [selectedStatuses, setSelectedStatuses] = useState<number[]>([0]);

    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(0);

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

    const getColumns = (): GridColDef[] => {
        if (isSmallScreen) {
            return [
                {
                    field: "",
                    headerName: "All Maintenance Requests",
                    flex: 1,
                    renderCell: (params) => {
                        const data = params.row;
                        

                        // const dateTime = `${dateFormat(params.row.CreatedAt || "")} ${timeFormat(params.row.CreatedAt || "")}`;

                        // const description = params.row.Description;
                        // const areaID = params.row.Area?.ID;
                        // const areaDetail = params.row.AreaDetail;
                        // const roomtype = params.row.Room?.RoomType?.TypeName;
                        // const roomNum = params.row.Room?.RoomNumber;
                        // const roomFloor = params.row.Room?.Floor?.Number;

                        // const typeName = params.row.MaintenanceType?.TypeName || "งานไฟฟ้า";
                        // const maintenanceKey = params.row.MaintenanceType?.TypeName as keyof typeof maintenanceTypeConfig;
                        // const { color: typeColor, icon: typeIcon } = maintenanceTypeConfig[maintenanceKey] ?? {
                        //     color: "#000",
                        //     colorLite: "#000",
                        //     icon: faQuestionCircle,
                        // };

                        // const requester = params.row.User;
                        // const requesterName = `${requester?.FirstName || ""} ${requester?.LastName || ""} (${requester?.EmployeeID})`;

                        // const notification = params.row.Notifications ?? [];
                        // const hasNotificationForUser = notification.some((n: NotificationsInterface) => n.UserID === user?.ID && !n.IsRead);

                        // const cardItem = document.querySelector(".card-item-container") as HTMLElement;
                        // let width;
                        // if (cardItem) {
                        //     width = cardItem.offsetWidth;
                        // }

                        return (
                            <Grid container size={{ xs: 12 }} sx={{ px: 1 }} className="card-item-container">
                                {/* <Grid size={{ xs: 7 }}>
                                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: "5px", width: "100%" }}>
                                        {hasNotificationForUser && <AnimatedBell />}
                                        <Typography
                                            sx={{
                                                fontSize: 16,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                maxWidth: "100%",
                                            }}
                                        >
                                            {areaID === 2 ? `${areaDetail}` : `${roomtype} ชั้น ${roomFloor} ห้อง ${roomNum}`}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.4, my: 0.8 }}>
                                        <FontAwesomeIcon icon={faClock} style={{ width: "12px", height: "12px", paddingBottom: "4px" }} />
                                        <Typography
                                            sx={{
                                                fontSize: 13,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {dateTime}
                                        </Typography>
                                    </Box>
                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            maxWidth: "100%",
                                            color: "text.secondary",
                                            my: 0.8,
                                        }}
                                    >
                                        {description}
                                    </Typography>
                                    <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.4, my: 1 }}>
                                        <FontAwesomeIcon icon={faUser} style={{ width: "12px", height: "12px", paddingBottom: "4px" }} />
                                        <Typography
                                            sx={{
                                                fontSize: 13,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {requesterName}
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            borderRadius: 10,
                                            py: 0.5,
                                            display: "inline-flex",
                                            gap: 1,
                                            color: typeColor,
                                            alignItems: "center",
                                        }}
                                    >
                                        <FontAwesomeIcon icon={typeIcon} />
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                            }}
                                        >
                                            {typeName}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid size={{ xs: 5 }} container direction="column">
                                    <Box
                                        sx={{
                                            bgcolor: statusColorLite,
                                            borderRadius: 10,
                                            px: 1.5,
                                            py: 0.5,
                                            display: "flex",
                                            gap: 1,
                                            color: statusColor,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "100%",
                                        }}
                                    >
                                        <FontAwesomeIcon icon={statusIcon} />
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                maxWidth: "100%",
                                            }}
                                        >
                                            {statusName}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Divider sx={{ width: "100%", my: 1 }} />

                                <Grid size={{ xs: 12 }}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: 0.8,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        {showButtonApprove ? (
                                            <Grid container spacing={0.8} size={{ xs: 12 }}>
                                                <Grid size={{ xs: 5 }}>
                                                    <Tooltip title={"Approve"}>
                                                        <Button
                                                            variant="containedBlue"
                                                            onClick={() => {
                                                                setOpenPopupApproved(true);
                                                                setSelectedRequest(data);
                                                            }}
                                                            fullWidth
                                                        >
                                                            <FontAwesomeIcon icon={faCheck} size="lg" />
                                                            <Typography variant="textButtonClassic" className="text-btn">
                                                                Approve
                                                            </Typography>
                                                        </Button>
                                                    </Tooltip>
                                                </Grid>
                                                <Grid size={{ xs: 5 }}>
                                                    <Tooltip title={"Reject"}>
                                                        <Button
                                                            variant="containedCancel"
                                                            onClick={() => {
                                                                setOpenConfirmRejected(true);
                                                                setSelectedRequest(data);
                                                            }}
                                                            fullWidth
                                                        >
                                                            <FontAwesomeIcon icon={faXmark} size="lg" />
                                                            <Typography variant="textButtonClassic" className="text-btn">
                                                                Reject
                                                            </Typography>
                                                        </Button>
                                                    </Tooltip>
                                                </Grid>
                                                <Grid size={{ xs: 2 }}>
                                                    <Tooltip title={"Details"}>
                                                        <Button
                                                            variant="outlinedGray"
                                                            onClick={() => {
                                                                handleClickCheck(data);
                                                            }}
                                                            sx={{
                                                                minWidth: "42px",
                                                            }}
                                                            fullWidth
                                                        >
                                                            <FontAwesomeIcon icon={faEye} size="lg" />
                                                            {width && width > 530 && (
                                                                <Typography variant="textButtonClassic" className="text-btn">
                                                                    Details
                                                                </Typography>
                                                            )}
                                                        </Button>
                                                    </Tooltip>
                                                </Grid>
                                            </Grid>
                                        ) : (
                                            <Tooltip title={"Details"}>
                                                <Button
                                                    className="btn-detail"
                                                    variant="outlinedGray"
                                                    onClick={() => {
                                                        handleClickCheck(data);
                                                    }}
                                                    sx={{
                                                        minWidth: "42px",
                                                        width: "100%",
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faEye} size="lg" />
                                                    <Typography variant="textButtonClassic" className="text-btn">
                                                        Details
                                                    </Typography>
                                                </Button>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </Grid> */}
                            </Grid>
                        );
                    },
                },
            ];
        } else {
            return [
                {
                    field: "ID",
                    headerName: "No.",
                    flex: 0.5,
                    align: "center",
                    headerAlign: "center",
                    renderCell: (params) => {
                        const bookingID = params.row.ID;
                        // const notification = params.row.Notifications ?? [];
                        // const hasNotificationForUser = notification.some((n: NotificationsInterface) => n.UserID === user?.ID && !n.IsRead);
                        return (
                            <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: "100%", gap: "5px" }}>
                                {/* {hasNotificationForUser && <AnimatedBell />} */}
                                <Typography>{bookingID}</Typography>
                            </Box>
                        );
                    },
                },
                {
                    field: "Room",
                    headerName: "Room",
                    type: "string",
                    flex: 1.8,
                    // editable: true,
                    renderCell: (params) => {
                        const data = params.row
                        const roomNumber = data.Room.RoomNumber
                        const floor = data.Room.Floor
                        const title = `ห้อง ${roomNumber} ชั้น ${floor}`
                        const purpose = data.Purpose

                        return (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    height: "100%",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: "100%",
                                    }}
                                >
                                    {title}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: "100%",
                                        color: "text.secondary",
                                    }}
                                >
                                    {purpose}
                                </Typography>
                                {/* <Box
                                    sx={{
                                        borderRadius: 10,
                                        py: 0.5,
                                        display: "inline-flex",
                                        gap: 1,
                                        color: color,
                                        alignItems: "center",
                                    }}
                                >
                                    <FontAwesomeIcon icon={icon} />
                                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{typeName}</Typography>
                                </Box> */}
                            </Box>
                        );
                    },
                },
                {
                    field: "Date",
                    headerName: "Date",
                    type: "string",
                    flex: 1,
                    // editable: true,
                    renderCell: (params) => {
                        const date = dateFormat(params.row.Date || "");
                        const time = timeFormat(params.row.Date || "");
                        return (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    height: "100%",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: "100%",
                                    }}
                                >
                                    {date}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: "100%",
                                        color: "text.secondary",
                                    }}
                                >
                                    {time}
                                </Typography>
                            </Box>
                        );
                    },
                },
                {
                    field: "Time Slot",
                    headerName: "Time Slot",
                    type: "string",
                    flex: 1,
                    // editable: true,
                    renderCell: (params) => {
                        console.log(params.row)
                        const startTime = params.row.TimeSlot.StartTime;
                        const endTime = params.row.TimeSlot.EndTime;
                        const timeSlot = `${startTime} - ${endTime} น.`
                        return (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    height: "100%",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                    }}
                                >
                                    {timeSlot}
                                </Typography>
                            </Box>
                        );
                    },
                },
                {
                    field: "RequestStatus",
                    headerName: "Status",
                    type: "string",
                    flex: 1,
                    // editable: true,
                    renderCell: (params) => {
                        // const statusName = params.row.RequestStatus?.Name || "Pending";
                        // const statusKey = params.row.RequestStatus?.Name as keyof typeof statusConfig;
                        // const { color, colorLite, icon } = statusConfig[statusKey] ?? {
                        //     color: "#000",
                        //     colorLite: "#000",
                        //     icon: faQuestionCircle,
                        // };

                        return (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    height: "100%",
                                }}
                            >
                                {/* <Box
                                    sx={{
                                        bgcolor: colorLite,
                                        borderRadius: 10,
                                        px: 1.5,
                                        py: 0.5,
                                        display: "flex",
                                        gap: 1,
                                        color: color,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "100%",
                                    }}
                                >
                                    <FontAwesomeIcon icon={icon} />
                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            fontWeight: 600,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {statusName}
                                    </Typography>
                                </Box> */}
                            </Box>
                        );
                    },
                },
                {
                    field: "Booker",
                    headerName: "Booker",
                    description: "This column has a value getter and is not sortable.",
                    sortable: false,
                    flex: 1.2,
                    renderCell: (params) => {
                        const user = params.row.User;
                        const name = `${user.FirstName || ""} ${user.LastName || ""}`;
                        const employeeID = user.EmployeeID;
                        return (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    height: "100%",
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: "100%",
                                    }}
                                >
                                    {name}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: 14,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: "100%",
                                        color: "text.secondary",
                                    }}
                                >
                                    {employeeID}
                                </Typography>
                            </Box>
                        );
                    },
                },
                {
                    field: "Actions",
                    headerName: "Actions",
                    type: "string",
                    flex: 1.5,
                    // editable: true,
                    renderCell: (item) => {
                        // const data = item.row;
                        // const showButtonApprove = item.row.RequestStatus?.Name === "Pending" && (isManager || isAdmin);
                        return (
                            <Box
                                className="container-btn"
                                sx={{
                                    display: "flex",
                                    gap: 0.8,
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    height: "100%",
                                }}
                            >
                                {/* {showButtonApprove ? (
                                    <>
                                        <Tooltip title={"Approve"}>
                                            <Button
                                                className="btn-approve"
                                                variant="containedBlue"
                                                onClick={() => {
                                                    setOpenPopupApproved(true);
                                                    setSelectedRequest(data);
                                                }}
                                                sx={{
                                                    minWidth: "42px",
                                                    // px: "10px",
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faCheck} size="lg" />
                                                <Typography variant="textButtonClassic" className="text-btn">
                                                    Approve
                                                </Typography>
                                            </Button>
                                        </Tooltip>
                                        <Tooltip title={"Reject"}>
                                            <Button
                                                className="btn-reject"
                                                variant="containedCancel"
                                                onClick={() => {
                                                    setOpenConfirmRejected(true);
                                                    setSelectedRequest(data);
                                                }}
                                                sx={{
                                                    minWidth: "42px",
                                                    // px: "10px",
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faXmark} size="lg" />
                                                <Typography variant="textButtonClassic" className="text-btn">
                                                    Reject
                                                </Typography>
                                            </Button>
                                        </Tooltip>
                                        <Tooltip title={"Details"}>
                                            <Button
                                                className="btn-detail"
                                                variant="outlinedGray"
                                                onClick={() => {
                                                    handleClickCheck(data);
                                                }}
                                                sx={{
                                                    minWidth: "42px",
                                                    // px: "10px",
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faEye} size="lg" />
                                                <Typography variant="textButtonClassic" className="text-btn">
                                                    Details
                                                </Typography>
                                            </Button>
                                        </Tooltip>
                                    </>
                                ) : (
                                    <Tooltip title={"Details"}>
                                        <Button
                                            className="btn-detail"
                                            variant="outlinedGray"
                                            onClick={() => {
                                                handleClickCheck(data);
                                            }}
                                            sx={{
                                                minWidth: "42px",
                                                // px: "10px",
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faEye} size="lg" />
                                            <Typography variant="textButtonClassic" className="text-btn">
                                                Details
                                            </Typography>
                                        </Button>
                                    </Tooltip>
                                )} */}
                            </Box>
                        );
                    },
                },
            ];
        }
    };

    return (
        <Box className="all-booking-room-page">
            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3}>
                    <Grid className="title-box" size={{ xs: 12, md: 12 }}>
                        <Typography
                            variant="h5"
                            className="title"
                            sx={{
                                fontWeight: 700,
                            }}
                        >
                            รายการจองห้อง
                        </Typography>
                    </Grid>

                    {/* Filters Section */}
                    {true ? (
                        <Grid className="filter-section" size={{ xs: 12 }}>
                            <Card sx={{ width: "100%", borderRadius: 2 }}>
                                <Grid container sx={{ alignItems: "flex-end", p: 1.5 }} spacing={1}>
                                    <Grid size={{ xs: 12, sm: 5 }}>
                                        <TextField
                                            fullWidth
                                            className="search-box"
                                            variant="outlined"
                                            placeholder="ค้นหา"
                                            margin="none"
                                            // value={searchText}
                                            // onChange={(e) => setSearchText(e.target.value)}
                                            slotProps={{
                                                input: {
                                                    startAdornment: (
                                                        <InputAdornment position="start" sx={{ px: 0.5 }}>
                                                            <FontAwesomeIcon icon={faMagnifyingGlass} size="lg" />
                                                        </InputAdornment>
                                                    ),
                                                },
                                            }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 5, sm: 3 }}>
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <DatePicker
                                                views={["month", "year"]}
                                                format="MM/YYYY"
                                                // value={selectedDate}
                                                // onChange={(value, _) => {
                                                //     if (dayjs.isDayjs(value)) {
                                                //         setSelectedDate(value);
                                                //     } else {
                                                //         setSelectedDate(null);
                                                //     }
                                                // }}
                                                slots={{
                                                    openPickerIcon: CalendarMonth,
                                                }}
                                                sx={{ width: "100%" }}
                                            />
                                        </LocalizationProvider>
                                    </Grid>
                                    <Grid size={{ xs: 5, sm: 3 }}>
                                        <FormControl fullWidth>
                                            <Select
                                                // value={selectedType}
                                                // onChange={(e) => setSelectedType(Number(e.target.value))}
                                                displayEmpty
                                                startAdornment={
                                                    <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                                        <FontAwesomeIcon icon={faToolbox} size="lg" />
                                                    </InputAdornment>
                                                }
                                            >
                                                <MenuItem value={0}>{"ทุกประเภทงาน"}</MenuItem>
                                                {/* {maintenanceTypes.map((item, index) => {
                                                    return (
                                                        <MenuItem key={index} value={index + 1}>
                                                            {item.TypeName}
                                                        </MenuItem>
                                                    );
                                                })} */}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid size={{ xs: 2, sm: 1 }}>
                                        <Button
                                            // onClick={handleClearFillter}
                                            sx={{
                                                minWidth: 0,
                                                width: "100%",
                                                height: "45px",
                                                borderRadius: "10px",
                                                border: "1px solid rgb(109, 110, 112, 0.4)",
                                                "&:hover": {
                                                    boxShadow: "none",
                                                    borderColor: "primary.main",
                                                    backgroundColor: "transparent",
                                                },
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faRotateRight} size="lg" style={{ color: "gray" }} />
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Card>
                        </Grid>
                    ) : (
                        <Skeleton variant="rectangular" width="100%" height={70} sx={{ borderRadius: 2 }} />
                    )}

                    <Grid size={{ xs: 12, md: 12 }}>
                        {true ? (
                            <CustomDataGrid
                                rows={mockBookingRooms}
                                columns={getColumns()}
                                rowCount={total}
                                page={page}
                                limit={limit}
                                onPageChange={setPage}
                                onLimitChange={setLimit}
                                noDataText="ไม่พบข้อมูลการจองห้อง"
                            />
                        ) : (
                            <Skeleton variant="rectangular" width="100%" height={220} sx={{ borderRadius: 2 }} />
                        )}
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
export default AllBookingRoom;
