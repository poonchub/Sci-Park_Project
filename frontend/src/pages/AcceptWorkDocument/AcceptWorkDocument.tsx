import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Card, Container, Grid, Skeleton, Tab, Tabs, Typography, useMediaQuery, InputAdornment, MenuItem, FormControl, InputLabel } from "@mui/material";
import { DatePicker } from "../../components/DatePicker/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { Select } from "../../components/Select/Select";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TextField } from "../../components/TextField/TextField";
import dayjs, { Dayjs } from "dayjs";
import { GridColDef } from "@mui/x-data-grid";
import CustomDataGrid from "../../components/CustomDataGrid/CustomDataGrid";
import theme from "../../styles/Theme";
import { GetServiceAreaTasksByUserID, ListBusinessGroups } from "../../services/http";
import { Search, BrushCleaning, HelpCircle } from "lucide-react";
import { CalendarMonth } from "@mui/icons-material";
import { BusinessGroupInterface } from "../../interfaces/IBusinessGroup";
import { businessGroupConfig } from "../../constants/businessGroupConfig";
import "./AcceptWorkDocument.css";
import { Tooltip } from "@mui/material";
import { Check, X, Send, Eye } from "lucide-react";

// Interface สำหรับ Service Area Tasks
interface ServiceAreaTaskInterface {
    RequestServiceAreaID: number;
    CreatedAt: string;
    CompanyName: string;
    ServiceAreaDocumentId: number | null;
    BusinessGroupName: string;
    UserNameCombined: string;
    ServiceAreaTaskID: number;
    BusinessGroupID: number | null;
    StatusID: number;
}

function AcceptWorkDocument() {
    const [searchText, setSearchText] = useState("");
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>();
    const [selectedBusinessGroup, setSelectedBusinessGroup] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState(0); // 0 = In Progress, 1 = Complete

    const [rows, setRows] = useState<ServiceAreaTaskInterface[]>([]);
    const [businessGroups, setBusinessGroups] = useState<BusinessGroupInterface[]>([]);

    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

    const renderActionButtons = (data: any, statusName: string) => {
        const showSubmit = statusName === "In Progress";
        const showAcceptReject = statusName === "Complete";

        return (
            <>
                {showAcceptReject && (
                    <>
                        <Tooltip title={"Start"}>
                            <Button
                                className="btn-accept"
                                variant="contained"
                                onClick={() => {
                                    console.log("Start clicked for task:", data.ServiceAreaTaskID);
                                }}
                                sx={{
                                    minWidth: "42px",
                                }}
                            >
                                <Check size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                                <Typography variant="textButtonClassic" className="text-btn">
                                    Start
                                </Typography>
                            </Button>
                        </Tooltip>
                        <Tooltip title={"Cancel"}>
                            <Button
                                className="btn-reject"
                                variant="outlinedCancel"
                                onClick={() => {
                                    console.log("Cancel clicked for task:", data.ServiceAreaTaskID);
                                }}
                                sx={{
                                    minWidth: "42px",
                                }}
                            >
                                <X size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                                <Typography variant="textButtonClassic" className="text-btn">
                                    Cancel
                                </Typography>
                            </Button>
                        </Tooltip>
                    </>
                )}

                {showSubmit && (
                    <>
                        <Tooltip title={"Submit"}>
                            <Button
                                className="btn-submit"
                                variant="contained"
                                onClick={() => {
                                    console.log("Submit clicked for task:", data.ServiceAreaTaskID);
                                }}
                                sx={{
                                    minWidth: "42px",

                                }}
                            >
                                <Send size={16} style={{ minWidth: "16px", minHeight: "16px" }} />
                                <Typography variant="textButtonClassic" className="text-btn">
                                    Submit
                                </Typography>
                            </Button>
                        </Tooltip>
                        <Tooltip title={"Cancel"}>
                            <Button
                                className="btn-reject"
                                variant="outlinedCancel"
                                onClick={() => {
                                    console.log("Cancel clicked for task:", data.ServiceAreaTaskID);
                                }}
                                sx={{
                                    minWidth: "42px",

                                }}
                            >
                                <X size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                                <Typography variant="textButtonClassic" className="text-btn">
                                    Cancel
                                </Typography>
                            </Button>
                        </Tooltip>
                    </>
                )}

                <Tooltip title={"Details"}>
                    <Button
                        className="btn-detail"
                        variant="outlinedGray"
                        onClick={() => {
                            console.log("Details clicked for task:", data.ServiceAreaTaskID);
                        }}
                        sx={{
                            minWidth: "42px",
                            width: !(showSubmit || showAcceptReject) ? "100%" : "",
                        }}
                    >
                        <Eye size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                        {!(showSubmit || showAcceptReject) ? (
                            <Typography variant="textButtonClassic">Details</Typography>
                        ) : (
                            <Typography variant="textButtonClassic" className="text-btn">
                                Details
                            </Typography>
                        )}
                    </Button>
                </Tooltip>
            </>
        );
    };

    const getColumns = (): GridColDef[] => {
        return [
            {
                field: "ServiceAreaTaskID",
                headerName: "No.",
                flex: 0.5,
                align: "center",
                headerAlign: "center"
            },
            {
                field: "Company",
                headerName: "Company",
                type: "string",
                flex: 1.8,
                renderCell: (params) => {
                    const companyName = params.row.CompanyName || '-';
                    const businessGroupId = params.row.BusinessGroupID;

                    // Find business group by ID
                    const businessGroup = businessGroups.find(bg => bg.ID === businessGroupId);
                    const businessGroupName = businessGroup?.Name || 'Unknown';

                    // Get business group config
                    const groupConfig = businessGroupConfig[businessGroupName] || {
                        color: "#000",
                        colorLite: "#000",
                        icon: HelpCircle
                    };
                    const GroupIcon = groupConfig.icon;

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
                                {companyName}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                                {GroupIcon && React.createElement(GroupIcon, {
                                    size: 16,
                                    style: {
                                        color: groupConfig.color,
                                        minWidth: "16px",
                                        minHeight: "16px"
                                    }
                                })}
                                <Typography
                                    sx={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        color: groupConfig.color,
                                    }}
                                >
                                    {businessGroupName}
                                </Typography>
                            </Box>
                        </Box>
                    );
                },
            },
            {
                field: "CreatedAt",
                headerName: "Date Assigned",
                type: "string",
                flex: 1,
                renderCell: (params) => {
                    const date = dayjs(params.value).format('DD/MM/YYYY');
                    const time = dayjs(params.value).format('hh:mm A');
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
                field: "UserNameCombined",
                headerName: "Requester",
                flex: 1.2
            },
            {
                field: "Actions",
                headerName: "Actions",
                flex: 1.5,
                renderCell: (params) => {
                    const data = params.row;
                    const statusName = data.StatusID === 3 ? "In Progress" : "Complete";

                    return (
                        <Box
                            className="container-btn"
                            sx={{
                                display: "flex",
                                gap: 0.8,
                                flexWrap: "wrap",
                            }}
                        >
                            {renderActionButtons(data, statusName)}
                        </Box>
                    );
                }
            },
        ];
    };

    // Mock user ID - ในระบบจริงควรได้จาก authentication
    const currentUserId = 6; // ตัวอย่าง User ID

    const fetchServiceAreaTasks = async () => {
        try {
            setLoading(true);

            // สร้าง options object สำหรับ API call
            const options: {
                month_year?: string;
                business_group_id?: number;
                page?: number;
                limit?: number;
            } = {};

            // เพิ่ม month_year filter ถ้ามีการเลือกวันที่
            if (selectedDate) {
                const month = selectedDate.month() + 1; // dayjs month() return 0-11
                const year = selectedDate.year();
                // เพิ่ม leading zero ให้กับเดือนถ้าจำเป็น
                const monthStr = month < 10 ? `0${month}` : `${month}`;
                options.month_year = `${monthStr}/${year}`;
            }

            // เพิ่ม business_group_id filter ถ้ามีการเลือก
            if (selectedBusinessGroup) {
                options.business_group_id = selectedBusinessGroup;
            }

            // เพิ่ม pagination
            options.page = page + 1; // API ใช้ 1-based, frontend ใช้ 0-based
            options.limit = limit;

            console.log("🔍 [DEBUG] Calling API with options:", options);
            const res = await GetServiceAreaTasksByUserID(currentUserId, options);
            console.log("🔍 [DEBUG] Raw API Response:", res);

            if (res && res.data) {
                console.log("🔍 [DEBUG] API data length:", res.data.length);
                console.log("🔍 [DEBUG] First item in data:", res.data[0]);
                console.log("🔍 [DEBUG] All ServiceAreaTaskIDs:", res.data.map((item: any) => item.ServiceAreaTaskID));
                console.log("🔍 [DEBUG] All RequestServiceAreaIDs:", res.data.map((item: any) => item.RequestServiceAreaID));

                // ตรวจสอบข้อมูลซ้ำ
                const taskIds = res.data.map((item: any) => item.ServiceAreaTaskID);
                const requestIds = res.data.map((item: any) => item.RequestServiceAreaID);
                const duplicateTaskIds = taskIds.filter((id: any, index: number) => taskIds.indexOf(id) !== index);
                const duplicateRequestIds = requestIds.filter((id: any, index: number) => requestIds.indexOf(id) !== index);

                console.log("🔍 [DEBUG] Duplicate ServiceAreaTaskIDs:", duplicateTaskIds);
                console.log("🔍 [DEBUG] Duplicate RequestServiceAreaIDs:", duplicateRequestIds);

                setRows(res.data);
                setTotal(res.total || res.data.length);
            }
        } catch (error) {
            console.error("Error fetching service area tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        (async () => {
            try {
                const bgs = await ListBusinessGroups();
                if (bgs) setBusinessGroups(bgs);
            } catch (error) {
                console.error("Error loading business groups:", error);
            }
        })();
    }, []);

    useEffect(() => {
        fetchServiceAreaTasks();
    }, [selectedDate, selectedBusinessGroup, page, limit]);

    const handleClearFilter = () => {
        setSelectedDate(null);
        setSearchText("");
        setSelectedBusinessGroup(null);
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const filteredRows = useMemo(() => {
        console.log("🔍 [DEBUG] filteredRows - Original rows:", rows);
        console.log("🔍 [DEBUG] filteredRows - Active tab:", activeTab);
        console.log("🔍 [DEBUG] filteredRows - Search text:", searchText);

        let filtered = rows;

        // กรองตาม Tab (StatusID)
        if (activeTab === 0) {
            // In Progress Tab - แสดงเฉพาะ StatusID = 3
            filtered = filtered.filter((r) => r.StatusID === 3);
            console.log("🔍 [DEBUG] filteredRows - After StatusID=3 filter:", filtered.length);
        } else {
            // Complete Tab - แสดงเฉพาะ StatusID = 4
            filtered = filtered.filter((r) => r.StatusID === 4);
            console.log("🔍 [DEBUG] filteredRows - After StatusID=4 filter:", filtered.length);
        }

        // กรองตาม search text
        if (!searchText) {
            console.log("🔍 [DEBUG] filteredRows - Final filtered (no search):", filtered.length);
            console.log("🔍 [DEBUG] filteredRows - Final ServiceAreaTaskIDs:", filtered.map((r: any) => r.ServiceAreaTaskID));
            return filtered;
        }
        const s = searchText.toLowerCase();
        const textFiltered = filtered.filter((r) => {
            const company = (r.CompanyName || "").toLowerCase();
            const requester = (r.UserNameCombined || "").toLowerCase();
            const businessGroup = (r.BusinessGroupName || "").toLowerCase();
            return company.includes(s) || requester.includes(s) || businessGroup.includes(s);
        });
        console.log("🔍 [DEBUG] filteredRows - Final filtered (with search):", textFiltered.length);
        console.log("🔍 [DEBUG] filteredRows - Final ServiceAreaTaskIDs:", textFiltered.map((r: any) => r.ServiceAreaTaskID));
        return textFiltered;
    }, [rows, searchText, activeTab]);

    return (
        <Box className="accept-work-document-page">
            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3}>
                    <Grid container size={{ xs: 12 }} sx={{ gap: 1 }} className="title-box">
                        <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                            Accept Work Document (Service Area)
                        </Typography>
                    </Grid>

                    <Card sx={{ width: "100%", borderRadius: 2 }}>
                        <Grid container sx={{ alignItems: "flex-end", p: 1.5 }} spacing={1}>
                            <Grid size={{ xs: 12, sm: 5 }}>
                                <TextField
                                    fullWidth
                                    className="search-box"
                                    variant="outlined"
                                    placeholder="Search by company, requester, or business group"
                                    margin="none"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start" sx={{ px: 0.5 }}>
                                                    <Search size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 5, sm: 3 }}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        views={["year", "month"]}
                                        format="MM/YYYY"
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
                                        sx={{ width: "100%" }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid size={{ xs: 5, sm: 3 }}>
                                <FormControl fullWidth>
                                    <Select
                                        value={selectedBusinessGroup || ""}
                                        onChange={(e) => setSelectedBusinessGroup(e.target.value ? Number(e.target.value) : null)}
                                        displayEmpty
                                        startAdornment={
                                            <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                                <Search size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
                                            </InputAdornment>
                                        }
                                    >
                                        <MenuItem value="">{"All Business Groups"}</MenuItem>
                                        {businessGroups.map((bg) => (
                                            <MenuItem key={bg.ID} value={bg.ID}>
                                                {bg.Name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 2, sm: 1 }}>
                                <Button
                                    onClick={handleClearFilter}
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
                                    <BrushCleaning size={20} style={{ color: "gray", minWidth: '20px', minHeight: '20px' }} />
                                </Button>
                            </Grid>
                        </Grid>
                    </Card>

                    {/* Tabs */}
                    <Grid container size={{ xs: 12, md: 12 }} spacing={2.2}>
                        <Grid size={{ xs: 12, md: 12 }}>
                            <Tabs
                                value={activeTab}
                                onChange={handleTabChange}
                                variant="scrollable"
                                allowScrollButtonsMobile
                            >
                                <Tab label="In Progress" />
                                <Tab label="Complete" />
                            </Tabs>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            {loading ? (
                                <Skeleton variant="rectangular" width="100%" height={220} sx={{ borderRadius: 2 }} />
                            ) : (
                                <CustomDataGrid
                                    rows={filteredRows}
                                    columns={getColumns()}
                                    rowCount={total}
                                    page={page}
                                    limit={limit}
                                    onPageChange={setPage}
                                    onLimitChange={setLimit}
                                    noDataText={`No ${activeTab === 0 ? 'in progress' : 'completed'} service requests found.`}
                                    getRowId={(row) => {
                                        // ใช้ ServiceAreaTaskID ถ้ามีค่า
                                        if (row.ServiceAreaTaskID && row.ServiceAreaTaskID > 0) {
                                            return String(row.ServiceAreaTaskID);
                                        }
                                        // Fallback: ใช้ RequestServiceAreaID
                                        if (row.RequestServiceAreaID && row.RequestServiceAreaID > 0) {
                                            return String(row.RequestServiceAreaID);
                                        }
                                        // ถ้าไม่มี ID เลย ให้ใช้ unique key
                                        return `service_area_${Date.now()}_${Math.random()}`;
                                    }}
                                />
                            )}
                        </Grid>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

export default AcceptWorkDocument;

