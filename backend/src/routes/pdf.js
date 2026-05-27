const express = require("express");
const { requireRole } = require("../middleware/auth");
const {
  generateItpPdf,
  generateNcrPdf,
  generateMrbPdf,
  generateQuotePdf,
  generateInvoicePdf,
} = require("../pdf/generators");

const router = express.Router();

function sendPdf(res, buffer, filename) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", buffer.length);
  res.send(buffer);
}

// GET /projects/:id/itp/pdf
router.get("/projects/:id/itp/pdf", async (req, res, next) => {
  try {
    const buffer = await generateItpPdf(req.params.id);
    sendPdf(res, buffer, `ITP-${req.params.id}.pdf`);
  } catch (err) { next(err); }
});

// GET /ncr/:id/pdf
router.get("/ncr/:id/pdf", async (req, res, next) => {
  try {
    const buffer = await generateNcrPdf(req.params.id);
    sendPdf(res, buffer, `NCR-${req.params.id}.pdf`);
  } catch (err) { next(err); }
});

// GET /projects/:id/mrb/pdf
router.get("/projects/:id/mrb/pdf", requireRole("manager"), async (req, res, next) => {
  try {
    const buffer = await generateMrbPdf(req.params.id);
    sendPdf(res, buffer, `MRB-${req.params.id}.pdf`);
  } catch (err) { next(err); }
});

// GET /quotes/:id/pdf
router.get("/quotes/:id/pdf", async (req, res, next) => {
  try {
    const buffer = await generateQuotePdf(req.params.id);
    sendPdf(res, buffer, `Quote-${req.params.id}.pdf`);
  } catch (err) { next(err); }
});

// GET /invoices/:id/pdf
router.get("/invoices/:id/pdf", async (req, res, next) => {
  try {
    const buffer = await generateInvoicePdf(req.params.id);
    sendPdf(res, buffer, `Invoice-${req.params.id}.pdf`);
  } catch (err) { next(err); }
});

module.exports = router;
