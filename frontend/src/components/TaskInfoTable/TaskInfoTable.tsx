import { Table, TableBody, TableCell, TableRow, Typography } from "@mui/material";
import phoneFormat from "../../utils/phoneFormat";
import dateFormat from "../../utils/dateFormat";
import timeFormat from "../../utils/timeFormat";
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";

interface TaskInfoTableProps {
    data: MaintenanceRequestsInterface | undefined;
}

// Display detailed information of a maintenance request in a table format
const TaskInfoTable = ({ data }: TaskInfoTableProps) => {
    if (!data) return null;

    const status = data.RequestStatus?.Name
    const isWaitingForReview = status === 'Waiting For Review'
    const isCompleted = status === 'Completed'

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
                { (isCompleted || isWaitingForReview) && <TableRow>
                    <TableCell>
                        <Typography className="title-list">เสร็จสิ้นเมื่อ</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography>{`${dateFormat(data.MaintenanceTask?.UpdatedAt || '')}, ${timeFormat(data.MaintenanceTask?.UpdatedAt || '')}`}</Typography>
                    </TableCell>
                </TableRow>}

                {/* Inspection information */}
                { (isCompleted) && <TableRow>
                    <TableCell>
                        <Typography className="title-list">ตรวจรับโดย</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography>{`${data.Inspection?.User?.FirstName} ${data.Inspection?.User?.LastName}`}</Typography>
                        <Typography>{`${dateFormat(data.Inspection?.CreatedAt || '')}, ${timeFormat(data.Inspection?.CreatedAt || '')}`}</Typography>
                    </TableCell>
                </TableRow>}
            </TableBody>
        </Table>
    );
};

export default TaskInfoTable;