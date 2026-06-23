const express = require("express");
const multer = require("multer");
const db = require("../db/knex");
const { uploadFile, getDownloadUrl, deleteFile, isAllowedFile, MAX_FILE_SIZE } = require("../services/storage");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

// Store files in memory before streaming to MinIO
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req, file, cb) {
    if (isAllowedFile(file.originalname, file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Permitted: PDF, XLSX, XLS, PNG, JPG, DXF, DWG, STEP`));
    }
  },
});

// POST /uploads — upload a file, link to an entity
router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const { entity, entity_id } = req.body;
    if (!entity || !entity_id) {
      return res.status(400).json({ error: "entity and entity_id are required" });
    }

    const { storageKey, bucket, sizeBytes, mimeType } = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      entity,
      entity_id
    );

    const [fileRecord] = await db("files")
      .insert({
        original_name: req.file.originalname,
        storage_key: storageKey,
        bucket,
        mime_type: mimeType,
        size_bytes: sizeBytes,
        entity,
        entity_id,
        uploaded_by: req.user.sub,
      })
      .returning("*");

    const download_url = await getDownloadUrl(storageKey);

    res.status(201).json({ ...fileRecord, download_url });
  } catch (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File too large — maximum 50MB" });
    }
    next(err);
  }
});

// GET /files/:id — get file metadata + presigned download URL
router.get("/:id", async (req, res, next) => {
  try {
    const file = await db("files as f")
      .leftJoin("users as u", "f.uploaded_by", "u.id")
      .select("f.*", "u.full_name as uploaded_by_name")
      .where("f.id", req.params.id)
      .first();

    if (!file) return res.status(404).json({ error: "File not found" });

    const download_url = await getDownloadUrl(file.storage_key);
    res.json({ ...file, download_url });
  } catch (err) {
    next(err);
  }
});

// GET /files — list files for an entity
router.get("/", async (req, res, next) => {
  try {
    const { entity, entity_id } = req.query;
    if (!entity || !entity_id) {
      return res.status(400).json({ error: "entity and entity_id query params are required" });
    }

    const files = await db("files as f")
      .leftJoin("users as u", "f.uploaded_by", "u.id")
      .select("f.*", "u.full_name as uploaded_by_name")
      .where({ "f.entity": entity, "f.entity_id": entity_id })
      .orderBy("f.created_at", "desc");

    // Attach presigned URLs
    const withUrls = await Promise.all(
      files.map(async (f) => ({
        ...f,
        download_url: await getDownloadUrl(f.storage_key).catch(() => null),
      }))
    );

    res.json(withUrls);
  } catch (err) {
    next(err);
  }
});

// DELETE /files/:id — soft remove (hard-deletes from MinIO, removes DB record)
router.delete("/:id", requireRole("manager"), async (req, res, next) => {
  try {
    const file = await db("files").where("id", req.params.id).first();
    if (!file) return res.status(404).json({ error: "File not found" });

    await deleteFile(file.storage_key).catch((e) =>
      console.warn("[Storage] MinIO delete failed:", e.message)
    );
    await db("files").where("id", req.params.id).del();

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
