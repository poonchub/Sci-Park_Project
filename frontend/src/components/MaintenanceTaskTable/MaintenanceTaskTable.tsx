// components/MaintenanceTaskTable.tsx
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Card, Typography } from '@mui/material';
import { SearchOff } from '@mui/icons-material';

interface MaintenanceTaskTableProps {
    title: string;
    rows: any[];
    columns: GridColDef[];
    rowCount: number;
    page: number;
    limit: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
}

const MaintenanceTaskTable: React.FC<MaintenanceTaskTableProps> = ({
    title,
    rows,
    columns,
    rowCount,
    page,
    limit,
    onPageChange,
    onLimitChange,
}) => {
    return (
        <Box sx={{ width: '100%', height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {title}
            </Typography>
            <Card sx={{ height: '100%', borderRadius: 2 }}>
                <DataGrid
                    rows={rows}
                    getRowHeight={() => 'auto'}
                    columns={columns}
                    pageSizeOptions={[5, 10, 20, 50]}
                    getRowId={(row) => String(row.ID)}
                    paginationMode="server"
                    rowCount={rowCount}
                    checkboxSelection
                    disableRowSelectionOnClick
                    disableColumnResize={false}
                    slots={{
                        noRowsOverlay: () => (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    color: 'gray',
                                }}
                            >
                                <SearchOff sx={{ fontSize: 50, color: 'gray' }} />
                                <Typography variant="body1" sx={{ mt: 1 }}>
                                    ไม่พบงานซ่อมที่ต้องมอบหมาย
                                </Typography>
                            </Box>
                        ),
                    }}
                    initialState={{
                        pagination: {
                            paginationModel: { page, pageSize: limit },
                        },
                    }}
                    onPaginationModelChange={(params) => {
                        onPageChange(params.page);
                        onLimitChange(params.pageSize);
                    }}
                    sx={{
                        width: '100%',
                        borderRadius: 2,
                        '& .MuiDataGrid-cell': {
                            py: 2,
                        },
                        '& .MuiDataGrid-cellCheckbox': {
                            alignItems: 'flex-start !important',
                            pt: 0.4,
                        },
                    }}
                    slotProps={{
                        baseCheckbox: {
                            sx: {
                                color: 'gray',
                                '&.Mui-checked': {
                                    color: '#F26522',
                                },
                            },
                        },
                    }}
                />
            </Card>
        </Box>
    );
};

export default MaintenanceTaskTable;
