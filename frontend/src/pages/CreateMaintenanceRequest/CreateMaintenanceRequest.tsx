import "./CreateMaintenanceRequest.css"

import { Steps } from "antd";

function CreateMaintenanceRequest(){
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
                <Steps current={1} labelPlacement="vertical" items={items} className="custom-steps"/>
            </div>
            
        </div>
    )
}
export default CreateMaintenanceRequest