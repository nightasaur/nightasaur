import PDFDocument from "pdfkit";
import sgMail from "@sendgrid/mail";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_PATH = path.join(__dirname, "../../assets/fonts/NotoSansTC-Regular.otf");

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const COMPANY = {
  nameEn: "JRENTECKHH. CO.",
  nameZh: "藤勝數位科技企業社",
  taxId: "82748666",
  address: "18F.-1, No. 56, Minsheng 1st Rd., Xinxing Dist., Kaohsiung City 800, Taiwan",
  email: "khh16813@gmail.com",
  website: "www.nightasaur.com",
};

const BANK = {
  bankName: "Chang Hwa Bank",
  bankCode: "009",
  branch: "Bo'ai Branch, Kaohsiung",
  branchCode: "8244",
  swift: "CCBCTWTP824",
  account: "8244 86 075332 00",
  holderEn: "JRENTECKHH. CO.",
  holderZh: "藤勝數位科技企業社",
};

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  description: string;
  amount: number;
  currency: string;
  paymentMethod: string;
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const buffers: Buffer[] = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      doc.registerFont("TC", FONT_PATH);
      doc.registerFont("TC-Bold", FONT_PATH);

      const brandColor = "#7c3aed";
      const grayColor = "#666666";

      // ===== 頁首 =====
      doc.fillColor(brandColor).font("TC-Bold").fontSize(28).text("Nightasaur", 50, 50);

      doc.fillColor(grayColor).font("TC").fontSize(9)
        .text(COMPANY.nameEn, 50, 88)
        .text(`Tax ID: ${COMPANY.taxId}`, 50, 101)
        .text(COMPANY.address, 50, 114, { width: 280 })
        .text(COMPANY.email, 50, 140)
        .text(COMPANY.website, 50, 153);

      doc.fillColor(brandColor).font("TC-Bold").fontSize(24).text("INVOICE", 400, 50, { align: "right" });
      doc.fillColor(grayColor).font("TC").fontSize(10)
        .text(`Invoice No.: ${data.invoiceNumber}`, 360, 88, { align: "right", width: 185 })
        .text(`Invoice Date: ${data.date}`, 360, 103, { align: "right", width: 185 });

      doc.moveTo(50, 180).lineTo(545, 180).strokeColor("#dddddd").lineWidth(1).stroke();

      // ===== 左欄：Bill To =====
      doc.fillColor(brandColor).font("TC-Bold").fontSize(11).text("Bill To", 50, 200);
      doc.fillColor("#000").font("TC").fontSize(10)
        .text(`Name: ${data.customerName}`, 50, 222)
        .text(`Email: ${data.customerEmail}`, 50, 238)
        .text(`Payment: Bank Transfer`, 50, 254);

      // ===== 右欄：Bank Details =====
      doc.fillColor(brandColor).font("TC-Bold").fontSize(11).text("Payment Details", 320, 200);
      doc.fillColor("#000").font("TC").fontSize(9)
        .text(`Bank: ${BANK.bankName}`, 320, 222)
        .text(`Bank Code: ${BANK.bankCode}`, 320, 236)
        .text(`Branch: ${BANK.branchCode} ${BANK.branch}`, 320, 250, { width: 225 })
        .text(`SWIFT: ${BANK.swift}`, 320, 268)
        .text(`Account No.: ${BANK.account}`, 320, 282)
        .text(`Account Name: ${BANK.holderEn}`, 320, 296, { width: 225 });

      doc.moveTo(50, 320).lineTo(545, 320).strokeColor("#dddddd").lineWidth(1).stroke();

      // ===== 項目表格 =====
      const tableTop = 345;
      doc.rect(50, tableTop, 495, 30).fill("#f5f5f5");

      doc.fillColor(brandColor).font("TC-Bold").fontSize(11)
        .text("Description", 60, tableTop + 9)
        .text("Amount", 440, tableTop + 9, { width: 100, align: "right" });

      doc.fillColor("#000").font("TC").fontSize(11)
        .text(data.description, 60, tableTop + 50, { width: 370 })
        .text(`${data.currency} ${(data.amount / 100).toFixed(2)}`, 430, tableTop + 50, { width: 110, align: "right" });

      doc.moveTo(50, tableTop + 100).lineTo(545, tableTop + 100).strokeColor("#dddddd").stroke();

      // ===== 總計（TOTAL 與金額分開）=====
      const totalY = tableTop + 130;
      doc.fillColor(brandColor).font("TC-Bold").fontSize(14).text("TOTAL", 350, totalY, { align: "right", width: 100 });
      doc.fillColor(brandColor).font("TC-Bold").fontSize(14).text(`${data.currency} ${(data.amount / 100).toFixed(2)}`, 470, totalY, { align: "right", width: 75 });

      // ===== 頁尾 =====
      doc.fillColor(grayColor).font("TC").fontSize(8)
        .text(
          `${COMPANY.nameEn} | Tax ID: ${COMPANY.taxId} | ${COMPANY.email} | ${COMPANY.website}`,
          50, 770,
          { align: "center", width: 495 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export async function sendInvoiceEmail(
  to: string,
  customerName: string,
  pdfBuffer: Buffer,
  invoiceNumber: string
) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("[Invoice] SendGrid 未設定，跳過發信");
    return;
  }
  await sgMail.send({
    to,
    from: {
      email: COMPANY.email,
      name: `Nightasaur (${COMPANY.nameEn})`,
    },
    subject: `【Nightasaur】Invoice ${invoiceNumber} - Payment Confirmed`,
    text: [
      `Hi ${customerName},`,
      "",
      "Your payment has been confirmed. Please find your invoice attached.",
      "",
      "Thank you for choosing Nightasaur!",
      "",
      COMPANY.nameEn,
      `Tax ID: ${COMPANY.taxId}`,
      COMPANY.email,
    ].join("\n"),
    attachments: [
      {
        content: pdfBuffer.toString("base64"),
        filename: `invoice-${invoiceNumber}.pdf`,
        type: "application/pdf",
        disposition: "attachment",
      },
    ],
  });
}