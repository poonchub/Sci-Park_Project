import React from "react";
import { DataGrid, GridColDef, GridColumnVisibilityModel, GridPaginationModel } from "@mui/x-data-grid";
import { Card, Box, Typography } from "@mui/material";
import { SearchOff } from "@mui/icons-material";

interface CustomDataGridProps {
    rows: any[];
    columns: GridColDef[];
    rowCount: number;
    page: number;
    limit: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    noDataText?: string;
    columnVisibilityModel?: GridColumnVisibilityModel;
    getRowId?: (row: any) => any;
}

const CustomDataGrid: React.FC<CustomDataGridProps> = ({
    rows,
    columns,
    rowCount,
    page,
    limit,
    onPageChange,
    onLimitChange,
    noDataText = "ไม่มีข้อมูล",
    columnVisibilityModel,
    getRowId = ((row) => String(row.id)),

}) => {


    const EmptyOverlay = () => (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "gray",
            }}
        >
            <SearchOff sx={{ fontSize: 50, color: "gray" }} />
            <Typography variant="body1" sx={{ mt: 1, fontSize: 14 }}>
                {noDataText}
            </Typography>
        </Box>
    );



    return (
        <Card sx={{ height: "100%", borderRadius: 2 }}>
            <DataGrid
                rows={rows}
                columns={columns}
                getRowId={getRowId || ((row) => {
                    // Fallback logic ที่ปลอดภัยกว่า
                    if (row.ID !== undefined && row.ID !== null) {
                        return String(row.ID);
                    }
                    if (row.id !== undefined && row.id !== null) {
                        return String(row.id);
                    }
                    if (row.RequestServiceAreaID !== undefined && row.RequestServiceAreaID !== null) {
                        return String(row.RequestServiceAreaID);
                    }
                    // ถ้าไม่มี ID เลย ให้ใช้ index + timestamp เพื่อป้องกัน key ซ้ำ
                    return `row_${Date.now()}_${Math.random()}`;
                })}
                getRowHeight={() => "auto"}
                pageSizeOptions={[5, 10, 20, 50]}
                paginationMode="server"
                rowCount={rowCount}
                columnVisibilityModel={columnVisibilityModel}
                disableRowSelectionOnClick
                disableColumnResize={false}
                disableVirtualization={false}
                disableColumnMenu
                disableColumnFilter
                disableColumnSelector
                disableDensitySelector
                slots={{
                    noRowsOverlay: EmptyOverlay,
                    noResultsOverlay: EmptyOverlay,
                }}
                initialState={{
                    pagination: {
                        paginationModel: { page, pageSize: limit },
                    },
                }}
                onPaginationModelChange={(params: GridPaginationModel) => {
                    // DataGrid uses 0-based page index; propagate the same to parent
                    onPageChange(params.page);
                    onLimitChange(params.pageSize);
                }}
                sx={{
                    width: "100%",
                    borderRadius: 2,
                    "& .MuiDataGrid-cell": {
                        py: 2,
                    },
                    "& .MuiDataGrid-columnHeaders": {
                        borderBottom: "1px solid rgb(226, 226, 226)",
                    },
                    "& .MuiDataGrid-row": {
                        borderBottom: "1px solid rgb(236, 236, 236)",
                    },
                    "& .MuiDataGrid-columnSeparator": {
                        color: "#e0e0e0",
                    },
                    "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": {
                        outline: "none",
                    },
                    "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
                        outline: "none",
                    },
                    "& .MuiDataGrid-virtualScroller": {
                        overflowY: "hidden",
                    },
                }}
                slotProps={{
                    baseCheckbox: {
                        sx: {
                            color: "gray",
                            "&.Mui-checked": {
                                color: "#F26522",
                            },
                        },
                    },
                }}
            />

        </Card>
    );
};

export default CustomDataGrid;
