# Build plan update — Document management dissolved into QC & Production

**Change type:** Architectural — remove standalone module, redistribute pages  
**Affected files:** modules.ts, roles.ts, routes.tsx, sidebar configurations, feature folders  
**Net effect:** 10 modules → 9 modules, 83 pages → 83 pages (redistributed), 1 shared service created

---

## 1. Summary of changes

The standalone document management module (7 sidebar pages) is removed as an independent module. Its pages are redistributed into QC (4 pages) and Production (2 pages). The document management dashboard is dissolved — its widgets are absorbed into the QC and Production dashboards respectively.

### Redistribution map

| Former document management page | New home | New sidebar path | Rationale |
|--------------------------------|----------|-----------------|-----------|
| Dashboard | Dissolved | — | Widgets split into QC and Production dashboards |
| Document register (MDR) | QC | /quality-control/mdr | QC is the document custodian, maintains master register |
| Drawing management | QC | /quality-control/drawings | Drawing revision control is a quality function |
| Procedure library | QC | /quality-control/procedures | WPS, PQR, inspection procedures are QC-owned |
| Transmittals | QC | /quality-control/transmittals | Formal document submission to clients/TPI is QC's responsibility |
| Approval workflows | Production | /production/approvals | Production stages trigger most document approvals |
| Archive & search | Production | /production/archive | Archive and handover happen at dispatch, the final production step |

### Updated sidebar page counts

| Module | Before | After | Change |
|--------|--------|-------|--------|
| Quality control | 9 pages | 13 pages | +4 (MDR, drawings, procedures, transmittals) |
| Production | 10 pages | 12 pages | +2 (approval workflows, document archive) |
| Document management | 7 pages | 0 pages | Module removed |
| All other modules | Unchanged | Unchanged | — |

---

## 2. Updated modules.ts

**Claude Code instruction:** Replace the entire MODULE_CODES and MODULE_REGISTRY in `packages/shared/src/constants/modules.ts`. The `documents` module code is removed. QC and Production get additional sidebar items.

### 2.1 — Remove document module code

```typescript
export const MODULE_CODES = {
  PROJECT_MGMT: "project_mgmt",
  PROCUREMENT: "procurement",
  STORES: "stores",
  QUALITY_CONTROL: "qc",
  PRODUCTION: "production",
  FINANCE: "finance",
  // DOCUMENTS: "documents",  ← REMOVED
  HSE: "hse",
  MAINTENANCE: "maintenance",
  ANALYTICS: "analytics",
} as const;
```

### 2.2 — Updated QC sidebar items (add 4 document pages after data book compiler)

```typescript
qc: {
  code: "qc",
  name: "Quality control",
  icon: "BadgeCheck",
  basePath: "/quality-control",
  color: "coral",
  description: "Inspection, NDE, welding, NCR, data books, document control, transmittals",
  sidebarItems: [
    // --- Existing QC pages (unchanged) ---
    { key: "qc-dashboard", label: "Dashboard", icon: "LayoutDashboard", path: "/dashboard", requiredAction: "read" },
    { key: "qc-incoming", label: "Incoming inspection", icon: "Search", path: "/incoming", requiredAction: "read" },
    { key: "qc-ipi", label: "In-process inspection", icon: "Eye", path: "/in-process", requiredAction: "read" },
    { key: "qc-nde", label: "NDE management", icon: "ScanLine", path: "/nde", requiredAction: "read" },
    { key: "qc-welding", label: "Welding management", icon: "Flame", path: "/welding", requiredAction: "read" },
    { key: "qc-ncr", label: "NCR management", icon: "AlertTriangle", path: "/ncr", requiredAction: "read" },
    { key: "qc-test-reports", label: "Test reports", icon: "FileBarChart", path: "/test-reports", requiredAction: "read" },
    { key: "qc-databook", label: "Data book compiler", icon: "BookOpen", path: "/databook", requiredAction: "read" },

    // --- Document management pages (moved from standalone module) ---
    { key: "qc-mdr", label: "Document register (MDR)", icon: "Table2", path: "/mdr", requiredAction: "read" },
    { key: "qc-drawings", label: "Drawing management", icon: "Ruler", path: "/drawings", requiredAction: "read" },
    { key: "qc-procedures", label: "Procedure library", icon: "BookOpen", path: "/procedures", requiredAction: "read" },
    { key: "qc-transmittals", label: "Transmittals", icon: "Send", path: "/transmittals", requiredAction: "read" },

    // --- Reports (unchanged) ---
    { key: "qc-reports", label: "Reports", icon: "BarChart3", path: "/reports", requiredAction: "read" },
  ],
},
```

### 2.3 — Updated Production sidebar items (add 2 document pages after dispatch)

```typescript
production: {
  code: "production",
  name: "Production",
  icon: "Factory",
  basePath: "/production",
  color: "amber",
  description: "Job cards, scheduling, shop floor, welding, PWHT, hydro, dispatch, approvals, archive",
  sidebarItems: [
    // --- Existing Production pages (unchanged) ---
    { key: "prod-dashboard", label: "Dashboard", icon: "LayoutDashboard", path: "/dashboard", requiredAction: "read" },
    { key: "prod-job-cards", label: "Job cards", icon: "FileText", path: "/job-cards", requiredAction: "read" },
    { key: "prod-work-centers", label: "Work centers", icon: "Building", path: "/work-centers", requiredAction: "read" },
    { key: "prod-schedule", label: "Production schedule", icon: "CalendarRange", path: "/schedule", requiredAction: "read" },
    { key: "prod-shop-floor", label: "Shop floor tracking", icon: "Tablet", path: "/shop-floor", requiredAction: "read" },
    { key: "prod-welding-log", label: "Welding log", icon: "Flame", path: "/welding-log", requiredAction: "read" },
    { key: "prod-pwht", label: "PWHT management", icon: "Thermometer", path: "/pwht", requiredAction: "read" },
    { key: "prod-hydro", label: "Hydrostatic testing", icon: "Droplets", path: "/hydro-test", requiredAction: "read" },
    { key: "prod-surface", label: "Surface treatment", icon: "Paintbrush", path: "/surface-treatment", requiredAction: "read" },
    { key: "prod-dispatch", label: "Dispatch", icon: "Truck", path: "/dispatch", requiredAction: "read" },

    // --- Document management pages (moved from standalone module) ---
    { key: "prod-approvals", label: "Approval workflows", icon: "CheckCheck", path: "/approvals", requiredAction: "read" },
    { key: "prod-archive", label: "Document archive", icon: "Archive", path: "/archive", requiredAction: "read" },

    // --- Reports (unchanged) ---
    // (Production reports page does not exist as a separate item in the original — added for consistency)
  ],
},
```

### 2.4 — Remove document management module entry

Delete the entire `documents: { ... }` block from MODULE_REGISTRY.

---

## 3. Updated roles.ts

**Claude Code instruction:** Remove the `documents` key from every role's `moduleAccess` object. The permissions that were `documents: "full"` or `documents: "view"` are now covered by the host module's access level.

### Permission inheritance rule

Since document pages now live inside QC and Production, their access follows the host module's permission:

| Role | QC access | Production access | Effect on document pages |
|------|-----------|-------------------|-------------------------|
| super_admin | full | full | Full access to all doc pages in both modules |
| project_manager | view | view | View-only on all doc pages — can see MDR, drawings, transmittals, approvals, archive but cannot create/edit |
| qc_engineer | full | view | Full access to QC doc pages (MDR, drawings, procedures, transmittals). View-only on Production doc pages (approvals, archive) |
| production_manager | view | full | View-only on QC doc pages. Full access to Production doc pages (approvals, archive) |
| procurement_officer | none | none | No access to any doc pages (unchanged — they never had doc access) |
| store_keeper | view | view | View-only on all doc pages |
| shop_operator | none | view | Can view Production doc pages only (approvals, archive) — cannot access QC doc pages |
| finance_manager | none | view | Can view Production doc pages (for invoice-related document verification) |
| hse_officer | view | view | View-only on all doc pages (for audit evidence) |
| management | view | view | View-only across everything |

### Updated role definition example (qc_engineer)

```typescript
qc_engineer: {
  slug: "qc_engineer",
  name: "QC engineer",
  description: "Full quality control including document register, drawings, procedures, transmittals. View access to stores, production, HSE.",
  isSystemRole: true,
  twoFactorRequired: false,
  moduleAccess: {
    project_mgmt: "view",
    procurement: "none",
    stores: "view",
    qc: "full",         // ← Now includes MDR, drawings, procedures, transmittals
    production: "view",  // ← Now includes approval workflows, archive (view-only)
    finance: "none",
    // documents: "full",  ← REMOVED — absorbed into qc: "full"
    hse: "view",
    maintenance: "view",
    analytics: "view",
  },
},
```

---

## 4. Shared document service

**Claude Code instruction:** Create at `apps/api/src/shared/services/documentService.ts`.

This service is imported by both QC and Production controllers. It contains all document management business logic — revision control, full-text search, approval engine, archive, and retrieval. The database tables remain unchanged.

### 4.1 — Service interface

```typescript
export class DocumentService {
  // --- MDR (called from QC routes) ---
  async getMDR(projectId: string, filters?: MDRFilters): Promise<MDREntry[]>
  async createMDREntry(projectId: string, data: CreateMDRInput): Promise<MDREntry>
  async updateMDREntry(entryId: string, data: UpdateMDRInput): Promise<MDREntry>
  async getMDRCompleteness(projectId: string): Promise<MDRCompleteness>

  // --- Drawing management (called from QC routes) ---
  async uploadDrawing(projectId: string, file: UploadedFile, metadata: DrawingMetadata): Promise<Drawing>
  async createRevision(drawingId: string, file: UploadedFile, changeDescription: string): Promise<DrawingRevision>
  async getLatestRevision(drawingId: string): Promise<DrawingRevision>
  async compareRevisions(revA: string, revB: string): Promise<RevisionDiff>
  async markSuperseded(drawingId: string, revisionNumber: number): Promise<void>
  async notifyShopFloor(drawingId: string, newRevisionId: string): Promise<void>

  // --- Procedure library (called from QC routes) ---
  async getProcedures(filters?: ProcedureFilters): Promise<Procedure[]>
  async createProcedure(data: CreateProcedureInput): Promise<Procedure>
  async updateProcedure(procedureId: string, data: UpdateProcedureInput): Promise<Procedure>
  async recordAcknowledgment(procedureId: string, userId: string): Promise<void>
  async getProceduresDueForReview(): Promise<Procedure[]>

  // --- Transmittals (called from QC routes) ---
  async createTransmittal(data: CreateTransmittalInput): Promise<Transmittal>
  async getTransmittals(projectId: string, direction: "outgoing" | "incoming"): Promise<Transmittal[]>
  async updateTransmittalStatus(transmittalId: string, status: string): Promise<Transmittal>
  async generateCoverSheet(transmittalId: string): Promise<Buffer> // PDF generation
  async sendTransmittalEmail(transmittalId: string, recipients: string[]): Promise<void>

  // --- Approval workflows (called from Production routes) ---
  async getApprovalChains(documentType: string): Promise<ApprovalChain[]>
  async createApprovalChain(data: CreateApprovalChainInput): Promise<ApprovalChain>
  async submitForApproval(documentId: string, chainId: string): Promise<ApprovalInstance>
  async approveStep(instanceId: string, stepId: string, userId: string, comments?: string): Promise<ApprovalInstance>
  async rejectStep(instanceId: string, stepId: string, userId: string, reason: string): Promise<ApprovalInstance>
  async getMyPendingApprovals(userId: string): Promise<ApprovalInstance[]>
  async getApprovalHistory(documentId: string): Promise<ApprovalInstance[]>
  async escalateOverdue(slaHours: number): Promise<void>

  // --- Archive & search (called from Production routes) ---
  async searchDocuments(query: string, filters?: SearchFilters): Promise<SearchResult[]>
  async archiveProject(projectId: string): Promise<ArchiveResult>
  async retrieveFromArchive(archiveId: string): Promise<Document>
  async bulkDownload(documentIds: string[]): Promise<Buffer> // ZIP generation
  async getRetentionPolicy(): Promise<RetentionPolicy[]>
  async setRetentionPolicy(docType: string, retentionYears: number): Promise<void>
}
```

### 4.2 — Route registration

QC routes import DocumentService for MDR, drawings, procedures, and transmittals:

```typescript
// apps/api/src/modules/qc/qc.routes.ts
import { DocumentService } from "../../shared/services/documentService";

const docService = new DocumentService();

// MDR routes — nested under QC
router.get("/mdr/:projectId", authenticate, authorize("qc", "read"), async (req, res) => {
  const entries = await docService.getMDR(req.params.projectId);
  res.json(entries);
});

router.post("/mdr/:projectId", authenticate, authorize("qc", "create"), async (req, res) => {
  const entry = await docService.createMDREntry(req.params.projectId, req.body);
  res.status(201).json(entry);
});

// Drawing routes — nested under QC
router.post("/drawings/:projectId", authenticate, authorize("qc", "create"), upload.single("file"), async (req, res) => {
  const drawing = await docService.uploadDrawing(req.params.projectId, req.file, req.body);
  res.status(201).json(drawing);
});

// ... transmittals, procedures follow same pattern
```

Production routes import DocumentService for approvals and archive:

```typescript
// apps/api/src/modules/production/production.routes.ts
import { DocumentService } from "../../shared/services/documentService";

const docService = new DocumentService();

// Approval routes — nested under Production
router.get("/approvals/pending", authenticate, authorize("production", "read"), async (req, res) => {
  const pending = await docService.getMyPendingApprovals(req.user!.userId);
  res.json(pending);
});

router.put("/approvals/:instanceId/approve", authenticate, authorize("production", "approve"), async (req, res) => {
  const result = await docService.approveStep(req.params.instanceId, req.body.stepId, req.user!.userId, req.body.comments);
  res.json(result);
});

// Archive routes — nested under Production
router.get("/archive/search", authenticate, authorize("production", "read"), async (req, res) => {
  const results = await docService.searchDocuments(req.query.q as string, req.query);
  res.json(results);
});

router.post("/archive/:projectId", authenticate, authorize("production", "create"), async (req, res) => {
  const result = await docService.archiveProject(req.params.projectId);
  res.json(result);
});
```

---

## 5. Updated React Router configuration

**Claude Code instruction:** In `apps/web/src/app/routes.tsx`, remove the lazy import for document-management and remove its route entry. The document pages are now served by QC and Production page components.

### 5.1 — Remove document management lazy import

```typescript
// REMOVE this line:
// const DocumentManagement = lazy(() => import("../features/document-management/pages"));

// REMOVE from generateModuleRoutes — the "documents" key no longer exists in MODULE_REGISTRY
```

### 5.2 — Updated QC pages index

**Claude Code instruction:** Update `apps/web/src/features/quality-control/pages/index.tsx` to include document page routes.

```typescript
import { Routes, Route } from "react-router-dom";
import { QCDashboard } from "./QCDashboard";
import { IncomingInspection } from "./IncomingInspection";
import { InProcessInspection } from "./InProcessInspection";
import { NDEManagement } from "./NDEManagement";
import { WeldingManagement } from "./WeldingManagement";
import { NCRManagement } from "./NCRManagement";
import { TestReports } from "./TestReports";
import { DataBookCompiler } from "./DataBookCompiler";
import { QCReports } from "./QCReports";

// Document pages (moved from document-management module)
import { DocumentRegisterMDR } from "./DocumentRegisterMDR";
import { DrawingManagement } from "./DrawingManagement";
import { ProcedureLibrary } from "./ProcedureLibrary";
import { Transmittals } from "./Transmittals";

export default function QualityControlPages() {
  return (
    <Routes>
      <Route path="/dashboard" element={<QCDashboard />} />
      <Route path="/incoming" element={<IncomingInspection />} />
      <Route path="/in-process" element={<InProcessInspection />} />
      <Route path="/nde" element={<NDEManagement />} />
      <Route path="/welding" element={<WeldingManagement />} />
      <Route path="/ncr" element={<NCRManagement />} />
      <Route path="/test-reports" element={<TestReports />} />
      <Route path="/databook" element={<DataBookCompiler />} />
      <Route path="/mdr" element={<DocumentRegisterMDR />} />
      <Route path="/drawings" element={<DrawingManagement />} />
      <Route path="/procedures" element={<ProcedureLibrary />} />
      <Route path="/transmittals" element={<Transmittals />} />
      <Route path="/reports" element={<QCReports />} />
    </Routes>
  );
}
```

### 5.3 — Updated Production pages index

```typescript
import { Routes, Route } from "react-router-dom";
import { ProductionDashboard } from "./ProductionDashboard";
import { JobCards } from "./JobCards";
import { WorkCenters } from "./WorkCenters";
import { ProductionSchedule } from "./ProductionSchedule";
import { ShopFloorTracking } from "./ShopFloorTracking";
import { WeldingLog } from "./WeldingLog";
import { PWHTManagement } from "./PWHTManagement";
import { HydrostaticTesting } from "./HydrostaticTesting";
import { SurfaceTreatment } from "./SurfaceTreatment";
import { Dispatch } from "./Dispatch";

// Document pages (moved from document-management module)
import { ApprovalWorkflows } from "./ApprovalWorkflows";
import { DocumentArchive } from "./DocumentArchive";

export default function ProductionPages() {
  return (
    <Routes>
      <Route path="/dashboard" element={<ProductionDashboard />} />
      <Route path="/job-cards" element={<JobCards />} />
      <Route path="/work-centers" element={<WorkCenters />} />
      <Route path="/schedule" element={<ProductionSchedule />} />
      <Route path="/shop-floor" element={<ShopFloorTracking />} />
      <Route path="/welding-log" element={<WeldingLog />} />
      <Route path="/pwht" element={<PWHTManagement />} />
      <Route path="/hydro-test" element={<HydrostaticTesting />} />
      <Route path="/surface-treatment" element={<SurfaceTreatment />} />
      <Route path="/dispatch" element={<Dispatch />} />
      <Route path="/approvals" element={<ApprovalWorkflows />} />
      <Route path="/archive" element={<DocumentArchive />} />
    </Routes>
  );
}
```

---

## 6. Updated feature folder structure

### 6.1 — Delete standalone document management folder

```bash
# Remove the standalone module
rm -rf apps/web/src/features/document-management/
```

### 6.2 — Add document components to QC feature folder

```
apps/web/src/features/quality-control/
├── components/
│   ├── ... (existing QC components)
│   ├── documents/                    ← NEW subfolder
│   │   ├── MDRTable.tsx             # MDR register table with filters
│   │   ├── MDRCompleteness.tsx      # Completeness checker widget
│   │   ├── DrawingUploader.tsx      # Upload with metadata form
│   │   ├── RevisionComparator.tsx   # Side-by-side revision diff
│   │   ├── RevisionHistory.tsx      # Version timeline
│   │   ├── ProcedureCard.tsx        # Procedure with acknowledgment
│   │   ├── TransmittalForm.tsx      # Create/edit transmittal
│   │   ├── TransmittalTracker.tsx   # Status pipeline tracker
│   │   └── CoverSheetPreview.tsx    # Transmittal cover PDF preview
│   └── ... 
├── pages/
│   ├── ... (existing QC pages)
│   ├── DocumentRegisterMDR.tsx       ← NEW
│   ├── DrawingManagement.tsx         ← NEW
│   ├── ProcedureLibrary.tsx          ← NEW
│   └── Transmittals.tsx              ← NEW
```

### 6.3 — Add document components to Production feature folder

```
apps/web/src/features/production/
├── components/
│   ├── ... (existing Production components)
│   ├── documents/                    ← NEW subfolder
│   │   ├── ApprovalChainBuilder.tsx  # Drag-and-drop chain editor
│   │   ├── ApprovalQueue.tsx        # Pending approvals list
│   │   ├── ApprovalTimeline.tsx     # Step-by-step approval history
│   │   ├── DocumentSearch.tsx       # Full-text search interface
│   │   ├── ArchiveProjectModal.tsx  # Archive wizard
│   │   └── BulkDownloader.tsx       # Multi-file download
│   └── ...
├── pages/
│   ├── ... (existing Production pages)
│   ├── ApprovalWorkflows.tsx         ← NEW
│   └── DocumentArchive.tsx           ← NEW
```

### 6.4 — Shared document service (frontend)

```
apps/web/src/shared/services/
└── documentApi.ts                    ← NEW — shared API calls used by both modules
```

```typescript
// apps/web/src/shared/services/documentApi.ts
import { apiClient } from "./apiClient";

// MDR (routed through QC)
export const mdrApi = {
  getEntries: (projectId: string) => apiClient.get(`/qc/mdr/${projectId}`),
  createEntry: (projectId: string, data: any) => apiClient.post(`/qc/mdr/${projectId}`, data),
  updateEntry: (entryId: string, data: any) => apiClient.put(`/qc/mdr/${entryId}`, data),
  getCompleteness: (projectId: string) => apiClient.get(`/qc/mdr/${projectId}/completeness`),
};

// Drawings (routed through QC)
export const drawingsApi = {
  upload: (projectId: string, formData: FormData) => apiClient.post(`/qc/drawings/${projectId}`, formData),
  getRevisions: (drawingId: string) => apiClient.get(`/qc/drawings/${drawingId}/revisions`),
  createRevision: (drawingId: string, formData: FormData) => apiClient.post(`/qc/drawings/${drawingId}/revisions`, formData),
  compareRevisions: (revA: string, revB: string) => apiClient.get(`/qc/drawings/compare?a=${revA}&b=${revB}`),
};

// Transmittals (routed through QC)
export const transmittalsApi = {
  getAll: (projectId: string, direction: string) => apiClient.get(`/qc/transmittals/${projectId}?direction=${direction}`),
  create: (data: any) => apiClient.post(`/qc/transmittals`, data),
  updateStatus: (id: string, status: string) => apiClient.put(`/qc/transmittals/${id}/status`, { status }),
  generateCoverSheet: (id: string) => apiClient.get(`/qc/transmittals/${id}/cover-sheet`, { responseType: "blob" }),
};

// Approvals (routed through Production)
export const approvalsApi = {
  getPending: () => apiClient.get(`/production/approvals/pending`),
  approve: (instanceId: string, stepId: string, comments?: string) =>
    apiClient.put(`/production/approvals/${instanceId}/approve`, { stepId, comments }),
  reject: (instanceId: string, stepId: string, reason: string) =>
    apiClient.put(`/production/approvals/${instanceId}/reject`, { stepId, reason }),
  getHistory: (documentId: string) => apiClient.get(`/production/approvals/history/${documentId}`),
};

// Archive (routed through Production)
export const archiveApi = {
  search: (query: string, filters?: any) => apiClient.get(`/production/archive/search`, { params: { q: query, ...filters } }),
  archiveProject: (projectId: string) => apiClient.post(`/production/archive/${projectId}`),
  bulkDownload: (documentIds: string[]) => apiClient.post(`/production/archive/bulk-download`, { documentIds }, { responseType: "blob" }),
};
```

---

## 7. Updated dashboard widgets

### 7.1 — QC dashboard additions

Add these widgets to the QC dashboard page:

```typescript
// In QCDashboard.tsx — add to the existing dashboard layout

// Widget: Pending document approvals (shows documents waiting for QC sign-off)
<DashboardWidget title="Documents pending my review" icon="FileCheck">
  {pendingDocs.map(doc => (
    <DocApprovalItem
      key={doc.id}
      title={doc.title}
      type={doc.type}
      submittedBy={doc.submittedBy}
      submittedAt={doc.submittedAt}
      onApprove={() => navigate(`/quality-control/transmittals?doc=${doc.id}`)}
    />
  ))}
</DashboardWidget>

// Widget: Overdue transmittals (transmittals past response deadline)
<DashboardWidget title="Overdue transmittals" icon="Clock" variant="warning">
  {overdueTransmittals.map(t => (
    <TransmittalAlert
      key={t.id}
      transmittalNo={t.number}
      client={t.client}
      daysOverdue={t.daysOverdue}
      onClick={() => navigate(`/quality-control/transmittals?id=${t.id}`)}
    />
  ))}
</DashboardWidget>

// Widget: MDR completeness (% of deliverables submitted per project)
<DashboardWidget title="MDR completeness" icon="Table2">
  {projects.map(p => (
    <CompletenessBar
      key={p.id}
      project={p.code}
      submitted={p.submittedDocs}
      total={p.totalDocs}
      percentage={p.completionPct}
    />
  ))}
</DashboardWidget>
```

### 7.2 — Production dashboard additions

```typescript
// In ProductionDashboard.tsx — add to existing layout

// Widget: Documents pending stage sign-off
<DashboardWidget title="Awaiting sign-off" icon="CheckCheck">
  {pendingSignoffs.map(doc => (
    <SignoffItem
      key={doc.id}
      jobCard={doc.jobCardNumber}
      stage={doc.stageName}
      document={doc.documentTitle}
      waitingSince={doc.submittedAt}
      onAction={() => navigate(`/production/approvals?doc=${doc.id}`)}
    />
  ))}
</DashboardWidget>

// Widget: Recent archived documents
<DashboardWidget title="Recently archived" icon="Archive">
  {recentArchived.map(doc => (
    <ArchivedDocItem
      key={doc.id}
      project={doc.projectCode}
      title={doc.title}
      archivedAt={doc.archivedAt}
    />
  ))}
</DashboardWidget>
```

---

## 8. Updated cross-module integration map

Remove all references to the standalone document management module. Update integration descriptions:

| From → To | Data exchanged |
|-----------|---------------|
| QC → QC (internal) | Inspection reports auto-registered in MDR, NDE reports linked to transmittals |
| Production → QC | Job card completion triggers document approval chain, PWHT charts auto-added to MDR |
| QC → Production | Drawing revision notifications sent to production floor, procedure updates linked to job cards |
| Production → Production (internal) | Stage sign-off triggers approval workflow, dispatch triggers project archive |
| Project mgmt → QC | Project creation auto-generates MDR template from vessel type |
| QC → All modules | Document search available cross-module via shared service API |

---

## 9. Claude Code execution steps for this change

```
1. Update packages/shared/src/constants/modules.ts — remove documents module, add sidebar items to QC and Production
2. Update packages/shared/src/constants/roles.ts — remove documents from all moduleAccess objects
3. Delete apps/web/src/features/document-management/ folder
4. Create apps/api/src/shared/services/documentService.ts with the service interface
5. Create apps/web/src/shared/services/documentApi.ts with frontend API calls
6. Add document page routes to QC pages index (apps/web/src/features/quality-control/pages/index.tsx)
7. Add document page routes to Production pages index (apps/web/src/features/production/pages/index.tsx)
8. Create the 4 new page components in QC: DocumentRegisterMDR, DrawingManagement, ProcedureLibrary, Transmittals
9. Create the 2 new page components in Production: ApprovalWorkflows, DocumentArchive
10. Create document sub-component folders in both QC and Production feature folders
11. Add document API routes to QC router (apps/api/src/modules/qc/qc.routes.ts)
12. Add document API routes to Production router (apps/api/src/modules/production/production.routes.ts)
13. Update QCDashboard.tsx with MDR completeness, pending approvals, overdue transmittals widgets
14. Update ProductionDashboard.tsx with sign-off queue and recent archive widgets
15. Update routes.tsx — remove document-management lazy import and route
16. Run full test suite — verify all 83 pages still load, document CRUD works through both QC and Production routes
17. Update ERP_Module_Feature_Catalog.md — merge document management section into QC and Production sections
```

---

*End of update*
