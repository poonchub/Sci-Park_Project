import { useState } from "react";
import "./CreateMaintenanceRequest.css"

import { Steps } from "antd";

function CreateMaintenanceRequest() {

    const [selectedValue, setSelectedValue] = useState("1");

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
                <form className="form-container">
                    <div className="column">
                        <label className="label-title-text">บริเวณที่ต้องการแจ้งซ่อม</label>
                        <div className="radio-input-box">
                            <label className="custom-radio">
                                <input
                                    type="radio"
                                    name="position"
                                    value={1}
                                    checked={selectedValue === "1"}
                                    onChange={(e) => setSelectedValue(e.target.value)}
                                />
                                <span className="checkmark"></span>{"ห้องทำงาน/ห้องประชุม"}
                            </label>
                            <label className="custom-radio">
                                <input
                                    type="radio"
                                    name="position"
                                    value={2}
                                    checked={selectedValue === "2"}
                                    onChange={(e) => setSelectedValue(e.target.value)}
                                />
                                <span className="checkmark"></span>{"ภายในและบริเวณรอบอาคาร"}
                            </label>
                        </div>
                        <label className="label-title-text">ประเภทห้อง</label>
                        <select
                            name=""
                            id=""
                            className="custom-select"
                        >
                            <option value="1">test</option>
                        </select>
                        <div className="selection-box">
                            <div className="subbox">
                                <label className="label-title-text">ตำแหน่ง/ชั้น</label>
                                <select
                                    name=""
                                    id=""
                                    className="custom-select"
                                >
                                    <option value="1">{"ชั้น 1"}</option>
                                </select>
                            </div>
                            <div className="subbox">
                                <label className="label-title-text">หมายเลขห้อง</label>
                                <select
                                    name=""
                                    id=""
                                    className="custom-select"
                                >
                                    <option value="1">{"A01"}</option>
                                </select>
                            </div>
                        </div>
                        <label className="label-title-text">รายละเอียดงาน</label>
                        <textarea name="" id=""></textarea>
                    </div>
                    <div className="column">
                        <label className="label-title-text">ผู้เขียนคำร้อง</label>
                        <input type="text" />
                        <label className="label-title-text">ข้อมูลการติดต่อ</label>
                        <div className="input-contact-box">
                            <div className="sub-box">
                                <div className="icon-box">
                                    <img src="icons/phone.png" alt="" />
                                </div>
                                <input type="text" />
                            </div>
                            <div className="sub-box">
                                <div className="icon-box">
                                    <img src="icons/email.png" alt="" />
                                </div>
                                <input type="text" />
                            </div>
                            <div className="edit-button">
                                <img src="icons/edit.png" alt="" className="icon" />
                                <span>แก้ไข</span>
                            </div>
                        </div>
                        <label className="label-title-text">ช่วงเวลาที่รับบริการได้</label>
                        <div className="input-checkbox-box">
                            <input type="checkbox" className="checkbox"/>
                            <span>ทุกช่วงเวลา</span>
                        </div>
                        <div className="input-time-box">
                            <input type="time" />
                            <span>ถึง</span>
                            <input type="time" />
                        </div>
                    </div>
                    <div className="column">
                        <label className="label-title-text">ภาพประกอบ</label>
                        <input type="file" />
                        <button type="submit">ส่งคำร้อง</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
export default CreateMaintenanceRequest