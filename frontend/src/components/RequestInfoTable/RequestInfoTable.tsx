import { Table, TableBody, TableCell, TableRow, Typography } from "@mui/material";
import dateFormat from "../../utils/dateFormat";
import phoneFormat from "../../utils/phoneFormat";
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";
import timeFormat from "../../utils/timeFormat";

interface RequestInfoTableProps {
    data: MaintenanceRequestsInterface | undefined;
}

// Display detailed information of a maintenance request in a table format
const RequestInfoTable = ({ data }: RequestInfoTableProps) => {
    if (!data) return null;

    const task = data.MaintenanceTask
    const approval = data.ManagerApproval


    const unsuccessfulDescription = data?.RequestStatus?.Name === 'Unsuccessful' ?
		(
			task?.Note ? task?.Note :
            approval?.Note ? approval.Note : "Request cancelled by the requester."
		) : null

    return (
        <Table>
            <TableBody>
                {/* Request ID */}
                <TableRow>
                    <TableCell>
                        <Typography className="title-list">Request No.</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography>{data.ID}</Typography>
                    </TableCell>
                </TableRow>

                {/* Request timestamp */}
                <TableRow>
                    <TableCell>
                        <Typography className="title-list">Requested At</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography>
                            {`${dateFormat(data.UpdatedAt || '')}, ${timeFormat(data.UpdatedAt || '')}`}
                        </Typography>
                    </TableCell>
                </TableRow>

                {/* Room/Location info */}
                <TableRow>
                    <TableCell>
                        <Typography className="title-list">Location / Room</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography>
                            {`${data.Room?.RoomType?.TypeName} - Floor ${data.Room?.Floor?.Number}, Room No. ${data.Room?.RoomNumber}`}
                        </Typography>
                    </TableCell>
                </TableRow>

                {/* Maintenance type */}
                <TableRow>
                    <TableCell>
                        <Typography className="title-list">Maintenance Type</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography>{data.MaintenanceType?.TypeName}</Typography>
                    </TableCell>
                </TableRow>

                {/* Description */}
                <TableRow>
                    <TableCell>
                        <Typography className="title-list">Description</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography>{data.Description}</Typography>
                    </TableCell>
                </TableRow>

                {/* Available time */}
                <TableRow>
                    <TableCell>
                        <Typography className="title-list">Available Time</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography>
                            {data.IsAnytimeAvailable
                                ? 'Anytime'
                                : `${data.StartTime?.slice(11, 16)} - ${data.EndTime?.slice(11, 16)} น.`}
                        </Typography>
                    </TableCell>
                </TableRow>

                {/* Requester information */}
                <TableRow>
                    <TableCell>
                        <Typography className="title-list">Requested By</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography>
                            {`${data.User?.FirstName} ${data.User?.LastName} - ${data.User?.CompanyName} ${data.User?.EmployeeID ? `(${data.User?.EmployeeID})` : '' }`}
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
                            {`Phone: ${phoneFormat(data.User?.Phone || '')}`}
                        </Typography>
                        <Typography>
                            {`Email: ${data.User?.Email}`}
                        </Typography>
                    </TableCell>
                </TableRow>

                {/* Rework Description information */}
                {
                    data.Inspection?.at(-1)?.Note &&
                    <TableRow>
                        <TableCell>
                            <Typography className="title-list">Rework Notes</Typography>
                        </TableCell>
                        <TableCell>
                            <Typography>
                                {data.Inspection?.at(-1)?.Note}
                            </Typography>
                        </TableCell>
                    </TableRow>
                }

                {/* Unsuccessful Description information */}
                {
                    unsuccessfulDescription &&
                    <TableRow>
                        <TableCell>
                            <Typography className="title-list">Cancellation Notes</Typography>
                        </TableCell>
                        <TableCell>
                            <Typography>
                                {unsuccessfulDescription}
                            </Typography>
                        </TableCell>
                    </TableRow>
                }

            </TableBody>
        </Table>
    );
};

export default RequestInfoTable;