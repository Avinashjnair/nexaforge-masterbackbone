const Minio = require("minio");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const BUCKET = process.env.MINIO_BUCKET || "nexaforge-docs";
const PRESIGN_EXPIRY_SECONDS = 60 * 60; // 1 hour

// Two-layer file validation: extension must be in ALLOWED_EXTENSIONS,
// and the reported MIME must be in that extension's permitted set.
// octet-stream is NOT in any set — browsers/clients must send a real MIME type.
const ALLOWED_EXTENSIONS = {
  ".pdf":  new Set(["application/pdf"]),
  ".xlsx": new Set(["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]),
  ".xls":  new Set(["application/vnd.ms-excel"]),
  ".png":  new Set(["image/png"]),
  ".jpg":  new Set(["image/jpeg"]),
  ".jpeg": new Set(["image/jpeg"]),
  ".dxf":  new Set(["application/dxf", "image/vnd.dxf", "application/octet-stream"]),
  ".dwg":  new Set(["application/acad", "image/vnd.dwg", "application/octet-stream"]),
  ".step": new Set(["application/step", "application/octet-stream"]),
  ".stp":  new Set(["application/step", "application/octet-stream"]),
};

// Flat set still exported so existing multer fileFilter callers don't break
const ALLOWED_TYPES = new Set(
  Object.values(ALLOWED_EXTENSIONS).flatMap(s => [...s])
);

/**
 * Returns true only when both the file extension and MIME type are permitted.
 * Prevents bypass via octet-stream on non-CAD files.
 */
function isAllowedFile(originalName, mimetype) {
  const ext = require("path").extname(originalName).toLowerCase();
  const permitted = ALLOWED_EXTENSIONS[ext];
  return permitted != null && permitted.has(mimetype);
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

let minioClient = null;

function getClient() {
  if (!minioClient) {
    minioClient = new Minio.Client({
      endPoint:  process.env.MINIO_ENDPOINT  || "localhost",
      port:      Number(process.env.MINIO_PORT) || 9000,
      useSSL:    process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
      secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
    });
  }
  return minioClient;
}

async function ensureBucket() {
  const client = getClient();
  const exists = await client.bucketExists(BUCKET);
  if (!exists) {
    await client.makeBucket(BUCKET, "us-east-1");
    console.log(`[MinIO] bucket '${BUCKET}' created`);
  }
}

/**
 * Upload a file buffer to MinIO.
 * Returns the storage key and metadata.
 * @param {Buffer} buffer - file contents
 * @param {string} originalName - original filename
 * @param {string} mimeType
 * @param {string} entity - e.g. 'projects', 'ncrs'
 * @param {string} entityId - UUID of the linked entity
 */
async function uploadFile(buffer, originalName, mimeType, entity, entityId) {
  if (buffer.length > MAX_FILE_SIZE) {
    const err = new Error(`File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    err.status = 413;
    throw err;
  }

  const ext = path.extname(originalName).toLowerCase();
  const storageKey = `${entity}/${entityId}/${uuidv4()}${ext}`;

  const client = getClient();
  await client.putObject(BUCKET, storageKey, buffer, buffer.length, {
    "Content-Type": mimeType,
    "x-amz-meta-original-name": encodeURIComponent(originalName),
    "x-amz-meta-entity": entity,
    "x-amz-meta-entity-id": entityId,
  });

  return { storageKey, bucket: BUCKET, sizeBytes: buffer.length, mimeType };
}

/**
 * Generate a presigned download URL valid for 1 hour.
 */
async function getDownloadUrl(storageKey) {
  const client = getClient();
  return client.presignedGetObject(BUCKET, storageKey, PRESIGN_EXPIRY_SECONDS);
}

/**
 * Delete a file from MinIO (used when a file record is hard-deleted).
 */
async function deleteFile(storageKey) {
  const client = getClient();
  await client.removeObject(BUCKET, storageKey);
}

module.exports = { ensureBucket, uploadFile, getDownloadUrl, deleteFile, ALLOWED_TYPES, ALLOWED_EXTENSIONS, isAllowedFile, MAX_FILE_SIZE };
