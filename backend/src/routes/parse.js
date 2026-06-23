const express = require("express");
const multer = require("multer");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");
const { parseXlsxBom, parsePdfBom, parseDxfBom } = require("../services/parsers");
const { MAX_FILE_SIZE, isAllowedFile } = require("../services/storage");

const router = express.Router();

// Parse endpoint accepts only the three document types it can actually parse
const PARSE_ALLOWED = new Set([".pdf", ".xlsx", ".xls", ".dxf"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req, file, cb) {
    const ext = require("path").extname(file.originalname).toLowerCase();
    if (PARSE_ALLOWED.has(ext) && isAllowedFile(file.originalname, file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Upload DXF, XLSX, or PDF only."));
    }
  },
});

// POST /parse/cad — upload a DXF/XLSX/PDF and return extracted BOM items for user confirmation
router.post("/cad", requireRole("senior"), upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const mime = req.file.mimetype;
    const name = req.file.originalname.toLowerCase();
    let result;

    if (name.endsWith(".dxf") || mime === "application/dxf") {
      result = parseDxfBom(req.file.buffer);
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls") || mime.includes("spreadsheet") || mime.includes("excel")) {
      result = await parseXlsxBom(req.file.buffer);
    } else if (name.endsWith(".pdf") || mime === "application/pdf") {
      result = await parsePdfBom(req.file.buffer);
    } else {
      return res.status(415).json({ error: "Unsupported file type. Upload DXF, XLSX, or PDF." });
    }

    res.json({
      ...result,
      message: "Review items below and confirm before importing to BOM",
    });
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/bom/import — import confirmed parsed BOQ into bom_items table
router.post("/projects/:id/bom/import", requireRole("senior"), async (req, res, next) => {
  try {
    const { items, parent_id } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items array is required and must not be empty" });
    }

    // Verify project exists
    const project = await db("projects").where("id", req.params.id).whereNull("deleted_at").first();
    if (!project) return res.status(404).json({ error: "Project not found" });

    const rows = items.map((item) => ({
      project_id: req.params.id,
      parent_id: parent_id || null,
      pn: item.pn || null,
      description: item.description,
      quantity: Number(item.quantity) || 1,
      unit: item.unit || "pcs",
      material: item.material || null,
      item_type: item.item_type || "part",
      stock_status: "unknown",
    }));

    const inserted = await db("bom_items").insert(rows).returning("*");

    res.status(201).json({
      message: `${inserted.length} BOM items imported successfully`,
      project_id: req.params.id,
      items: inserted,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
