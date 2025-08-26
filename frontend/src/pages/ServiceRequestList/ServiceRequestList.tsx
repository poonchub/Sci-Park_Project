import React, { useState, useEffect } from "react";
import { Box, Container, Typography, Grid, Skeleton, useMediaQuery, Button, Divider, Tooltip } from "@mui/material";
import { ClipboardList, Check, Eye, X, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Base64 } from "js-base64";
import theme from "../../styles/Theme";
import { statusConfig } from "../../constants/statusConfig";
import { ListRequestServiceAreas, GetRequestStatuses, ListBusinessGroups, UpdateRequestServiceAreaStatus, GetUserById } from "../../services/http";
import { RequestServiceAreaListInterface } from "../../interfaces/IRequestServiceArea";
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses";
import { BusinessGroupInterface } from "../../interfaces/IBusinessGroup";
import { UserInterface } from "../../interfaces/IUser";
import FilterSection from "../../components/FilterSection/FilterSection";
import CustomDataGrid from "../../components/CustomDataGrid/CustomDataGrid";
import { GridColDef } from "@mui/x-data-grid";
import dayjs, { Dayjs } from "dayjs";
import RequestStatusCards from "../../components/RequestStatusCards/RequestStatusCards";
import { businessGroupConfig } from "../../constants/businessGroupConfig";
import "./ServiceRequestList.css";
import ApproveServiceAreaController from "../../components/ApproveServiceAreaPopup/ApproveServiceAreaController";

const ServiceRequestList: React.FC = () => {
    const navigate = useNavigate();
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [requestServiceAreas, setRequestServiceAreas] = useState<RequestServiceAreaListInterface[]>([]);
    const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([]);
    const [businessGroups, setBusinessGroups] = useState<BusinessGroupInterface[]>([]);
    const [user, setUser] = useState<UserInterface>();
    const [openApprovePopup, setOpenApprovePopup] = useState(false);
    const [requestIdPendingApprove, setRequestIdPendingApprove] = useState<number | null>(null);
    const [businessGroupIdPending, setBusinessGroupIdPending] = useState<number | null>(null);
    
    // Search and filter states
    const [searchText, setSearchText] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState<number[]>([0]);
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
    
    // Pagination states
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(20);
    // const [total, setTotal] = useState(0); // reserved for server-side pagination (unused)
    
    // Status counts from API
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
        "Pending": 0,
        "Approved": 0,
        "In Progress": 0,
        "Completed": 0,
        "Unsuccessful": 0
    });

    // Using statusConfig from constants for Service Request List (5 statuses)
    const serviceRequestStatusConfig = {
        "Pending": statusConfig["Pending"],
        "Approved": statusConfig["Approved"],
        "In Progress": statusConfig["In Progress"],
        "Completed": statusConfig["Completed"],
        "Unsuccessful": statusConfig["Unsuccessful"]
    };

    // 6 statuses for Service Request List (same as All Maintenance except "Waiting For Review")
    // const displayStatuses = ["Pending", "Approved", "In Progress", "Completed", "Unsuccessful"];

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

    // Define table columns
    const getColumns = (): GridColDef[] => {
        if (isSmallScreen) {
            return [
                {
                    field: "Service Request List",
                    headerName: "Service Request List",
                    flex: 1,
                    renderCell: (params) => {
                        const data = params.row;
                        const statusID = params.row.StatusID;
                        const status = requestStatuses.find(s => s.ID === statusID);
                        const statusName = status?.Name || 'Unknown';
                        
                        const statusConfig = serviceRequestStatusConfig[statusName as keyof typeof serviceRequestStatusConfig];
                        
                        const statusColor = statusConfig?.color || "#000";
                        const statusColorLite = statusConfig?.colorLite || "#000";
                        const StatusIcon = statusConfig?.icon || HelpCircle;

                        const dateTime = `${dayjs(params.row.CreatedAt).format('DD/MM/YYYY')} ${dayjs(params.row.CreatedAt).format('hh:mm A')}`;
                        const companyName = params.row.CompanyName || '-';
                        const businessGroupId = params.row.BusinessGroupID ?? 'N/A';
                        const requesterName = params.row.UserNameCombined;

                        // const cardItem = document.querySelector(".card-item-container") as HTMLElement;

                        return (
                            <Grid container size={{ xs: 12 }} sx={{ px: 1 }} className="card-item-container" rowSpacing={1}>
                                <Grid size={{ xs: 12, sm: 7 }}>
                                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: "5px", width: "100%" }}>
                                        <Typography
                                            sx={{
                                                fontSize: 16,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                maxWidth: "100%",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {companyName}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.4, my: 0.8 }}>
                                        {/* Find business group by ID */}
                                        {(() => {
                                            const businessGroup = businessGroups.find(bg => bg.ID === businessGroupId);
                                            const businessGroupName = businessGroup?.Name || 'Unknown';
                                            
                                            const groupConfig = businessGroupConfig[businessGroupName] || {
                                                color: "#000",
                                                colorLite: "#000",
                                                icon: HelpCircle
                                            };
                                            const GroupIcon = groupConfig.icon;
                                            
                                            return (
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                                                            fontSize: 13,
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
                                            );
                                        })()}
                                    </Box>
                                    <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.4, my: 0.8 }}>
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
                                    <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.4, my: 1 }}>
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
                                </Grid>

                                <Grid size={{ xs: 12, sm: 5 }} container direction="column">
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
                                        {StatusIcon && React.createElement(StatusIcon, {
                                            size: 18,
                                            style: { minWidth: "18px", minHeight: "18px" }
                                        })}
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
                                         <Grid container spacing={0.8} size={{ xs: 12 }}>
                                             <Grid size={{ xs: 12 }}>
                                                 {(() => {
                                                     const showButtonApprove = statusID === 2; // StatusID 2 = Pending
                                                     return (
                                                         <Box
                                                             className="container-btn"
                                                             sx={{
                                                                 display: "flex",
                                                                 gap: 0.8,
                                                                 flexWrap: "wrap",
                                                                 alignItems: "center",
                                                                 width: "100%"
                                                             }}
                                                         >
                                                             {showButtonApprove ? (
                                                                 <>
                                                                     <Tooltip title={"Approve"}>
                                                                         <Button
                                                                             className="btn-approve"
                                                                             variant="contained"
                                                                             onClick={() => {
                                                                                 handleApproveReject(data.ID, 'approve', data.BusinessGroupID);
                                                                             }}
                                                                             sx={{
                                                                                 minWidth: "42px",
                                                                             }}
                                                                         >
                                                                             <Check size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
                                                                             <Typography variant="textButtonClassic" className="text-btn">
                                                                                 Approve
                                                                             </Typography>
                                                                         </Button>
                                                                     </Tooltip>
                                                                     <Tooltip title={"Reject"}>
                                                                         <Button
                                                                             className="btn-reject"
                                                                             variant="outlinedCancel"
                                                                             onClick={() => {
                                                                                 handleApproveReject(data.ID, 'reject', data.BusinessGroupID);
                                                                             }}
                                                                             sx={{
                                                                                 minWidth: "42px",
                                                                             }}
                                                                         >
                                                                             <X size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
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
                                                                                 const encodedId = Base64.encode(data.ID.toString());
                                                                                 navigate(`/service-area/details?service_area_id=${encodeURIComponent(encodedId)}`);
                                                                             }}
                                                                             sx={{
                                                                                 minWidth: "42px",
                                                                             }}
                                                                         >
                                                                             <Eye size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
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
                                                                             const encodedId = Base64.encode(data.ID.toString());
                                                                             navigate(`/service-area/details?service_area_id=${encodeURIComponent(encodedId)}`);
                                                                         }}
                                                                         sx={{
                                                                             minWidth: "42px",
                                                                         }}
                                                                     >
                                                                         <Eye size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
                                                                         <Typography variant="textButtonClassic" className="text-btn">
                                                                             Details
                                                                         </Typography>
                                                                     </Button>
                                                                 </Tooltip>
                                                             )}
                                                         </Box>
                                                     );
                                                 })()}
                                             </Grid>
                                         </Grid>
                                     </Box>
                                 </Grid>
                            </Grid>
                        );
                    },
                },
            ];
        }

        return [
            {
                field: 'ID',
                headerName: 'No.',
                flex: 0.5,
                align: "center",
                headerAlign: "center",
                renderCell: (params) => (
                    <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: "100%", gap: "5px" }}>
                        <Typography sx={{ fontSize: 14 }}>
                            {params.value}
                        </Typography>
                    </Box>
                ),
            },
            {
                field: 'Company',
                headerName: 'Company',
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
                field: 'CreatedAt',
                headerName: 'Date Submitted',
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
                field: 'StatusID',
                headerName: 'Status',
                type: "string",
                flex: 1,
                renderCell: (params) => {
                    const status = requestStatuses.find(s => s.ID === params.value);
                    const statusName = status?.Name || 'Unknown';
                    
                    const statusConfig = serviceRequestStatusConfig[statusName as keyof typeof serviceRequestStatusConfig];
                    
                    // const statusColor = statusConfig?.color || "#000";
                    // const statusColorLite = statusConfig?.colorLite || "#000";
                    const StatusIcon = statusConfig?.icon || HelpCircle;
                    
                    if (!statusConfig) {
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
                                        color: "text.secondary",
                                    }}
                                >
                                    {statusName}
                                </Typography>
                            </Box>
                        );
                    }

                    return (
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                height: "100%",
                            }}
                        >
                            <Box
                                sx={{
                                    bgcolor: statusConfig.colorLite,
                                    borderRadius: 10,
                                    px: 1.5,
                                    py: 0.5,
                                    display: "flex",
                                    gap: 1,
                                    color: statusConfig.color,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "100%",
                                }}
                            >
                                                                 {StatusIcon && React.createElement(StatusIcon, {
                                                                     size: 18,
                                                                     style: { minWidth: "18px", minHeight: "18px" }
                                                                 })}
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
                            </Box>
                        </Box>
                    );
                },
            },
            {
                field: 'UserNameCombined',
                headerName: 'Requester',
                description: "This column has a value getter and is not sortable.",
                sortable: false,
                flex: 1.2,
                renderCell: (params) => (
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
                            {params.value}
                        </Typography>
                    </Box>
                ),
            },
                         {
                 field: 'Actions',
                 headerName: 'Actions',
                 type: "string",
                 flex: 1.5,
                 renderCell: (item) => {
                     const data = item.row;
                     const showButtonApprove = item.row.StatusID === 2; // StatusID 2 = Pending
                     return (
                         <Box
                             className="container-btn"
                             sx={{
                                 display: "flex",
                                 gap: 0.8,
                                 flexWrap: "wrap",
                                 alignItems: "center",
                                 height: '100%'
                             }}
                         >
                             {showButtonApprove ? (
                                 <>
                                     <Tooltip title={"Approve"}>
                                         <Button
                                             className="btn-approve"
                                             variant="contained"
                                             onClick={() => {
                                                 handleApproveReject(data.ID, 'approve', data.BusinessGroupID);
                                             }}
                                             sx={{
                                                 minWidth: "42px",
                                             }}
                                         >
                                             <Check size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
                                             <Typography variant="textButtonClassic" className="text-btn">
                                                 Approve
                                             </Typography>
                                         </Button>
                                     </Tooltip>
                                     <Tooltip title={"Reject"}>
                                         <Button
                                             className="btn-reject"
                                             variant="outlinedCancel"
                                             onClick={() => {
                                                 handleApproveReject(data.ID, 'reject', data.BusinessGroupID);
                                             }}
                                             sx={{
                                                 minWidth: "42px",
                                             }}
                                         >
                                             <X size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
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
                                                 const encodedId = Base64.encode(data.ID.toString());
                                                 navigate(`/service-area/details?service_area_id=${encodeURIComponent(encodedId)}`);
                                             }}
                                             sx={{
                                                 minWidth: "42px",
                                             }}
                                         >
                                             <Eye size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
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
                                             const encodedId = Base64.encode(data.ID.toString());
                                             navigate(`/service-area/details?service_area_id=${encodeURIComponent(encodedId)}`);
                                         }}
                                         sx={{
                                             minWidth: "42px",
                                         }}
                                     >
                                         <Eye size={18} style={{ minWidth: "18px", minHeight: "18px" }}/>
                                         <Typography variant="textButtonClassic" className="text-btn">
                                             Details
                                         </Typography>
                                     </Button>
                                 </Tooltip>
                             )}
                         </Box>
                     );
                 },
             },
        ];
    };

    // Fetch user
    const fetchUser = async () => {
        try {
            const res = await GetUserById(Number(localStorage.getItem("userId")));
            if (res) {
                setUser(res);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    };

    // Fetch request statuses
    const fetchRequestStatuses = async () => {
        try {
            const res = await GetRequestStatuses();
            
            if (res) {
                // Filter to only include the 5 statuses used for Service Request List
                const serviceRequestStatusNames = ["Pending", "Approved", "In Progress", "Completed", "Unsuccessful"];
                const filteredStatuses = res.filter((status: RequestStatusesInterface) => 
                    serviceRequestStatusNames.includes(status.Name || '')
                );
                setRequestStatuses(filteredStatuses);
            }
        } catch (error) {
            console.error("Error fetching request statuses:", error);
        }
    };

    // Fetch business groups
    const fetchBusinessGroups = async () => {
        try {
            const res = await ListBusinessGroups();
            
            if (res) {
                setBusinessGroups(res);
            }
        } catch (error) {
            console.error("Error fetching business groups:", error);
        }
    };

    // Fetch service request areas
    const fetchServiceRequestAreas = async (
        requestStatusID: string = "0",
        page: number = 0,
        limit: number = 20,
        search?: string,
        createdAt?: string
    ) => {
        try {
            
            // สร้าง URL parameters ที่มีเฉพาะค่าที่ไม่ใช่ 0, undefined, หรือ empty
            const params = new URLSearchParams();
            
            // เพิ่ม page และ limit เสมอ
            params.append("page", (page + 1).toString()); // API ใช้ 1-based pagination
            params.append("limit", limit.toString());
            
            // เพิ่ม request_status_id เฉพาะเมื่อไม่ใช่ "0"
            if (requestStatusID && requestStatusID !== "0" && requestStatusID !== "undefined") {
                params.append("request_status_id", requestStatusID);
            }
            
            // เพิ่ม search เฉพาะเมื่อมีข้อความและไม่ใช่ "undefined"
            if (search && search.trim() !== "" && search !== "undefined") {
                params.append("search", search.trim());
            }
            
            // เพิ่ม created_at เฉพาะเมื่อมีค่าและไม่ใช่ "undefined"
            if (createdAt && createdAt.trim() !== "" && createdAt !== "undefined") {
                params.append("created_at", createdAt.trim());
            }
            
            setIsLoadingData(true);
            const res = await ListRequestServiceAreas(
                requestStatusID,
                page + 1,
                limit,
                search && search.trim() !== "" && search !== "undefined" ? search.trim() : undefined,
                createdAt && createdAt.trim() !== "" && createdAt !== "undefined" ? createdAt.trim() : undefined
            );
            
            // Always set the data, even if it's null or empty
            if (res) {
                
                // Set data to empty array if null, otherwise use the data
                setRequestServiceAreas(res.data || []);
                
                // Calculate status counts
                const counts: Record<string, number> = {
                    "Pending": 0,
                    "Approved": 0,
                    "In Progress": 0,
                    "Completed": 0,
                    "Unsuccessful": 0
                };
                
                // Count by status ID based on actual database status IDs
                if (res.data && Array.isArray(res.data)) {
                    res.data.forEach((item: any) => {
                        const statusID = item.StatusID;
                        // Map status ID to status name based on actual database
                        // From the RequestStatuses table: 1=Created, 2=Pending, 3=Approved, 4=In Progress, 5=Waiting For Review, 6=Completed, 7=Rework Requested, 8=Unsuccessful
                        let statusName = "Unknown";
                        if (statusID === 1) statusName = "Created";
                        else if (statusID === 2) statusName = "Pending";
                        else if (statusID === 3) statusName = "Approved";
                        else if (statusID === 4) statusName = "In Progress";
                        else if (statusID === 6) statusName = "Completed";
                        else if (statusID === 8) statusName = "Unsuccessful";
                        
                        // Only count statuses that are in our display list
                        if (counts.hasOwnProperty(statusName)) {
                            counts[statusName]++;
                        }
                    });
                }
                
                setStatusCounts(counts);
            }
        } catch (error) {
            console.error("Error fetching service request areas:", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    // Handle clear filter
    const handleClearFilter = () => {
        setSearchText("");
        setSelectedStatuses([0]); // Reset to "All" status
        setSelectedDate(dayjs()); // Reset to current date
        setPage(0);
    };



    // Initial data fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                await Promise.all([
                    fetchUser(),
                    fetchRequestStatuses(),
                    fetchBusinessGroups(),
                ]);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchInitialData();
    }, []);

    // (moved fetching of document operators into controller component)

    // Load initial data after user and requestStatuses are ready
    useEffect(() => {
        if (user && requestStatuses) {
            fetchServiceRequestAreas("0", 0, 20, undefined, undefined);
        }
    }, [user, requestStatuses]);

    // Handle approve/reject actions
    const handleApproveReject = async (requestID: number, action: 'approve' | 'reject', businessGroupID?: number | null) => {
        try {
            setIsLoadingData(true);
            
            if (action === 'approve') {
                // Instead of immediate approve, open popup to select Document Operator
                setRequestIdPendingApprove(requestID);
                setBusinessGroupIdPending(businessGroupID ?? null);
                setOpenApprovePopup(true);
                setIsLoadingData(false);
                return;
            } else {
                const statusID = 8; // Unsuccessful
                await UpdateRequestServiceAreaStatus(requestID, statusID);
            }
            
            // Refresh the data
            await fetchServiceRequestAreas(
                selectedStatuses.join(','),
                page,
                limit,
                searchText || undefined,
                selectedDate ? selectedDate.format('YYYY-MM') : undefined
            );
            
        } catch (error) {
            console.error(`Error ${action === 'approve' ? 'approving' : 'rejecting'} request:`, error);
            // You might want to show a toast notification here
        } finally {
            setIsLoadingData(false);
        }
    };

    // Handle filter changes (status and date)
    useEffect(() => {
        if (user && requestStatuses) {
            fetchServiceRequestAreas(
                selectedStatuses[0] === 0 ? "0" : selectedStatuses[0].toString(),
                0, // Reset to page 0 when filters change
                limit,
                undefined,
                selectedDate ? selectedDate.format("YYYY-MM") : undefined
            );
        }
    }, [selectedStatuses, selectedDate]);

    // Handle pagination changes
    useEffect(() => {
        if (user && requestStatuses) {
            fetchServiceRequestAreas(
                selectedStatuses[0] === 0 ? "0" : selectedStatuses[0].toString(),
                page,
                limit,
                searchText || undefined,
                selectedDate ? selectedDate.format("YYYY-MM") : undefined
            );
        }
    }, [page, limit]);

    // Filter data in frontend based on search text
    const filteredServiceRequests = requestServiceAreas.filter((request) => {
        if (!searchText) return true;
        
        const searchLower = searchText.toLowerCase();
        const companyName = request.CompanyName?.toLowerCase() || "";
        const userName = request.UserNameCombined?.toLowerCase() || "";
        const requestId = request.ID?.toString() || "";
        
        return (
            companyName.includes(searchLower) ||
            userName.includes(searchLower) ||
            requestId.includes(searchText)
        );
    });

    // Remove statusCards mapping since we'll use RequestStatusCards component

    return (
        <Box className="service-request-list-page">
            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3}>
                    {/* Header Section */}
                    <Grid 
                        container 
                        className="title-box" 
                        direction={'row'} 
                        size={{ xs: 5, sm: 5 }}
                        sx={{ gap: 1 }}
                    >
                        <ClipboardList size={26} />
                        <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                            Service Area Request List
                        </Typography>
                    </Grid>

                    {!isLoadingData && statusCounts ? (
                        <>
                            <Grid container size={{ md: 12, lg: 12 }} spacing={3}>
                                {/* Status Section - Custom for Service Request List (5 statuses only) */}
                                <RequestStatusCards 
                                    statusCounts={statusCounts || {}} 
                                    size={{
                                        xs: 12,
                                        sm: 6,
                                        md: 6,
                                        md1000: 4,
                                        lg: 4,
                                        xl: 4,
                                    }}
                                    customDisplayStatuses={["Pending", "Approved", "In Progress", "Completed", "Unsuccessful"]}
                                />

                                {/* Filter Section */}
                                <FilterSection
                                    searchText={searchText}
                                    setSearchText={setSearchText}
                                    selectedDate={selectedDate}
                                    setSelectedDate={setSelectedDate}
                                    selectedStatuses={selectedStatuses}
                                    setSelectedStatuses={setSelectedStatuses}
                                    handleClearFilter={handleClearFilter}
                                    requestStatuses={requestStatuses}
                                />
                            </Grid>
                        </>
                    ) : (
                        <Skeleton variant="rectangular" width="100%" height={320} sx={{ borderRadius: 2 }} />
                    )}
                    
                    {/* Data Table Section */}
                    <Grid size={{ xs: 12, md: 12 }} minHeight={'200px'}>
                        {!isLoadingData && statusCounts ? (
                            <CustomDataGrid
                                rows={filteredServiceRequests}
                                columns={getColumns()}
                                rowCount={filteredServiceRequests.length}
                                page={page}
                                limit={limit}
                                onPageChange={setPage}
                                onLimitChange={setLimit}
                                noDataText="Service request information not found."
                            />
                        ) : (
                            <Skeleton variant="rectangular" width="100%" height={220} sx={{ borderRadius: 2 }} />
                        )}
                    </Grid>
                </Grid>
                {/* Approve Service Area Controller */}
                <ApproveServiceAreaController
                    open={openApprovePopup}
                    onClose={() => { setOpenApprovePopup(false); setRequestIdPendingApprove(null); setBusinessGroupIdPending(null); }}
                    requestId={requestIdPendingApprove}
                    businessGroupId={businessGroupIdPending}
                    businessGroups={businessGroups}
                    companyName={(() => {
                        const current = requestServiceAreas.find(r => r.ID === requestIdPendingApprove);
                        return current?.CompanyName;
                    })()}
                    onApproved={async () => {
                        await fetchServiceRequestAreas(
                            selectedStatuses.join(','),
                            page,
                            limit,
                            searchText || undefined,
                            selectedDate ? selectedDate.format('YYYY-MM') : undefined
                        );
                    }}
                />
            </Container>
        </Box>
    );
};

export default ServiceRequestList;
