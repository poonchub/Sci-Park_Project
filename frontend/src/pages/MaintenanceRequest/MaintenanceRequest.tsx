import { Link } from "react-router-dom"
import "./MaintenanceRequest.css"

function MaintenanceRequest() {

    const status = [
        { statusName: "ซ่อมสำเร็จ" },
        { statusName: "รอการอนุมัติ" },
        { statusName: "กำลังดำเนินการ" },
        { statusName: "ไม่ผ่านการอนุมัติ" },
    ]

    return (
        <div className="maintenance-request-page">
            <div className="header-title">
                <div className="circle-icon">
                    <img src="icons/maintenance.png" alt="" />
                </div>
                <p className="text-title">รายการแจ้งซ่อม</p>
            </div>
            <div className="data-query-section">
                <div className="status-button-container">
                    <div className="status-button btn-active">ทั้งหมด</div>
                    {
                        status.map((item, index) => {
                            return (
                                <button key={index} className="status-button">
                                    {item.statusName}
                                </button>
                            )
                        })
                    }
                </div>
                <Link to="/create-maintenance-request" className="create-request-button">เขียนคำร้องแจ้งซ่อม</Link>
            </div>
        </div>
    )
}
export default MaintenanceRequest