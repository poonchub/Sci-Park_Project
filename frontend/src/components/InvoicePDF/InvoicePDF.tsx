import { useRef, useEffect } from "react";
import html2pdf from "html2pdf.js";
import { InvoiceInterface } from "../../interfaces/IInvoices";
import { apiUrl } from "../../services/http";
import tinymce from "tinymce";
import { Button, Grid } from "@mui/material";

interface InvoicePDFProps {
    invoice: InvoiceInterface;
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

export default function InvoicePDF({ invoice }: InvoicePDFProps) {
    const invoiceRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        tinymce.init({
            selector: ".editable-content",
            menubar: false,
            toolbar:
                "undo redo | bold italic underline | alignleft aligncenter alignright alignjustify | fontsizeselect | letterspacing",
            plugins: "lists advlist",
            setup: (editor) => {
                const rangeInput = document.getElementById("letter-spacing-slider") as HTMLInputElement;
                if (rangeInput) {
                    rangeInput.addEventListener("input", (e) => {
                        const value = (e.target as HTMLInputElement).value;
                        editor.getBody().style.letterSpacing = value + "em";
                    });
                }
            },
        });
    }, []);

    const generatePDF = () => {
        if (!invoiceRef.current) return;

        // สั่งให้ TinyMCE ทุกตัวบันทึกเนื้อหาลงใน div ต้นฉบับ
        tinymce.triggerSave();

        // รอให้การเปลี่ยนแปลง DOM สมบูรณ์ก่อน
        setTimeout(() => {
            html2pdf()
                .from(invoiceRef.current)
                .set({
                    margin: [40, 60, 40, 60],
                    filename: `invoice_${invoice.InvoiceNumber}.pdf`,
                    image: { type: "jpeg", quality: 0.98 },
                    html2canvas: { scale: 2, letterRendering: true, useCORS: true },
                    jsPDF: { unit: "px", format: [794, 1123], orientation: "portrait" },
                })
                .save();
        }, 500); // ตั้งค่า delay ประมาณ 500 มิลลิวินาที (หรือตามความเหมาะสม)
    };

    return (
        <div
            style={{
                width: "794px",
                height: "1123px",
                padding: "40px 60px",
                fontSize: 14,
            }}
        >
            <Grid size={{ xs: 12 }} textAlign={"end"}>
                <Button variant="contained" onClick={generatePDF} style={{ marginBottom: "20px" }}>
                    ดาวน์โหลด PDF
                </Button>
            </Grid>

            <div
                ref={invoiceRef}
                style={{
                    padding: "20px",
                    fontFamily: "'Sarabun', sans-serif",
                    fontSize: "14px",
                    lineHeight: "1.8",
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
                            border: 1px solid #999;
                            padding: 6px 10px;
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

                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <h1
                            style={{
                                border: "2px solid",
                                padding: "4px 0",
                                textAlign: "center",
                                width: "80px",
                                margin: 0,
                                fontSize: 14,
                            }}
                        >
                            ใบแจ้งหนี้
                        </h1>
                        <div className="text-normal" style={{ marginTop: "20px" }}>
                            ที่ {invoice.InvoiceNumber}
                        </div>
                    </div>
                    <div style={{ flex: 2, textAlign: "center" }}>
                        <img
                            src="http://localhost:8000/images/organization/logo/logo_1.png"
                            alt="Logo"
                            style={{ maxHeight: "80px" }}
                        />
                    </div>
                    <div style={{ flex: 1 }}></div>
                </div>

                {/* Issue Date */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
                    <div className="text-normal" style={{ width: "240px", textAlign: "center" }}>
                        วันที่ {thaiDateFull(invoice.IssueDate || "")}
                    </div>
                </div>

                {/* เรื่อง */}
                <div
                    className="editable-content"
                    id="subject-div"
                    style={{ display: "flex", gap: "16px", marginBottom: "10px", textAlign: "justify" }}
                >
                    <div>
                        <strong>เรื่อง</strong>
                    </div>
                    <div className="text-normal">
                        แจ้งค่าบริการอาคารอำนวยการอุทยานวิทยาศาสตร์ภูมิภาค ภาคตะวันออกเฉียงเหนือ 2 <br />{" "}
                        (จังหวัดนครราชสีมา)
                    </div>
                </div>

                {/* เรียน */}
                <div
                    className="editable-content"
                    id="to-div"
                    style={{ display: "flex", gap: "16px", marginBottom: "10px", textAlign: "justify" }}
                >
                    <div>
                        <strong>เรียน</strong>
                    </div>
                    <div className="text-normal">{invoice.Customer?.CompanyName}</div>
                </div>

                {/* Notice */}
                <div className="editable-content" id="notice-div" style={{ marginBottom: "6px", textIndent: "3.2em" }}>
                    อุทยานวิทยาศาสตร์ภูมิภาค ภาคตะวันออกเฉียงเหนือ 2 (จังหวัดนครราชสีมา) ขอเรียนให้ท่านทราบ
                    <br />
                    ถึงรายการค่าใช้จ่ายต่าง ๆ ต้องชำระดังต่อไปนี้
                </div>

                {/* Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                    <thead>
                        <tr>
                            <th style={{ border: "1px solid #999", textAlign: "center" }}>รายการ</th>
                            <th style={{ border: "1px solid #999", textAlign: "center" }}>เดือน</th>
                            <th style={{ border: "1px solid #999", textAlign: "center" }}>จำนวนเงิน (บาท)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.Items?.map((item, index) => (
                            <tr key={index}>
                                <td style={{ border: "1px solid #999" }}>
                                    {index + 1}. {item.Description}
                                </td>
                                <td style={{ border: "1px solid #999", textAlign: "center" }}>
                                    {thaiDateMonthYear(invoice.BillingPeriod || "")}
                                </td>
                                <td style={{ border: "1px solid #999", textAlign: "right" }}>
                                    {item.Amount?.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </td>
                            </tr>
                        ))}
                        <tr>
                            <td colSpan={2} style={{ border: "1px solid #999", textAlign: "right", fontWeight: 500 }}>
                                รวมค่าใช้จ่ายทั้งสิ้น
                            </td>
                            <td style={{ border: "1px solid #999", textAlign: "right", fontWeight: 500 }}>
                                {invoice.TotalAmount?.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Payment Instruction */}
                <div
                    className="editable-content"
                    id="payment-div"
                    style={{ marginTop: "20px", textIndent: "3.2em", textAlign: "justify" }}
                >
                    จึงขอให้ท่านโปรดชำระค่าบริการ
                    <strong>ภายในวันที่ {thaiDateFull(invoice.DueDate || "")}</strong>{" "}
                    ที่หน่วยบริหารงานกลางและพัฒนาโครงสร้างพื้นฐาน อุทยานวิทยาศาสตร์ภาคตะวันออกเฉียงเหนือตอนล่าง
                    (จ.นครราชสีมา) หรือโอนเงินเข้า<strong>บัญชีธนาคารกรุงไทย</strong> สาขามหาวิทยาลัยเทคโนโลยีสุรนารี
                    <strong> ชื่อบัญชี "RSP นครราชสีมา โดย เทคโนธานี" เลขที่บัญชี 662-1-84151-5&nbsp;</strong>
                    และขอให้ท่านส่งหลักฐานการโอนเงินมาที่หน่วยบริหารงานกลางและพัฒนาโครงสร้างพื้นฐาน อีเมล{" "}
                    <strong>office.ne2@gmail.com</strong> เบอร์โทร
                    <strong>&nbsp;099-629-5494&nbsp;</strong>
                    เพื่อออกใบเสร็จรับเงิน หากท่านไม่ชำระเงินตามกำหนด อุทยานวิทยาศาสตร์ฯ
                    ขอสงวนสิทธิ์ดำเนินการปรับตามข้อตกลงตั้งแต่วันผิดข้อตกลงจนกว่าจะชำระเสร็จสิ้น
                </div>

                <div className="text-normal" style={{ marginTop: "10px", textIndent: "3.2em" }}>
                    จึงเรียนมาเพื่อโปรดพิจารณาดำเนินการ
                </div>

                {/* Signature */}
                <div style={{ height: "40px" }}></div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div className="text-normal" style={{ width: "240px", textAlign: "center" }}>
                        <span>ขอแสดงความนับถือ</span>
                        <div style={{ flex: 2, textAlign: "center" }}>
                            <img
                                src={`${apiUrl}/${invoice.Creater?.SignaturePath}`}
                                alt="Signature"
                                style={{ maxHeight: "80px" }}
                            />
                        </div>
                        <span>
                            ({invoice.Creater?.Prefix?.PrefixTH}
                            {invoice.Creater?.FirstName} {invoice.Creater?.LastName})
                        </span>
                        <br />
                        <span>{invoice.Creater?.Role?.Name}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
