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
import { GetServiceAreaTasksByUserID, ListBusinessGroups, UpdateRequestServiceAreaStatus, RejectServiceAreaRequest } from "../../services/http";
import { useNavigate } from "react-router-dom";
import { Base64 } from "js-base64";
import { Search, BrushCleaning, HelpCircle } from "lucide-react";
import { CalendarMonth } from "@mui/icons-material";
import { BusinessGroupInterface } from "../../interfaces/IBusinessGroup";
import { businessGroupConfig } from "../../constants/businessGroupConfig";
import "./AcceptWorkDocument.css";
import { Tooltip } from "@mui/material";
import { Check, X, Send, Eye } from "lucide-react";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import SubmitServiceAreaPopup from "../../components/SubmitServiceAreaPopup/SubmitServiceAreaPopup";

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
    IsCancel: boolean; // แยกว่างานนี้เป็นงานสำหรับการร้องขอ (false) หรืองานยกเลิก (true)
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

    // State สำหรับ Reject Popup
    const [openRejectPopup, setOpenRejectPopup] = useState(false);
    const [selectedTaskForReject, setSelectedTaskForReject] = useState<any>(null);
    const [isRejecting, setIsRejecting] = useState(false);

    // State สำหรับ Submit Service Area Popup
    const [openSubmitPopup, setOpenSubmitPopup] = useState(false);
    const [selectedTaskForSubmit, setSelectedTaskForSubmit] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State สำหรับ Alerts
    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
    const navigate = useNavigate();

    // ฟังก์ชันสำหรับอัพเดทสถานะเป็น ID 6
    const updateStatusToComplete = async (requestServiceAreaID: number) => {
        try {
            await UpdateRequestServiceAreaStatus(requestServiceAreaID, 6);
            // Refresh data หลังจากอัพเดท
            fetchServiceAreaTasks();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    // ฟังก์ชันสำหรับเปิด Reject Popup
    const handleOpenRejectPopup = (task: any) => {
        setSelectedTaskForReject(task);
        setOpenRejectPopup(true);
    };

    // ฟังก์ชันสำหรับเปิด Submit Service Area Popup
    const handleOpenSubmitPopup = (task: any) => {
        setSelectedTaskForSubmit(task);
        setOpenSubmitPopup(true);
    };

    // ฟังก์ชันสำหรับ Reject Service Area
    const handleRejectServiceArea = async (note?: string) => {
        if (!selectedTaskForReject) return;

        try {
            setIsRejecting(true);
            const userID = Number(localStorage.getItem('userId')) || 0;
            const role = "Operator"; // ใน AcceptWorkDocument เป็น Operator เสมอ
            
            await RejectServiceAreaRequest(selectedTaskForReject.RequestServiceAreaID, userID, note || "", role);
            
            // Refresh data หลังจาก Reject
            fetchServiceAreaTasks();
            
            // ปิด Popup
            setOpenRejectPopup(false);
            setSelectedTaskForReject(null);
        } catch (error) {
            console.error("Error rejecting service area:", error);
        } finally {
            setIsRejecting(false);
        }
    };

    // ฟังก์ชันสำหรับ Submit Service Area
    const handleSubmitServiceArea = async (data: any) => {
        if (!selectedTaskForSubmit) return;

        try {
            setIsSubmitting(true);
            
            // อัพเดท status ID เป็น 6 (Complete) หลังจาก submit สำเร็จ
            const requestServiceAreaID = selectedTaskForSubmit.RequestServiceAreaID;
            if (requestServiceAreaID) {
                try {
                    await UpdateRequestServiceAreaStatus(requestServiceAreaID, 6);
                    console.log("Status updated to Complete (ID: 6) for RequestServiceAreaID:", requestServiceAreaID);
                } catch (error) {
                    console.error("Error updating status to Complete:", error);
                    throw error; // Throw error เพื่อให้ catch block จัดการ
                }
            }
            
            // Refresh data หลังจากอัพเดท status
            await fetchServiceAreaTasks();
            
            // ปิด Popup
            setOpenSubmitPopup(false);
            setSelectedTaskForSubmit(null);
            
            // แสดง success alert
            setAlerts(prev => [...prev, { 
                type: 'success', 
                message: `Service area task completed successfully! Status updated to Complete.` 
            }]);
            
            // Return success
            return { success: true, message: "Service area submitted successfully" };
        } catch (error) {
            console.error("Error submitting service area:", error);
            
            // แสดง error alert
            setAlerts(prev => [...prev, { 
                type: 'error', 
                message: `Failed to complete service area task: ${error instanceof Error ? error.message : 'Unknown error'}` 
            }]);
            
            throw error; // Re-throw error เพื่อให้ caller จัดการ
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderActionButtons = (data: any, statusName: string) => {
        const showSubmit = data.StatusID === 3 || data.StatusID === 4 || data.StatusID === 10; // Status ID 3, 4, และ 10 = แสดงปุ่ม Submit
        const showDetailsOnly = data.StatusID === 6; // Status ID 6 = Complete

        return (
            <>
                {showSubmit && (
                    <>
                        <Tooltip title={"Submit"}>
                            <Button
                                className="btn-submit"
                                variant="contained"
                                onClick={() => handleOpenSubmitPopup(data)}
                                disableRipple
                                disableFocusRipple
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
                                     handleOpenRejectPopup(data);
                                 }}
                                 disableRipple
                                 disableFocusRipple
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
                        onClick={async () => {
                            // Navigate to ServiceAreaDetails page with RequestServiceAreaID
                            const requestServiceAreaID = data.RequestServiceAreaID;
                            if (requestServiceAreaID) {
                                // ถ้า Status เป็น 3 ให้เปลี่ยนเป็น 4 ก่อน navigate
                                if (data.StatusID === 3) {
                                    try {
                                        await UpdateRequestServiceAreaStatus(requestServiceAreaID, 4);
                                        // Refresh data หลังจากอัพเดท
                                        fetchServiceAreaTasks();
                                    } catch (error) {
                                        console.error("Error updating status:", error);
                                    }
                                }
                                
                                // Encode the ID using Base64 (same as ServiceAreaDetails page expects)
                                const encodedId = Base64.encode(String(requestServiceAreaID));
                                navigate(`/service-area/service-area-details?service_area_id=${encodeURIComponent(encodedId)}`);
                            } else {
                                console.error("RequestServiceAreaID not found for task:", data.ServiceAreaTaskID);
                            }
                        }}
                        disableRipple
                        disableFocusRipple
                                                 sx={{
                             minWidth: "42px",
                             width: !showSubmit ? "100%" : "",
                         }}
                    >
                                                 <Eye size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                         {!showSubmit ? (
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
                    const statusName = data.StatusID === 3 ? "In Progress" : data.StatusID === 10 ? "Cancellation Assigned" : "Complete";

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

            const res = await GetServiceAreaTasksByUserID(currentUserId, options);

            if (res && res.data) {
                // ตรวจสอบข้อมูลซ้ำ
                const taskIds = res.data.map((item: any) => item.ServiceAreaTaskID);
                const requestIds = res.data.map((item: any) => item.RequestServiceAreaID);
                const duplicateTaskIds = taskIds.filter((id: any, index: number) => taskIds.indexOf(id) !== index);
                const duplicateRequestIds = requestIds.filter((id: any, index: number) => requestIds.indexOf(id) !== index);

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
        let filtered = rows;

        // กรองตาม Tab (StatusID)
        if (activeTab === 0) {
            // In Progress Tab - แสดงทั้ง StatusID = 3, 4, และ 10
            filtered = filtered.filter((r) => r.StatusID === 3 || r.StatusID === 4 || r.StatusID === 10);
        } else {
            // Complete Tab - แสดงเฉพาะ StatusID = 6
            filtered = filtered.filter((r) => r.StatusID === 6);
        }

        // กรองตาม search text
        if (!searchText) {
            return filtered;
        }
        const s = searchText.toLowerCase();
        const textFiltered = filtered.filter((r) => {
            const company = (r.CompanyName || "").toLowerCase();
            const requester = (r.UserNameCombined || "").toLowerCase();
            const businessGroup = (r.BusinessGroupName || "").toLowerCase();
            return company.includes(s) || requester.includes(s) || businessGroup.includes(s);
        });
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
                                     disableRipple
                                     disableFocusRipple
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

             {/* Reject Service Area Popup */}
             <ConfirmDialog
                 open={openRejectPopup}
                 setOpenConfirm={setOpenRejectPopup}
                 handleFunction={handleRejectServiceArea}
                 title="Reject Service Area Request"
                 message={`Are you sure you want to reject the service area request for ${selectedTaskForReject?.CompanyName || 'this company'}? Please provide a reason for rejection.`}
                 buttonActive={isRejecting}
                 showNoteField={true}
             />

                           {/* Submit Service Area Popup */}
              <SubmitServiceAreaPopup
                  open={openSubmitPopup}
                  onClose={() => setOpenSubmitPopup(false)}
                  onConfirm={handleSubmitServiceArea}
                  companyName={selectedTaskForSubmit?.CompanyName}
                  buttonActive={isSubmitting}
                  requestServiceAreaID={selectedTaskForSubmit?.RequestServiceAreaID || 0}
              />
         </Box>
     );
 }

export default AcceptWorkDocument;

