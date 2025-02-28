import { useRef, useState } from "react";
import "./CreateMaintenanceRequest.css"

import { Steps } from "antd";

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
            <div className="step-card">
                <Steps current={1} labelPlacement="vertical" items={items} className="custom-steps" />
            </div>
            <div className="form-card">
                <div className="header-title">
                    <div className="circle-icon">
                        <img src="icons/inventory.png" alt="" />
                    </div>
                    <p className="text-title">รายการแจ้งซ่อม</p>
                </div>
                <div className="hexagon-bg"></div>
                <form className="form-container">
                    <div className="column">
                        <label className="label-title-text">บริเวณที่ต้องการแจ้งซ่อม</label>
                        <div className="radio-input-box">
                            {
                                area.map((item, index) => {
                                    return (
                                        <label key={index} className="custom-radio">
                                            <input
                                                type="radio"
                                                name="position"
                                                value={item.ID}
                                                checked={selectedArea === item.ID}
                                                onChange={(e) => setSelectedArea(Number(e.target.value))}
                                            />
                                            <span className="checkmark"></span>{item.AreaName}
                                        </label>
                                    )
                                })
                            }
                        </div>
                        {
                            selectedArea === 1 ? (
                                <>
                                    <label className="label-title-text">ประเภทห้อง</label>
                                    <select
                                        name=""
                                        id=""
                                        className="custom-select"
                                        onChange={(e)=>setSelectedRoomType(Number(e.target.value))}
                                    >
                                        {
                                            roomtype.map((item, index) => {
                                                return (
                                                    <option key={index} value={item.ID}>{item.TypeName}</option>
                                                )
                                            })
                                        }
                                    </select>
                                </>
                            ) : (
                                <textarea
                                    className="description-area"
                                    placeholder="ระบุรายละเอียดของบริเวณ หรือตำแหน่งที่ต้องการแจ้งซ่อม"
                                    onChange={(e) => setAreaDescription(e.target.value)}
                                ></textarea>
                            )
                        }

                        <div className="selection-box">
                            <div className="subbox">
                                <label className="label-title-text">ตำแหน่ง/ชั้น</label>
                                <select
                                    name=""
                                    id=""
                                    className="custom-select"
                                    onChange={(e)=>setSelectedFloor(Number(e.target.value))}
                                >
                                    {
                                        floor.map((item, index) => {
                                            return (
                                                <option key={index} value={item.ID}>{item.Name}</option>
                                            )
                                        })
                                    }
                                </select>
                            </div>
                            {
                                selectedArea === 1 ? (
                                    <div className="subbox">
                                        <label className="label-title-text">หมายเลขห้อง</label>
                                        <select
                                            name=""
                                            id=""
                                            className="custom-select"
                                            onChange={(e)=>setSelectedRoom(Number(e.target.value))}
                                        >
                                            <option value="1">{"A01"}</option>
                                        </select>
                                    </div>
                                ) : (
                                    <></>
                                )
                            }
                        </div>
                        <label className="label-title-text">รายละเอียดงาน</label>
                        <textarea 
                            onChange={(e)=>setTaskDescription(e.target.value)}
                            placeholder="ระบุรายละเอียดของงาน หรือปัญหาที่ต้องการแจ้งซ่อม"
                        ></textarea>
                    </div>
                    <div className="column">
                        <label className="label-title-text">ผู้เขียนคำร้อง</label>
                        <input type="text" value={name} readOnly disabled />
                        <label className="label-title-text">ข้อมูลการติดต่อ</label>
                        <div className="input-contact-box">
                            <div className="sub-box">
                                <div className="icon-box">
                                    <img src="icons/phone.png" alt="" />
                                </div>
                                <input
                                    type="text"
                                    defaultValue={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    disabled={!onEdit}
                                />
                            </div>
                            <div className="sub-box">
                                <div className="icon-box">
                                    <img src="icons/email.png" alt="" />
                                </div>
                                <input
                                    type="text"
                                    defaultValue={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={!onEdit}
                                />
                            </div>
                            {
                                !onEdit ? (
                                    <div className="button-container">
                                        <div
                                            className="edit-button button-secondary"
                                            onClick={() => setOnEdit(!onEdit)}
                                        >
                                            <img src="icons/edit.png" alt="" className="icon" />
                                            <span>แก้ไข</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="button-container">
                                        <div
                                            className="cancel-button button-secondary"
                                            onClick={() => setOnEdit(!onEdit)}
                                        >
                                            <img src="icons/cancel.png" alt="" className="icon" />
                                            <span>ยกเลิก</span>
                                        </div>
                                        <div
                                            className="save-button button-secondary"
                                        // onClick={}
                                        >
                                            <img src="icons/save.png" alt="" className="icon" />
                                            <span>บันทึก</span>
                                        </div>
                                    </div>
                                )
                            }

                        </div>
                        <label className="label-title-text">ช่วงเวลาที่รับบริการได้</label>
                        <div className="input-checkbox-box">
                            <input type="checkbox" className="checkbox" />
                            <span>ทุกช่วงเวลา</span>
                        </div>
                        <div className="input-time-box">
                            <input type="time" />
                            <span>ถึง</span>
                            <input type="time" />
                        </div>
                    </div>
                    <div className="column" id="column-3">
                        <div className="input-image-box">
                            <label className="label-title-text">ภาพประกอบ</label>
                            {
                                files.length != 0 ? (
                                    <div className="show-image-container">
                                        {files.map((file, index) => (
                                            <img
                                                key={index}
                                                src={URL.createObjectURL(file)}
                                                alt={`Uploaded ${index + 1}`}
                                                id={`image-${index + 1}`}
                                                className="image"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <></>
                                )
                            }

                            <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className="drag-drop-image-box"
                            >
                                <p>ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์ (สูงสุด 3 ไฟล์)</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileChange}
                                    style={{ display: "none" }}
                                />
                            </div>
                        </div>
                        <button type="submit" className="submit-button">ส่งคำร้อง</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
export default CreateMaintenanceRequest