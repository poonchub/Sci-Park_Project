import React, { useState, useEffect } from "react";
import { Box, Container, Typography, Grid, Card, CardContent, Skeleton, useMediaQuery, Button, Divider, Tooltip } from "@mui/material";
import { ClipboardList, Check, Eye, X } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import theme from "../../styles/Theme";
import { statusConfig } from "../../constants/statusConfig";
import { ListRequestServiceAreas, GetRequestStatuses, ListBusinessGroups } from "../../services/http";
import { RequestServiceAreaInterface, RequestServiceAreaListInterface } from "../../interfaces/IRequestServiceArea";
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses";
import { BusinessGroupInterface } from "../../interfaces/IBusinessGroup";
import FilterSection from "../../components/FilterSection/FilterSection";
import CustomDataGrid from "../../components/CustomDataGrid/CustomDataGrid";
import { GridColDef } from "@mui/x-data-grid";
import dayjs, { Dayjs } from "dayjs";
import RequestStatusCards from "../../components/RequestStatusCards/RequestStatusCards";
import { businessGroupConfig } from "../../constants/businessGroupConfig";
import "./ServiceRequestList.css";

const ServiceRequestList: React.FC = () => {
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [requestServiceAreas, setRequestServiceAreas] = useState<RequestServiceAreaListInterface[]>([]);
    const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([]);
    const [businessGroups, setBusinessGroups] = useState<BusinessGroupInterface[]>([]);
    
    // Search and filter states
    const [searchText, setSearchText] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState<number[]>([0]);
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
    
    // Pagination states
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(0);
    
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
    const displayStatuses = ["Pending", "Approved", "In Progress", "Completed", "Unsuccessful"];

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
                        const StatusIcon = statusConfig?.icon || faQuestionCircle;

                        const dateTime = `${dayjs(params.row.CreatedAt).format('DD/MM/YYYY')} ${dayjs(params.row.CreatedAt).format('hh:mm A')}`;
                        const companyName = params.row.CompanyName || '-';
                        const businessGroupId = params.row.BusinessGroupID ?? 'N/A';
                        const requesterName = params.row.UserNameCombined;

                        const cardItem = document.querySelector(".card-item-container") as HTMLElement;
                        let width;
                        if (cardItem) {
                            width = cardItem.offsetWidth;
                        }

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
                                                icon: faQuestionCircle
                                            };
                                            const GroupIcon = groupConfig.icon;
                                            
                                            return (
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <GroupIcon 
                                                        size={16} 
                                                        style={{ 
                                                            color: groupConfig.color,
                                                            minWidth: "16px", 
                                                            minHeight: "16px" 
                                                        }} 
                                                    />
                                                    <Typography
                                                        sx={{
                                                            fontSize: 13,
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
                                        <StatusIcon size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
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
                                                                                 // TODO: Implement approve functionality
                                                                                 console.log("Approve clicked for:", data);
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
                                                                                 // TODO: Implement reject functionality
                                                                                 console.log("Reject clicked for:", data);
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
                                                                                 // TODO: Implement details functionality
                                                                                 console.log("Details clicked for:", data);
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
                                                                             // TODO: Implement details functionality
                                                                             console.log("Details clicked for:", data);
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
                        icon: faQuestionCircle
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
                                <GroupIcon 
                                    size={16} 
                                    style={{ 
                                        color: groupConfig.color,
                                        minWidth: "16px", 
                                        minHeight: "16px" 
                                    }} 
                                />
                                <Typography
                                    sx={{
                                        fontSize: 12,
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
                     const StatusIcon = statusConfig?.icon || faQuestionCircle;
                    
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
                                                                 <StatusIcon size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
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
                                                 // TODO: Implement approve functionality
                                                 console.log("Approve clicked for:", data);
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
                                                 // TODO: Implement reject functionality
                                                 console.log("Reject clicked for:", data);
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
                                                 // TODO: Implement details functionality
                                                 console.log("Details clicked for:", data);
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
                                             // TODO: Implement details functionality
                                             console.log("Details clicked for:", data);
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

    // Fetch request statuses
    const fetchRequestStatuses = async () => {
        try {
            console.log("📋 [DEBUG] Fetching request statuses...");
            const res = await GetRequestStatuses();
            
            if (res) {
                setRequestStatuses(res);
                
            }
        } catch (error) {
            console.error("🚨 [DEBUG] Error fetching request statuses:", error);
        }
    };

    // Fetch business groups
    const fetchBusinessGroups = async () => {
        try {
            console.log("📋 [DEBUG] Fetching business groups...");
            const res = await ListBusinessGroups();
            
            if (res) {
                setBusinessGroups(res);
                console.log("✅ [DEBUG] Business groups loaded:", res);
            }
        } catch (error) {
            console.error("🚨 [DEBUG] Error fetching business groups:", error);
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
            console.log("🔍 [DEBUG] fetchServiceRequestAreas called with params:", {
                requestStatusID,
                page,
                limit,
                search,
                createdAt
            });
            
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
            
            console.log("📤 [DEBUG] Final URL parameters:", params.toString());
            
            setIsLoadingData(true);
            const res = await ListRequestServiceAreas(
                requestStatusID,
                page + 1,
                limit,
                search && search.trim() !== "" && search !== "undefined" ? search.trim() : undefined,
                createdAt && createdAt.trim() !== "" && createdAt !== "undefined" ? createdAt.trim() : undefined
            );
            
            console.log("📡 [DEBUG] API Response:", res);
            
            if (res && res.data) {
                console.log("✅ [DEBUG] Setting data:", {
                    dataLength: res.data.length,
                    total: res.total,
                    data: res.data
                });
                
                setRequestServiceAreas(res.data);
                setTotal(res.total || 0);
                
                // Calculate status counts
                const counts: Record<string, number> = {
                    "Pending": 0,
                    "Approved": 0,
                    "In Progress": 0,
                    "Completed": 0,
                    "Unsuccessful": 0
                };
                
                                 // Count by status ID based on actual database status IDs
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
                
                console.log("📊 [DEBUG] Calculated status counts:", counts);
                setStatusCounts(counts);
            }
        } catch (error) {
            console.error("🚨 [DEBUG] Error fetching service request areas:", error);
        } finally {
            setIsLoadingData(false);
            
        }
    };

    // Handle clear filter
    const handleClearFilter = () => {
        console.log("🧹 [DEBUG] Clearing all filters");
        setSearchText("");
        setSelectedStatuses([0]); // Reset to "All" status
        setSelectedDate(dayjs()); // Reset to current date
        setPage(0);
        
        // เรียก API ใหม่หลังจาก clear filter - ส่งเฉพาะ page และ limit
        fetchServiceRequestAreas("0", 0, limit, undefined, undefined);
        
        console.log("✅ [DEBUG] Filters cleared and API called");
    };

    // Handle search and filter
    const handleSearchAndFilter = () => {
        // แปลง selectedStatuses เป็น request_status_id
        // selectedStatuses[0] === 0 หมายถึง "All" ให้ส่ง "0"
        const statusID = selectedStatuses[0] === 0 ? "0" : selectedStatuses[0].toString();
        
        // แปลงวันที่เป็นรูปแบบ YYYY-MM สำหรับการค้นหาเฉพาะเดือน
        let dateStr = "";
        if (selectedDate) {
            // ใช้รูปแบบ YYYY-MM เพื่อค้นหาเฉพาะเดือน (เช่น 2025-08)
            dateStr = selectedDate.format("YYYY-MM");
        }
        
        // ตรวจสอบว่า searchText ไม่ใช่ empty string หรือ "undefined"
        const searchParam = searchText.trim() !== "" && searchText.trim() !== "undefined" ? searchText.trim() : undefined;
        
        console.log("🔍 [DEBUG] handleSearchAndFilter called with:", {
            statusID,
            dateStr,
            searchText: searchParam,
            limit,
            selectedStatuses,
            selectedDate: selectedDate?.format("YYYY-MM-DD")
        });
        
        // ส่งเฉพาะ parameters ที่มีค่า
        fetchServiceRequestAreas(
            statusID,
            0, // Reset to first page when searching
            limit,
            searchParam,
            dateStr || undefined
        );
        setPage(0); // Reset page to 0
        
        console.log("✅ [DEBUG] Search and filter applied");
    };

    // Initial data fetch
    useEffect(() => {
        
        fetchRequestStatuses();
        fetchBusinessGroups();
        // เรียก API ครั้งแรกโดยไม่ใช้ filter ใดๆ
        fetchServiceRequestAreas("0", 0, 20, undefined, undefined);
    }, []);

    // Handle search and filter changes
    useEffect(() => {
        
        handleSearchAndFilter();
    }, [page, limit]);

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
                                rows={requestServiceAreas}
                                columns={getColumns()}
                                rowCount={total}
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
            </Container>
        </Box>
    );
};

export default ServiceRequestList;
