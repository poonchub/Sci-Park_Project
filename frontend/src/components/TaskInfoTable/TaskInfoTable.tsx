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
                        <Typography className="title-list">Operator</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography>
                            {`${data.MaintenanceTask?.User?.FirstName} ${data.MaintenanceTask?.User?.LastName} - ${data.MaintenanceTask?.User?.CompanyName} (${data.MaintenanceTask?.User?.EmployeeID})`}
                        </Typography>
                    </TableCell>
                </TableRow>

                {/* Contact information */}
                <TableRow>
                    <TableCell>
                        <Typography className="title-list">Contact Information</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography>
                            {`Phone: ${phoneFormat(data.MaintenanceTask?.User?.Phone || '')}`}
                        </Typography>
                        <Typography>
                            {`Email: ${data.MaintenanceTask?.User?.Email}`}
                        </Typography>
                    </TableCell>
                </TableRow>

                {/* Completed information */}
                { (isCompleted || isWaitingForReview) && <TableRow>
                    <TableCell>
                        <Typography className="title-list">Completed On</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography>{`${dateFormat(data.MaintenanceTask?.UpdatedAt || '')}, ${timeFormat(data.MaintenanceTask?.UpdatedAt || '')}`}</Typography>
                    </TableCell>
                </TableRow>}

                {/* Inspection information */}
                { (isCompleted) && <TableRow>
                    <TableCell>
                        <Typography className="title-list">Inspected By</Typography>
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