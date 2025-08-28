import React, { useEffect, useState } from "react";
import { Box, Card, Container, Grid, Skeleton, Typography, useMediaQuery, InputAdornment, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { DatePicker } from "../../components/DatePicker/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TextField } from "../../components/TextField/TextField";
import dayjs, { Dayjs } from "dayjs";
import { GridColDef } from "@mui/x-data-grid";
import CustomDataGrid from "../../components/CustomDataGrid/CustomDataGrid";
import theme from "../../styles/Theme";
import { GetServiceAreaTasksByUserID, ListBusinessGroups } from "../../services/http";
import { BusinessGroupInterface } from "../../interfaces/IBusinessGroup";
import { Search } from "lucide-react";

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

function SubmitWork() {
    const [searchText, setSearchText] = useState("");
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
    const [selectedBusinessGroup, setSelectedBusinessGroup] = useState<number | null>(null);
    
    const [rows, setRows] = useState<ServiceAreaTaskInterface[]>([]);
    const [businessGroups, setBusinessGroups] = useState<BusinessGroupInterface[]>([]);
    
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

    // Mock user ID - ในระบบจริงควรได้จาก authentication
    const currentUserId = 6; // ตัวอย่าง User ID

    const getColumns = (): GridColDef[] => {
        return [
            { field: "ServiceAreaTaskID", headerName: "Task ID", flex: 0.8, align: "center", headerAlign: "center" },
            { field: "RequestServiceAreaID", headerName: "Request ID", flex: 0.8, align: "center", headerAlign: "center" },
            { field: "CompanyName", headerName: "Company", flex: 1.5 },
            { field: "BusinessGroupName", headerName: "Business Group", flex: 1.2 },
            { field: "UserNameCombined", headerName: "Requester", flex: 1.2 },
            { 
                field: "CreatedAt", 
                headerName: "Created Date", 
                flex: 1.2,
                valueFormatter: (params) => {
                    return new Date(params.value).toLocaleDateString('th-TH');
                }
            },
            { 
                field: "StatusID", 
                headerName: "Status", 
                flex: 0.8,
                align: "center",
                headerAlign: "center",
                renderCell: (params) => {
                    const status = params.value === 3 ? "In Progress" : "Completed";
                    const color = params.value === 3 ? "#1976d2" : "#2e7d32";
                    return (
                        <Typography sx={{ color, fontWeight: 600 }}>
                            {status}
                        </Typography>
                    );
                }
            },
        ];
    };

    const fetchTasks = async () => {
        try {
            setLoading(true);
            
            // สร้าง options object สำหรับ API call
            const options: {
                month_year?: string;
                business_group_id?: number;
            } = {};
            
            // เพิ่ม month_year filter ถ้ามีการเลือกวันที่
            if (selectedDate) {
                const month = selectedDate.month() + 1; // dayjs month() return 0-11
                const year = selectedDate.year();
                options.month_year = `${month}/${year}`;
            }
            
            // เพิ่ม business_group_id filter ถ้ามีการเลือก
            if (selectedBusinessGroup) {
                options.business_group_id = selectedBusinessGroup;
            }
            
            const res = await GetServiceAreaTasksByUserID(currentUserId, options);
            if (res && res.data) {
                setRows(res.data);
                setTotal(res.data.length);
            }
        } catch (error) {
            console.error("Error fetching service area tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // โหลด business groups
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
        fetchTasks();
    }, [selectedDate, selectedBusinessGroup]);

    const filteredRows = React.useMemo(() => {
        if (!searchText) return rows;
        const s = searchText.toLowerCase();
        return rows.filter((r) => {
            const company = (r.CompanyName || "").toLowerCase();
            const requester = (r.UserNameCombined || "").toLowerCase();
            const businessGroup = (r.BusinessGroupName || "").toLowerCase();
            return company.includes(s) || requester.includes(s) || businessGroup.includes(s);
        });
    }, [rows, searchText]);

    return (
        <Box className="submit-work-page">
            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3}>
                    <Grid container size={{ xs: 12 }} sx={{ gap: 1 }} className="title-box">
                        <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                            Submit Work (Service Area Tasks)
                        </Typography>
                    </Grid>

                    <Card sx={{ width: "100%", borderRadius: 2 }}>
                        <Grid container sx={{ alignItems: "flex-end", p: 1.5 }} spacing={1}>
                            <Grid size={{ xs: 12, sm: 4 }}>
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
                                                    <Search size={20} style={{ minWidth: '20px', minHeight: '20px' }}/>
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        views={["year", "month"]}
                                        label="Filter by Month/Year"
                                        value={selectedDate}
                                        onChange={setSelectedDate}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Business Group</InputLabel>
                                    <Select
                                        value={selectedBusinessGroup || ""}
                                        label="Business Group"
                                        onChange={(e) => setSelectedBusinessGroup(e.target.value ? Number(e.target.value) : null)}
                                    >
                                        <MenuItem value="">
                                            <em>All Business Groups</em>
                                        </MenuItem>
                                        {businessGroups.map((bg) => (
                                            <MenuItem key={bg.ID} value={bg.ID}>
                                                {bg.Name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Card>

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
                                noDataText="No service area tasks found for this operator."
                            />
                        )}
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

export default SubmitWork;