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
                <div className="status-button btn-active">ทั้งหมด</div>
                {
                    status.map((item, index) => {
                        return (
                            <div key={index} className="status-button">
                                {item.statusName}
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}
export default MaintenanceRequest