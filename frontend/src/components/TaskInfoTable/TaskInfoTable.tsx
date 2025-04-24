import { Table, TableBody, TableCell, TableRow, Typography } from "@mui/material";
import phoneFormat from "../../utils/phoneFormat";
import { MaintenanceTasksInterface } from "../../interfaces/IMaintenanceTasks";
import dateFormat from "../../utils/dateFormat";
import timeFormat from "../../utils/timeFormat";

interface TaskInfoTableProps {
    data: MaintenanceTasksInterface | undefined;
}

// Display detailed information of a maintenance request in a table format
const TaskInfoTable = ({ data }: TaskInfoTableProps) => {
    if (!data) return null;

    const isCompleted = data.RequestStatus?.Name === 'Completed'

    return (
        <Table>
            <TableBody>

                {/* Requester information */}
                <TableRow>
                    <TableCell>
                        <Typography className="title-list">ผู้รับผิดชอบ</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography>
                            {`${data.User?.FirstName} ${data.User?.LastName} - ${data.User?.CompanyName} (${data.User?.EmployeeID})`}
                        </Typography>
                    </TableCell>
                </TableRow>

                {/* Contact information */}
                <TableRow>
                    <TableCell>
                        <Typography className="title-list">ข้อมูลการติดต่อ</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography>
                            {`โทรศัพท์: ${phoneFormat(data.User?.Phone || '')}`}
                        </Typography>
                        <Typography>
                            {`อีเมล: ${data.User?.Email}`}
                        </Typography>
                    </TableCell>
                </TableRow>

                {/* Completed information */}
                { isCompleted && <TableRow>
                    <TableCell>
                        <Typography className="title-list">เสร็จสิ้นเมื่อ</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography>{`${dateFormat(data.UpdatedAt || '')}, ${timeFormat(data.UpdatedAt || '')}`}</Typography>
                    </TableCell>
                </TableRow>}
            </TableBody>
        </Table>
    );
};

export default TaskInfoTable;