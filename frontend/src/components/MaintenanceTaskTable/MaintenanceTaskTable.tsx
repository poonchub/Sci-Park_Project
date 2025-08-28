// components/MaintenanceTaskTable.tsx
import { GridColDef, GridColumnVisibilityModel } from '@mui/x-data-grid';
import { Box, Skeleton, Typography } from '@mui/material';
import CustomDataGrid from '../CustomDataGrid/CustomDataGrid';

interface MaintenanceTaskTableProps {
    title: string;
    rows: any[];
    columns: GridColDef[];
    rowCount: number;
    page: number;
    limit: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    noData: string;
    isLoading?: boolean;
    columnVisibilityModel?: GridColumnVisibilityModel
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
    noData,
    isLoading,
    columnVisibilityModel
}) => {
    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} marginBottom={1.4}>
                {title}
            </Typography>
            {
                isLoading ? (
                    <Skeleton variant="rectangular" width="100%" height={255} sx={{ borderRadius: 2 }} />
                ) : (
                    <CustomDataGrid
                        rows={rows}
                        columns={columns}
                        rowCount={rowCount}
                        page={page > 0 ? page - 1 : 0}
                        limit={limit}
                        onPageChange={onPageChange}
                        onLimitChange={onLimitChange}
                        noDataText={noData}
                        columnVisibilityModel={columnVisibilityModel}
                        getRowId={(row) => {
                            // ใช้ ID ถ้ามีค่า
                            if (row.ID && row.ID > 0) {
                                return String(row.ID);
                            }
                            // ถ้าไม่มี ID เลย ให้ใช้ unique key
                            return `maintenance_task_${Date.now()}_${Math.random()}`;
                        }}
                    />
                )
            }
        </Box>
    );
};

export default MaintenanceTaskTable;
