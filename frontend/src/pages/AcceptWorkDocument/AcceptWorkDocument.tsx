import React, { useEffect, useMemo, useState } from "react";
import { Box, Card, Container, Grid, Skeleton, Tab, Tabs, Typography, useMediaQuery, InputAdornment } from "@mui/material";
import { DatePicker } from "../../components/DatePicker/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TextField } from "../../components/TextField/TextField";
import dayjs, { Dayjs } from "dayjs";
import { GridColDef } from "@mui/x-data-grid";
import CustomDataGrid from "../../components/CustomDataGrid/CustomDataGrid";
import theme from "../../styles/Theme";
import { ListRequestServiceAreas, GetRequestStatuses } from "../../services/http";
import { RequestServiceAreaListInterface } from "../../interfaces/IRequestServiceArea";
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses";
import { HelpCircle, Search} from "lucide-react";

function AcceptWorkDocument() {
    const [searchText, setSearchText] = useState("");
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
    const [tab, setTab] = useState(0); // 0 = In Progress, 1 = Completed

    const [rows, setRows] = useState<RequestServiceAreaListInterface[]>([]);
    const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([]);

    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

    const statusIdForTab = useMemo(() => (tab === 0 ? 4 : 6), [tab]); // 4=In Progress, 6=Completed

    const getColumns = (): GridColDef[] => {
        return [
            { field: "ID", headerName: "No.", flex: 0.5, align: "center", headerAlign: "center" },
            {
                field: "CompanyName",
                headerName: "Company",
                flex: 1.5,
                renderCell: (params) => (
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography sx={{ fontSize: 14 }}>{params.row.CompanyName || "-"}</Typography>
                    </Box>
                ),
            },
            {
                field: "CreatedAt",
                headerName: "Date Submitted",
                flex: 1,
                renderCell: (params) => (
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography sx={{ fontSize: 14 }}>{dayjs(params.row.CreatedAt).format("DD/MM/YYYY")}</Typography>
                        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{dayjs(params.row.CreatedAt).format("hh:mm A")}</Typography>
                    </Box>
                ),
            },
            {
                field: "StatusID",
                headerName: "Status",
                flex: 1,
                renderCell: (params) => {
                    const status = requestStatuses.find((s) => s.ID === params.row.StatusID);
                    return (
                        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                            <Typography sx={{ fontSize: 14 }}>{status?.Name || "Unknown"}</Typography>
                        </Box>
                    );
                },
            },
            {
                field: "UserNameCombined",
                headerName: "Requester",
                flex: 1.2,
            },
        ];
    };

    const fetchRows = async (reqStatusId: number, pageIndex: number, pageSize: number) => {
        try {
            setLoading(true);
            const createdAt = selectedDate ? selectedDate.format("YYYY-MM") : undefined;
            const res = await ListRequestServiceAreas(String(reqStatusId), pageIndex + 1, pageSize, undefined, createdAt);
            if (res) {
                setRows(res.data || []);
                setTotal(typeof res.total === "number" ? res.total : (res.data || []).length);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        (async () => {
            const rs = await GetRequestStatuses();
            if (rs) setRequestStatuses(rs);
        })();
    }, []);

    useEffect(() => {
        fetchRows(statusIdForTab, page, limit);
    }, [statusIdForTab, page, limit, selectedDate]);

    const filteredRows = useMemo(() => {
        if (!searchText) return rows;
        const s = searchText.toLowerCase();
        return rows.filter((r) => {
            const company = (r.CompanyName || "").toLowerCase();
            const requester = (r.UserNameCombined || "").toLowerCase();
            const idStr = (r.ID ? String(r.ID) : "");
            return company.includes(s) || requester.includes(s) || idStr.includes(searchText);
        });
    }, [rows, searchText]);

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
                                placeholder="Search"
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
                        <Grid size={{ xs: 5, sm: 3 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    views={["year", "month"]}
                                    label="Month/Year"
                                    value={selectedDate}
                                    onChange={setSelectedDate}
                                />
                            </LocalizationProvider>
                        </Grid>
                        
                    </Grid>
                    </Card>

                    <Grid size={{ xs: 12, md: 3 }}>
                            <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); }} aria-label="status-tabs">
                                <Tab label="In Progress" />
                                <Tab label="Completed" />
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
                                noDataText="Service request information not found."
                            />
                        )}
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

export default AcceptWorkDocument;

