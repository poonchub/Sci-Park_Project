import { useRef, useState } from "react";
import "./CreateMaintenanceRequest.css"

import { Steps } from "antd";
import { Box, Button, Card, CardContent, Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, Grid2, MenuItem, Radio, RadioGroup, Select, TextField, Typography } from "@mui/material";
import { BorderAll, CheckCircle } from "@mui/icons-material";
import { Link } from "react-router-dom";

function CreateMaintenanceRequest() {
    const [roomType, setRoomType] = useState()

    const [selectedArea, setSelectedArea] = useState(1);
    const [selectedRoomType, setSelectedRoomType] = useState(1)
    const [selectedFloor, setSelectedFloor] = useState(1)
    const [selectedRoom, setSelectedRoom] = useState(1)
    const [areaDescription, setAreaDescription] = useState("")
    const [taskDescription, setTaskDescription] = useState("")
    const [name, setName] = useState("พูลทรัพย์ นานาวัน");
    const [phone, setPhone] = useState("0985944576");
    const [email, setEmail] = useState("poonchubnanawan310@gmail.com");

    const [onEdit, setOnEdit] = useState(false);

    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isValidImage = (file: File) => {
        return file.type.startsWith("image/");
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        let droppedFiles = Array.from(event.dataTransfer.files).filter(isValidImage);

        if (droppedFiles.length > 3) {
            droppedFiles = droppedFiles.slice(0, 3);
            alert("สามารถเลือกได้สูงสุด 3 ไฟล์");
        }

        setFiles(droppedFiles);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            let selectedFiles = Array.from(event.target.files).filter(isValidImage);

            if (selectedFiles.length > 3) {
                selectedFiles = selectedFiles.slice(0, 3);
                alert("สามารถเลือกได้สูงสุด 3 ไฟล์");
            }

            setFiles(selectedFiles);
        }
    };

    const area = [
        {
            ID: 1,
            AreaName: "ห้องทำงาน/ห้องประชุม"
        },
        {
            ID: 2,
            AreaName: "ภายในและบริเวณรอบอาคาร"
        }
    ]

    const roomtype = [
        {
            ID: 1,
            TypeName: "ห้องทำงาน"
        },
        {
            ID: 2,
            TypeName: "ห้องประชุม"
        }
    ]

    const floor = [
        {
            ID: 1,
            Name: "ชั้น 1"
        },
        {
            ID: 2,
            Name: "ชั้น 2"
        },
        {
            ID: 3,
            Name: "ชั้น 3"
        }
    ]

    const items = [
        {
            title: "เขียนคำร้อง",
        },
        {
            title: "รอการอนุมัติ",
        },
        {
            title: "กำลังดำเนินการ",
        },
        {
            title: "ซ่อมเสร็จสิ้น",
        },
    ]

    return (
        <div className="create-maintenance-request-page">
            <Grid2 container spacing={2}>
                <Grid2 className='title-box' size={{ xs: 10, md: 10 }}>
                    <Typography variant="h6" className="title">
                        เขียนคำร้องแจ้งซ่อม
                    </Typography>
                </Grid2>
                <Grid2 container size={{ xs: 10, md: 2 }} sx={{ justifyContent: "flex-end" }}>
                    <Link to="/maintenance-request">
                        <Button variant="contained" sx={{ borderRadius: '4px', bgcolor: '#08aff1' }}>ย้อนกลับ</Button>
                    </Link>
                </Grid2>
                <Card variant="outlined" className="status-card" sx={{ width: '100%', minHeight: '100vh' }}>
                    <CardContent>
                        <Grid2 container component="form" spacing={5}>
                            {/* Form Section 1 */}
                            <Grid2 size={{ xs: 6, md: 6 }} sx={{ border: 1 }}>
                                <Typography variant="body1" className="title-field">บริเวณที่ต้องการแจ้งซ่อม</Typography>
                                <FormControl>
                                    <RadioGroup
                                        row
                                        aria-labelledby="demo-row-radio-buttons-group-label"
                                        name="row-radio-buttons-group"
                                    >
                                        <FormControlLabel value={1} control={<Radio />} label="ห้องประชุม/ห้องทำงาน" checked />
                                        <FormControlLabel value={2} control={<Radio />} label="บริเวณอื่นๆ" />
                                    </RadioGroup>
                                </FormControl>
                                <Typography variant="body1" className="title-field">ประเภทห้อง</Typography>
                                <FormControl fullWidth>
                                    {/* <InputLabel id="demo-simple-select-label">Age</InputLabel> */}
                                    <Select
                                        // value={age}
                                        // label="Age"
                                        // onChange={handleChange}
                                        defaultValue={1}
                                    >
                                        {/* {
                                            requestStatuses.map((item, index) => {
                                                return (
                                                    <MenuItem key={index} value={index + 1}>{item.Name}</MenuItem>
                                                )
                                            })
                                        } */}
                                    </Select>
                                </FormControl>
                                <Typography variant="body1" className="title-field">หมายเลขห้อง</Typography>
                                <FormControl fullWidth>
                                    {/* <InputLabel id="demo-simple-select-label">Age</InputLabel> */}
                                    <Select
                                        // value={age}
                                        // label="Age"
                                        // onChange={handleChange}
                                        defaultValue={1}
                                    >
                                        {/* {
                                            requestStatuses.map((item, index) => {
                                                return (
                                                    <MenuItem key={index} value={index + 1}>{item.Name}</MenuItem>
                                                )
                                            })
                                        } */}
                                    </Select>
                                </FormControl>
                                <Typography variant="body1" className="title-field">ประเภทปัญหา</Typography>
                                <FormControl fullWidth>
                                    {/* <InputLabel id="demo-simple-select-label">Age</InputLabel> */}
                                    <Select
                                        // value={age}
                                        // label="Age"
                                        // onChange={handleChange}
                                        defaultValue={1}
                                    >
                                        {/* {
                                            requestStatuses.map((item, index) => {
                                                return (
                                                    <MenuItem key={index} value={index + 1}>{item.Name}</MenuItem>
                                                )
                                            })
                                        } */}
                                    </Select>
                                </FormControl>
                                <Typography variant="body1" className="title-field">รายละเอียด</Typography>
                                <TextField
                                    multiline
                                    rows={4} // จำนวนแถวที่จะแสดง
                                    fullWidth
                                    variant="outlined"
                                // value={text}
                                // onChange={(e) => setText(e.target.value)}
                                />
                                <Typography variant="body1" className="title-field">ช่วงเวลาที่รับบริการได้</Typography>
                                <FormGroup>
                                    <FormControlLabel
                                        control={<Checkbox
                                            checked
                                        // onChange={handleChange} 
                                        />}
                                        label="ทุกช่วงเวลา"
                                    />
                                </FormGroup>
                                <TextField
                                    type="time"
                                    // value={time}
                                    // onChange={(e) => setTime(e.target.value)}
                                    // error={isInvalid}
                                    // helperText={isInvalid ? "กรุณาเลือกเวลาในช่วง 08:00 - 18:00" : ""}
                                    fullWidth
                                />
                                <Typography variant="body1" >ถึง</Typography>
                                <TextField
                                    type="time"
                                    // value={time}
                                    // onChange={(e) => setTime(e.target.value)}
                                    // error={isInvalid}
                                    // helperText={isInvalid ? "กรุณาเลือกเวลาในช่วง 08:00 - 18:00" : ""}
                                    fullWidth
                                />
                            </Grid2>
                            {/* Form Section 2 */}
                            <Grid2 size={{ xs: 6, md: 6 }} sx={{ border: 1 }}>
                                <Typography variant="body1" className="title-field">ผู้เขียนคำร้อง</Typography>
                                <TextField fullWidth variant="outlined" />
                                <Typography variant="body1" className="title-field">ข้อมูลการติดต่อ</Typography>
                                <TextField fullWidth variant="outlined" />
                                <TextField fullWidth variant="outlined" />
                                <Button variant="contained">แก้ไข</Button>
                                <Typography variant="body1" className="title-field">ผู้เขียนคำร้อง</Typography>
                            </Grid2>
                        </Grid2>
                    </CardContent>
                </Card>
            </Grid2>
        </div>
    )
}
export default CreateMaintenanceRequest