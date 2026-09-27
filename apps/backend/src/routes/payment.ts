import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import { generateInvoicePdf, sendInvoiceEmail } from "../services/invoiceService.js";

const router = Router();

// ============================================
// ?Ｙ?瘚偌??NTS-YYYYMM-NNNN嚗??遢??嚗?// ============================================
function generateInvoiceNumber(prefix: string = "NTS"): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const min = String(now.getUTCMinutes()).padStart(2, "0");
  const ss = String(now.getUTCSeconds()).padStart(2, "0");
  return `${prefix}-${yyyy}${mm}${dd}${hh}${min}${ss}`;
}
const prisma = new PrismaClient();

const uploadDir = "uploads/payments";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.mimetype);
    cb(null, ok);
  },
});

router.post("/submit", authMiddleware, upload.single("proof"), async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: "not logged in" });

    const { productId, amount, currency, proofNote, passportName } = req.body;
    if (!productId || !amount) return res.status(400).json({ error: "missing params" });
    if (!passportName || passportName.trim().length < 2) {
      return res.status(400).json({ error: "passport name required" });
    }

    const proofUrl = req.file ? `/uploads/payments/${req.file.filename}` : null;
    const submission = await prisma.paymentSubmission.create({
      data: {
        userId, productId,
        amount: parseInt(amount, 10),
        currency: currency || "AUD",
        method: "bank_transfer",
        status: "PENDING",
        passportName: passportName.trim(),
        proofUrl,
        proofNote: proofNote || null,
      },
    });
    res.json({ success: true, submission });
  } catch (err) { next(err); }
});

router.get("/my-submissions", authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    const list = await prisma.paymentSubmission.findMany({
      where: { userId }, orderBy: { createdAt: "desc" }, take: 20,
    });
    res.json({ success: true, submissions: list });
  } catch (err) { next(err); }
});

router.get("/invoices/:id/download", authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const submission = await prisma.paymentSubmission.findFirst({
      where: { id, userId, status: "APPROVED" },
    });
    if (!submission) return res.status(404).json({ error: "not found" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const pdfBuffer = await generateInvoicePdf({
      invoiceNumber: submission.invoiceNumber || "N/A",
      date: (submission.reviewedAt || submission.createdAt).toISOString().slice(0, 10),
      customerName: submission.passportName || user?.username || "Customer",
      customerEmail: user?.email || "",
      description: "Nightasaur IELTS Immersion Program - 30 days",
      amount: submission.amount,
      currency: submission.currency,
      paymentMethod: "Bank Transfer (Chang Hwa Bank)",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="invoice-${submission.invoiceNumber || id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
});

router.get("/admin/list", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const status = (req.query.status as string) || "PENDING";
    const list = await prisma.paymentSubmission.findMany({
      where: status === "ALL" ? {} : { status },
      orderBy: { createdAt: "desc" }, take: 100,
    });
    res.json({ success: true, submissions: list });
  } catch (err) { next(err); }
});

router.get("/admin/invoices/:id/download", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const submission = await prisma.paymentSubmission.findUnique({ where: { id } });
    if (!submission || submission.status !== "APPROVED") return res.status(404).json({ error: "not found" });

    const user = await prisma.user.findUnique({ where: { id: submission.userId } });
    const pdfBuffer = await generateInvoicePdf({
      invoiceNumber: submission.invoiceNumber || "N/A",
      date: (submission.reviewedAt || submission.createdAt).toISOString().slice(0, 10),
      customerName: submission.passportName || user?.username || "Customer",
      customerEmail: user?.email || "",
      description: "Nightasaur IELTS Immersion Program - 30 days",
      amount: submission.amount,
      currency: submission.currency,
      paymentMethod: "Bank Transfer (Chang Hwa Bank)",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="invoice-${submission.invoiceNumber || id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
});

router.post("/admin/:id/approve", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const adminId = (req as any).user?.userId;
    const { id } = req.params;
    const { adminNote } = req.body;

    const submission = await prisma.paymentSubmission.findUnique({ where: { id } });
    if (!submission) return res.status(404).json({ error: "not found" });
    if (submission.status === "APPROVED") return res.status(400).json({ error: "already approved" });

    const now = new Date();
    const invoiceNumber = generateInvoiceNumber();

    const updated = await prisma.paymentSubmission.update({
      where: { id },
      data: {
        status: "APPROVED",
        adminNote: adminNote || null,
        invoiceNumber,
        reviewedAt: now,
        reviewedBy: adminId,
      },
    });

    try {
      const targetUser = await prisma.user.findUnique({ where: { id: submission.userId } });
      if (process.env.SENDGRID_API_KEY && targetUser?.email) {
        const pdfBuffer = await generateInvoicePdf({
          invoiceNumber,
          date: now.toISOString().slice(0, 10),
          customerName: submission.passportName || targetUser.username,
          customerEmail: targetUser.email,
          description: "Nightasaur IELTS Immersion Program - 30 days",
          amount: submission.amount,
          currency: submission.currency,
          paymentMethod: "Bank Transfer (Chang Hwa Bank)",
        });
        await sendInvoiceEmail(targetUser.email, targetUser.username, pdfBuffer, invoiceNumber)
          .catch((e) => console.error("Email error:", e.message));
      }
    } catch (e) { console.error("Invoice error:", e); }

    res.json({ success: true, submission: updated, invoiceNumber });
  } catch (err) { next(err); }
});

router.post("/admin/:id/reject", authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const adminId = (req as any).user?.userId;
    const { id } = req.params;
    const { adminNote } = req.body;
    const updated = await prisma.paymentSubmission.update({
      where: { id },
      data: { status: "REJECTED", adminNote: adminNote || null, reviewedAt: new Date(), reviewedBy: adminId },
    });
    res.json({ success: true, submission: updated });
  } catch (err) { next(err); }
});


// ============================================
// ???? Invoice?謅?????蝘??????????頦敞??謕?????畾?????減??PDF??// ============================================
router.get("/preview-invoice", authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "user not found" });

    const passportName = (req.query.name as string) || user.username || "SAMPLE USER";
    const now = new Date();
      const sampleInvoiceNumber = generateInvoiceNumber("SAMPLE");

    const pdfBuffer = await generateInvoicePdf({
      invoiceNumber: sampleInvoiceNumber,
      date: now.toISOString().slice(0, 10),
      customerName: passportName,
      customerEmail: user.email,
      description: "Nightasaur IELTS Immersion Program - 30 days (SAMPLE)",
      amount: 500000,
      currency: "AUD",
      paymentMethod: "Bank Transfer (Chang Hwa Bank)",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="invoice-sample.pdf"`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
});


// ============================================
// ??踝???賂??????螂?箏???????蹌???⊿?????// ============================================
router.post("/confirm-purchase", authMiddleware, async (req, res, next) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: "not logged in" });

    const { productId, passportName, amount, currency } = req.body;
    if (!passportName || passportName.trim().length < 2) {
      return res.status(400).json({ error: "passport name required" });
    }
    if (!productId) {
      return res.status(400).json({ error: "productId required" });
    }

    const now = new Date();
    const invoiceNumber = generateInvoiceNumber();

    const submission = await prisma.paymentSubmission.create({
      data: {
        userId,
        productId,
        amount: amount || 500000,
        currency: currency || "AUD",
        method: "bank_transfer",
        status: "APPROVED",
        passportName: passportName.trim(),
        invoiceNumber,
        reviewedAt: now,
        reviewedBy: "self-confirm",
        adminNote: "Self-confirmed purchase (no proof required)",
      },
    });

    res.json({ success: true, submission, invoiceNumber });
  } catch (err) { next(err); }
});

export default router;
