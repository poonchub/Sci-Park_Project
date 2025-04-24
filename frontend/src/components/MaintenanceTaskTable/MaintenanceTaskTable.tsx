// components/MaintenanceTaskTable.tsx
import { GridColDef } from '@mui/x-data-grid';
import { Box, Typography } from '@mui/material';
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
}) => {
    return (
        <Box sx={{ width: '100%', height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {title}
            </Typography>
            <CustomDataGrid
                rows={rows}
                columns={columns}
                rowCount={rowCount}
                page={page}
                limit={limit}
                onPageChange={onPageChange}
                onLimitChange={onLimitChange}
                noDataText={noData}
            />
        </Box>
    );
};

export default MaintenanceTaskTable;
