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

    return (
        <Table>
            <TableBody>
                {/* Request ID */}
                <TableRow>
                    <TableCell>
                        <Typography className="title-list">หมายเลขคำร้อง</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography>{data.ID}</Typography>
                    </TableCell>
                </TableRow>

                {/* Request timestamp */}
                <TableRow>
                    <TableCell>
                        <Typography className="title-list">เวลาที่ร้องขอ</Typography>
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
                        <Typography className="title-list">พื้นที่/ห้อง</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography>
                            {`${data.Room?.RoomType?.TypeName} ชั้น ${data.Room?.Floor?.Number} ห้อง ${data.Room?.RoomNumber}`}
                        </Typography>
                    </TableCell>
                </TableRow>

                {/* Maintenance type */}
                <TableRow>
                    <TableCell>
                        <Typography className="title-list">ประเภทงาน</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography>{data.MaintenanceType?.TypeName}</Typography>
                    </TableCell>
                </TableRow>

                {/* Description */}
                <TableRow>
                    <TableCell>
                        <Typography className="title-list">รายละเอียด</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography>{data.Description}</Typography>
                    </TableCell>
                </TableRow>

                {/* Available time */}
                <TableRow>
                    <TableCell>
                        <Typography className="title-list">ช่วงเวลาที่รับบริการได้</Typography>
                    </TableCell>
                    <TableCell>
                        <Typography>
                            {data.IsAnytimeAvailable
                                ? 'ทุกช่วงเวลา'
                                : `${data.StartTime?.slice(11, 16)} - ${data.EndTime?.slice(11, 16)} น.`}
                        </Typography>
                    </TableCell>
                </TableRow>

                {/* Requester information */}
                <TableRow>
                    <TableCell>
                        <Typography className="title-list">ร้องขอโดย</Typography>
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

                {/* Rework Description information */}
                {
                    data.Inspection?.Description &&
                    <TableRow>
                        <TableCell>
                            <Typography className="title-list">หมายเหตุการขอซ่อมซ้ำ</Typography>
                        </TableCell>
                        <TableCell>
                            <Typography>
                                {data.Inspection?.Description}
                            </Typography>
                        </TableCell>
                    </TableRow>
                }

            </TableBody>
        </Table>
    );
};

export default RequestInfoTable;