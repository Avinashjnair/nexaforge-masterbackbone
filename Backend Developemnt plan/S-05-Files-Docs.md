---
tags: [sprint/S-05, status/complete, priority/high]
sprint: S-05
weeks: 11–14
status: complete
updated: 2026-05-03
---

# S-05 — File Handling & Document Engine

**Duration:** Weeks 11–14  
**Status:** ✅ Complete  
**Goal:** Documents are the compliance record. MTCs, WPS PDFs, ITP reports, and MRB dossiers must be stored, versioned, and retrievable.

---

## Tasks

### File storage (S3 / MinIO)
- [x] Set up MinIO locally (mirrors S3 API — no AWS dependency for dev)
  > docker-compose.yml includes MinIO with console UI on port 9001
- [x] File upload endpoint: `POST /uploads` — returns signed URL + file ID
- [x] File retrieval: `GET /files/:id` — returns download URL
- [x] File versioning: new upload creates revision, old kept
  > Each upload generates unique UUID key under entity/entityId/ prefix
- [x] Link files to entities: MTC → inventory item, WPS → welding record, etc.
  > entity + entity_id columns in files table + filter endpoint
- [x] File types supported: PDF, XLSX, DXF, STEP, IGES, PNG, JPG

### CAD / BOQ parser
- [x] DXF parser: extract part list with quantities and materials
- [x] XLSX BOQ parser: map columns to BOM item schema
- [x] PDF BOQ parser: extract tables using pdf-parse
- [x] POST `/parse/cad` — upload file, return extracted BOM line items
- [x] Manual override UI: return parsed items for user confirmation before import
- [x] POST `/projects/:id/bom/import` — import confirmed BOQ into BOM table

### PDF generation
- [x] Install `pdfkit` for server-side PDF generation
- [x] GET `/projects/:id/itp/pdf` — generate ITP report PDF
- [x] GET `/ncr/:id/pdf` — generate NCR report PDF
- [x] GET `/projects/:id/mrb/pdf` — compile full MRB dossier PDF (5 sections)
- [x] GET `/quotes/:id/pdf` — generate quote document PDF
- [x] GET `/invoices/:id/pdf` — generate invoice PDF

---

## Definition of done

- [ ] MinIO running in Docker Compose, files persist across restarts
- [ ] DXF upload extracts ≥ 80% of parts correctly (test with actual client DWG)
- [ ] MRB PDF compiles all approved documents in correct section order
- [ ] File size limit enforced (50 MB per file)
- [ ] Virus scan on upload (ClamAV or equivalent)

---

## Claude Code prompts

```bash
claude "Generate a Node.js file upload service using MinIO SDK with versioning and entity linking for the NexaForge ERP"
claude "Write a DXF parser in Node.js that extracts part lists with quantities and maps them to the BOM item schema"
claude "Generate a Puppeteer-based PDF generator for the NexaForge MRB dossier"
```
