import { Table, TableBody, TableCell, TableRow, Typography } from "@mui/material";
import { faPhone, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dateFormat from "../../utils/dateFormat";
import phoneFormat from "../../utils/phoneFormat";
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";

interface RequestInfoTableProps {
    data: MaintenanceRequestsInterface | undefined;
}

const RequestInfoTable = ({ data }: RequestInfoTableProps) => {
    if (!data) return null;

    return (
        <Table>
            <TableBody>
                <TableRow>
                    <TableCell><Typography className="title-list">หมายเลขคำร้อง</Typography></TableCell>
                    <TableCell><Typography>{data.ID}</Typography></TableCell>
                </TableRow>

                <TableRow>
                    <TableCell><Typography className="title-list">เวลาที่ร้องขอ</Typography></TableCell>
                    <TableCell>
                        <Typography>
                            {`${dateFormat(data.CreatedAt || '')}, ${data.CreatedAt?.slice(11, 16)} น.`}
                        </Typography>
                    </TableCell>
                </TableRow>

                <TableRow>
                    <TableCell><Typography className="title-list">พื้นที่/ห้อง</Typography></TableCell>
                    <TableCell>
                        <Typography>
                            {`${data.Room?.RoomType?.TypeName} ชั้น ${data.Room?.Floor?.Number} ห้อง ${data.Room?.RoomNumber}`}
                        </Typography>
                    </TableCell>
                </TableRow>

                <TableRow>
                    <TableCell><Typography className="title-list">ประเภทงาน</Typography></TableCell>
                    <TableCell><Typography>{data.MaintenanceType?.TypeName}</Typography></TableCell>
                </TableRow>

                <TableRow>
                    <TableCell><Typography className="title-list">รายละเอียด</Typography></TableCell>
                    <TableCell><Typography>{data.Description}</Typography></TableCell>
                </TableRow>

                <TableRow>
                    <TableCell><Typography className="title-list">ช่วงเวลาที่รับบริการได้</Typography></TableCell>
                    <TableCell>
                        <Typography>
                            {data.IsAnytimeAvailable
                                ? 'ทุกช่วงเวลา'
                                : `${data.StartTime?.slice(11, 16)} - ${data.EndTime?.slice(11, 16)} น.`}
                        </Typography>
                    </TableCell>
                </TableRow>

                <TableRow>
                    <TableCell><Typography className="title-list">ร้องขอโดย</Typography></TableCell>
                    <TableCell>
                        <Typography>
                            {`${data.User?.FirstName} ${data.User?.LastName} - ${data.User?.CompanyName} (${data.User?.EmployeeID})`}
                        </Typography>
                    </TableCell>
                </TableRow>

                <TableRow>
                    <TableCell><Typography className="title-list">ข้อมูลการติดต่อ</Typography></TableCell>
                    <TableCell>
                        <Typography>
                            <FontAwesomeIcon icon={faPhone} style={{ paddingRight: '8px' }} />
                            {phoneFormat(data.User?.Phone || '')}
                        </Typography>
                        <Typography>
                            <FontAwesomeIcon icon={faEnvelope} style={{ paddingRight: '8px' }} />
                            {data.User?.Email}
                        </Typography>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
};

export default RequestInfoTable;
