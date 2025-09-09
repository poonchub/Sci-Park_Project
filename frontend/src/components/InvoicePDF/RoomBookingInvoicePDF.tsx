import { useRef, useEffect, useState } from "react";
import html2pdf from "html2pdf.js";
import { apiUrl, UploadRoomBookingInvoicePDF } from "../../services/http";
import { Button, CircularProgress, Grid } from "@mui/material";

import tinymce from "tinymce/tinymce";
import "tinymce/themes/silver/theme";
import "tinymce/icons/default/icons";
import "tinymce/plugins/advlist";
import "tinymce/plugins/lists";
import "tinymce/models/dom/model";
import { Download, Loader } from "lucide-react";
import { RoomBookingInvoiceInterface } from "../../interfaces/IRoomBookingInvoice";
import { numberToThaiBahtText } from "../../utils/numberToThaiBahtText";

interface InvoicePDFProps {
    invoice: RoomBookingInvoiceInterface;
    onComplete?: () => void;
}

const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
];

export function thaiDateFull(date: string | Date): string {
    const d = typeof date === "string" ? new Date(date) : date;
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear() + 543;
    return `${day} ${month} ${year}`;
}

export function thaiDateMonthYear(date: string | Date): string {
    const d = typeof date === "string" ? new Date(date) : date;
    const month = months[d.getMonth()];
    const year = d.getFullYear() + 543;
    return `${month} ${year}`;
}

export default function RoomBookingInvoicePDF({ invoice, onComplete }: InvoicePDFProps) {
    const invoiceRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const targets = [
            invoiceRef.current,
        ].filter(Boolean);

        targets.forEach((el) => {
            if (!el) return;
            tinymce.init({
                target: el,
                inline: true,
                menubar: false,
                toolbar:
                    "undo redo | bold italic underline | alignleft aligncenter alignright alignjustify | fontsizeselect | letterspacing",
                plugins: "lists advlist",
                license_key: "gpl",
            });
        });

        generateAndUploadPDF();

        return () => {
            targets.forEach((el) => {
                if (!el) return;
                const editor = tinymce.get(el.id);
                if (editor) editor.remove();
            });
        };
    }, []);

    const generateAndUploadPDF = async () => {
        if (!invoiceRef.current) {
            if (onComplete) onComplete();
            return
        };

        tinymce.triggerSave();

        setTimeout(async () => {
            try {
                await document.fonts.ready;

                const pdfBlob = await html2pdf()
                    .from(invoiceRef.current)
                    .set({
                        margin: [0, 26, 0, 26],
                        filename: `ใบแจ้งหนี้.pdf`,
                        image: { type: "jpeg", quality: 0.98 },
                        html2canvas: { scale: 2, letterRendering: true, useCORS: true },
                        jsPDF: { unit: "px", format: [794, 1123], orientation: "portrait" },
                    })
                    .output("blob");

                // สร้าง FormData
                const formData = new FormData();
                formData.append(
                    "invoicePDF",
                    new File([pdfBlob], `ใบแจ้งหนี้.pdf`, { type: "application/pdf" })
                );
                formData.append("invoiceId", invoice.ID?.toString() || "");

                // อัปโหลดไป backend
                await UploadRoomBookingInvoicePDF(formData);
                console.log("✅ Upload invoice pdf file success");

                // เรียก callback หลัง upload เสร็จ
                if (onComplete) onComplete();

            } catch (error) {
                console.error("Error generating or uploading PDF:", error);
                if (onComplete) onComplete();
            }
        }, 500);
    };

    return (
        <div
            style={{
                minWidth: "794px",
                minHeight: "1123px",
                padding: "26px 26px 10px 26px",
                fontSize: 15,
            }}
        >
            <link
                rel="preload"
                href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&family=Sarabun:wght@100;200;300;400;500;600;700;800&display=swap"
                as="style"
            />
            <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&family=Sarabun:wght@100;200;300;400;500;600;700;800&display=swap"
                media="all"
            />
            <style>
                {`
                    .header-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 12px;
                    }
                    .invoice-number {
                        margin-top: 20px;
                    }
                    .text-bold {
                        font-weight: 500;
                    }
                    .text-right {
                        text-align: right;
                    }
                    .text-center {
                        text-align: center;
                    }
                    .text-normal {
                        font-weight: 200;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 10px;
                    }
                    th,
                    td {
                        padding: 4px 6px;
                        font-weight: 200;
                    }
                    th {
                        background-color: #ccc;
                        font-weight: 500;
                    }
                    td {
                        vertical-align: top;
                    }
                    .col-description {
                        text-align: left;
                    }
                    .col-month {
                        text-align: center;
                    }
                    .col-amount {
                        text-align: right;
                    }
                    .footer-text {
                        margin-top: 20px;
                        line-height: 1.2;
                    }
                    .editable-content {
                        text-align: justify;
                        letter-spacing: 0.05em;
                        font-weight: 200;
                    }
                    strong {
                        font-weight: 500;
                    }
                `}
            </style>

            <div
                ref={invoiceRef}
                style={{
                    padding: "20px",
                    fontFamily: "'Sarabun', sans-serif",
                    fontSize: "14px",
                    lineHeight: "1.8",
                    position: 'relative',
                    height: '1123px',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: "12px",
                    }}
                >
                    <img
                        src="http://localhost:8000/images/organization/logo/logo_1.png"
                        alt="Logo"
                        style={{ maxHeight: "50px" }}
                    />
                </div>
                <div
                    style={{
                        display: "flex",
                        justifyContent: 'flex-end',
                        alignItems: "center",
                        marginBottom: "12px",
                    }}
                >
                    <h1
                        style={{
                            border: "2px solid",
                            padding: "3px 30px",
                            textAlign: "center",
                            margin: 0,
                            fontSize: 15,
                            fontWeight: 500
                        }}
                    >
                        ใบแจ้งหนี้ (Invoice)
                    </h1>
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                        fontSize: 14
                    }}
                >
                    <div>
                        <div
                            className="text-normal"
                            style={{ width: "500px" }}
                        >
                            เรียน/Attention : {invoice.Customer?.CompanyName}
                        </div>
                        <div
                            className="text-normal"
                            style={{ width: "500px" }}
                        >
                            ที่อยู่/Address : {invoice.BookingRoom?.Address?.split("-")[0].trim()}
                        </div>
                        <div
                            className="text-normal"
                            style={{ width: "500px" }}
                        >
                            เลขที่ {invoice.BookingRoom?.Address?.split("-")[1].trim()}
                        </div>
                        <div
                            className="text-normal"
                            style={{ width: "500px" }}
                        >
                            เลขที่ประจำตัวผู้เสียภาษี/TAX ID. : {invoice.BookingRoom?.TaxID}
                        </div>
                    </div>

                    <div>
                        <div
                            className="text-normal"
                            style={{ width: "200px" }}
                        >
                            วันที่/Date : {thaiDateFull(invoice.IssueDate || "")}
                        </div>
                        <div
                            className="text-normal"
                            style={{ width: "200px" }}
                        >
                            เลขที่/No. : {invoice.InvoiceNumber}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px", fontSize: 14 }} border={1}>
                    <thead>
                        <tr>
                            <th
                                style={{
                                    textAlign: "center",
                                    width: "68%",
                                }}
                                colSpan={2}
                            >
                                รายละเอียด
                            </th>
                            <th
                                style={{
                                    textAlign: "center",
                                    width: "2%",
                                }}
                                colSpan={1}
                            >
                                จำนวน
                            </th>
                            <th
                                style={{
                                    textAlign: "center",
                                    width: "15%",
                                }}
                                colSpan={1}
                            >
                                ราคา/หน่วย
                            </th>
                            <th
                                style={{
                                    textAlign: "center",
                                    width: "15%",
                                }}
                                colSpan={1}
                            >
                                ยอดรวม (บาท)
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.Items?.map((item, index) => (
                            <tr key={index}>
                                <td style={{ border: "1px solid #999" }} colSpan={2}>
                                    {item.Description}
                                </td>
                                <td style={{ border: "1px solid #999", textAlign: 'center' }}>
                                    {item.Quantity}
                                </td>
                                <td style={{ border: "1px solid #999", textAlign: 'center' }}>
                                    {item.UnitPrice?.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </td>
                                <td style={{ border: "1px solid #999", textAlign: 'center' }}>
                                    {item.Amount?.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </td>
                            </tr>
                        ))}
                        <tr>
                            <td
                                style={{
                                    width: "46%"
                                }}
                                className="text-normal"
                                rowSpan={2}
                            >
                                โอนเงินเข้าบัญชีเลขที่ 662-1-84151-5<br />
                                ชื่อบัญชี RSP นครราชสีมา โดย เทคโนธานี<br />
                                ธนาคารกรุงไทย สาขามหาวิทยาลัยเทคโนโลยีสุรนารี
                            </td>
                            <td
                                style={{
                                    textAlign: 'center',
                                    verticalAlign: "middle",
                                }}
                                className="text-bold"
                                colSpan={2}
                            >
                                ยอดรวม (บาท)
                            </td>
                            <td
                                style={{
                                    textAlign: 'center',
                                    verticalAlign: "middle",
                                }}
                                colSpan={2}
                            >
                                {invoice.BookingRoom?.TotalAmount?.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </td>
                        </tr>
                        <tr>
                            <td
                                style={{
                                    textAlign: 'center',
                                    verticalAlign: "middle",
                                }}
                                className="text-bold"
                                colSpan={2}
                            >
                                ส่วนลด (บาท)
                            </td>
                            <td
                                style={{
                                    textAlign: 'center',
                                    verticalAlign: "middle",
                                }}
                                colSpan={2}
                            >
                                0.00
                            </td>
                        </tr>
                        <tr>
                            <td
                                style={{
                                    textAlign: 'center'
                                }}
                                className="text-bold"
                            >
                                ({numberToThaiBahtText(invoice.BookingRoom?.TotalAmount ?? 0)})
                            </td>
                            <td
                                style={{
                                    textAlign: 'center'
                                }}
                                className="text-bold"
                                colSpan={2}
                            >
                                รวมเป็นเงินที่ต้องชำระ (บาท)
                            </td>
                            <td
                                style={{
                                    textAlign: 'center'
                                }}
                                className="text-bold"
                                colSpan={2}
                            >
                                1,000.00
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Condition Instruction */}
                <div
                    className="text-normal"
                    style={{ marginTop: "20px", textAlign: "justify", paddingLeft: "1em", fontSize: 10 }}
                >
                    <p className="text-bold">ขอบข่ายการให้บริการปกติ (โดยไม่เก็บเงินค่าใช้จ่ายเพิ่ม)</p>
                    - เครื่องปรับอากาศ (เปิดก่อนการเริ่มงาน 30 นาที) พร้อมเจ้าหน้าที่ดูแล<br />
                    - แม่บ้านทำความสะอาดภายในอาคาร (ในวันและเวลาทำการ)<br />
                    - พื้นที่จอดรถด้านหน้าอาคาร<br />
                    - การจัดระบบจราจร (กรณีมีผู้เข้าร่วมงานจำนวน 200 คนขึ้นไป)<br />
                    - จัดสถานที่ โต๊ะ-เก้าอี้ และระบบสื่อโสตทัศนูปกรณ์ (เครื่องเสียง/จอ LED)<br />


                    <p className="text-bold">เงื่อนไขการชำระเงิน</p>
                    - ชำระค่ามัดจำ ร้อยละ 50 (ของค่าใช้จ่าย) ภายใน 7 วัน หลังลงนามรับทราบและยืนยัน หรือชำระทั้งหมด<br />
                    - ชำระค่าใช้จ่ายส่วนที่เหลือ ภายใน 7 วัน หลังจากเสร็จสิ้นการจัดกิจกรรม<br />
                    - กรณีชำระค่าบริการก่อนวัดจัดกิจกรรม ทางอุทยานวิทยาศาสตร์ภูมิภาค ภาคตะวันออกเฉียงเหนือ 2 จะไม่สามารถคืนค่าบริการได้ทุกกรณี แต่ทางผู้จัดสามารถเลื่อนวัดจัดกิจกรรมได้<br />


                    <p className="text-bold">หมายเหตุ</p>
                    - กรณีมีค่าใช้จ่ายอื่นๆ เพิ่มเติมนอกเหนือจากที่ตกลงกันไว้ตั้งแต่ต้น ท่านจะต้องรับผิดชอบและชำระค่าใช้จ่ายเพิ่มเติมเองทั้งหมด<br />
                    - กรณีที่ท่านมีความประสงค์ยกเลิกการใช้พื้นที่หรือยกเลิกการจัดกิจกรรม โดยไม่แจ้งให้ทราบล่วงหน้าก่อนจัดกิจกรรม 7 วัน<br />
                    ท่านต้องรับผิดชอบค่าใช้จ่ายโดยทางอุทยานวิทยาศาสตร์ภูมิภาค ภาคตะวันออกเฉียงเหนือ 2 จะยึดเงินค่ามัดจำทั้งหมด<br />
                </div>

                {/* Signature */}
                <div style={{ display: "flex", justifyContent: 'space-around', marginTop: '35px' }}>
                    <div
                        className="text-normal"
                        style={{ width: "240px", textAlign: "center" }}
                    >
                        <span>รับทราบและยืนยัน</span>
                        <div style={{ height: "75px", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {
                                invoice.Customer?.SignaturePath ? (
                                    <img
                                        src={
                                            invoice.Customer?.SignaturePath
                                                ? `${apiUrl}/${invoice.Customer?.SignaturePath}`
                                                : ""
                                        }
                                        alt="Signature"
                                        style={{ height: "100%" }}
                                    />
                                ) : (
                                    <p style={{ color: 'rgb(175, 175, 175)' }}>Signature</p>
                                )
                            }
                        </div>
                        <span>
                            ({invoice.Customer?.Prefix?.PrefixTH}
                            {invoice.Customer?.FirstName} {invoice.Customer?.LastName})
                        </span>
                        <br />
                        <span>{`วันที่ ${thaiDateFull(invoice.BookingRoom?.CreatedAt ?? '')}`}</span>
                    </div>

                    <div
                        className="text-normal"
                        style={{ width: "240px", textAlign: "center" }}
                    >
                        <span>อนุมัติโดย</span>
                        <div style={{ height: "70px", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {
                                invoice.Approver?.SignaturePath ? (
                                    <img
                                        src={
                                            invoice.Approver?.SignaturePath
                                                ? `${apiUrl}/${invoice.Approver?.SignaturePath}`
                                                : ""
                                        }
                                        alt="Signature"
                                        style={{ height: "100%" }}
                                    />
                                ) : (
                                    <p style={{ color: 'rgb(175, 175, 175)' }}>Signature</p>
                                )
                            }
                        </div>
                        <span>
                            ({invoice.Approver?.Prefix?.PrefixTH}
                            {invoice.Approver?.FirstName} {invoice.Approver?.LastName})
                        </span>
                        <br />
                        <span>{`วันที่ ${thaiDateFull(invoice.IssueDate ?? '')}`}</span>
                    </div>
                </div>

                <div
                    style={{
                        marginTop: '35px',
                        fontSize: 10,
                        color: 'rgb(175, 175, 175)',
                        paddingLeft: "1em",
                        position: 'absolute',
                        bottom: '10px',
                    }}
                    className="text-normal"
                >
                    <p>
                        อุทยานวิทยาศาสตร์ภูมิภาค ภาคตะวันออกเฉียงเหนือ 2<br />
                        อาคารอำนวยการอุทยานวิทยาศาสตร์ภูมิภาค ภาคตะวันออกเฉียงเหนือ 2 (จังหวัดนครราชสีมา)<br />
                        เลขที่ 111 ถ.มหาวิทยาลัย ตำบลสุรนารี อำเภอเมือง จังหวัดนคีราชสีมา 30000<br />
                        โทรศัพท์ 0-4422-3600
                    </p>
                </div>
            </div>
        </div>
    );
}