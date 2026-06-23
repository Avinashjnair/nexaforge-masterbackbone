# Finance & costing module — Complete implementation plan

**Module code:** `finance`  
**Base path:** `/finance`  
**Role access:** Full → finance_manager, super_admin | View → project_manager, procurement_officer, production_manager, management  
**Prerequisite modules:** Project management, procurement, stores, production (these feed cost data into finance)

---

## Table of contents

1. Data architecture (Prisma schema — 14 tables)
2. Business logic rules and calculation engines
3. Page-by-page implementation (7 sidebar pages, 40+ sub-features)
4. API endpoints (42 routes)
5. Inter-module integration hooks (auto-posting from 4 modules)
6. Frontend components and state management
7. Reports and export specifications
8. Testing checklist
9. Claude Code execution sequence

---

## 1. Data architecture

### 1.1 — Prisma schema for finance module

**Claude Code instruction:** Append these models to `apps/api/prisma/schema.prisma`, then run `npx prisma migrate dev --name add_finance_module`.

```prisma
// ============================================================
// FINANCE MODULE TABLES
// ============================================================

// -- Project budget ------------------------------------------

model ProjectBudget {
  id              String   @id @default(uuid()) @db.Uuid
  projectId       String   @map("project_id") @db.Uuid
  revisionNumber  Int      @default(1) @map("revision_number")
  status          String   @default("draft") @db.VarChar(20)
  // Status: draft → submitted → approved → revised

  // Budget line totals (in base currency, smallest unit = paisa)
  materialBudget      Decimal  @default(0) @map("material_budget") @db.Decimal(14, 2)
  labourBudget        Decimal  @default(0) @map("labour_budget") @db.Decimal(14, 2)
  consumablesBudget   Decimal  @default(0) @map("consumables_budget") @db.Decimal(14, 2)
  subcontractBudget   Decimal  @default(0) @map("subcontract_budget") @db.Decimal(14, 2)
  freightBudget       Decimal  @default(0) @map("freight_budget") @db.Decimal(14, 2)
  overheadBudget      Decimal  @default(0) @map("overhead_budget") @db.Decimal(14, 2)
  contingencyPct      Decimal  @default(5) @map("contingency_pct") @db.Decimal(5, 2)
  marginTargetPct     Decimal  @default(15) @map("margin_target_pct") @db.Decimal(5, 2)

  totalBudget         Decimal  @default(0) @map("total_budget") @db.Decimal(14, 2)
  contractValue       Decimal  @default(0) @map("contract_value") @db.Decimal(14, 2)

  notes           String?  @db.Text
  preparedBy      String?  @map("prepared_by") @db.Uuid
  approvedBy      String?  @map("approved_by") @db.Uuid
  approvedAt      DateTime? @map("approved_at")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  lineItems       BudgetLineItem[]
  changeOrderId   String?  @map("change_order_id") @db.Uuid

  @@unique([projectId, revisionNumber])
  @@index([projectId])
  @@map("project_budgets")
}

model BudgetLineItem {
  id              String   @id @default(uuid()) @db.Uuid
  budgetId        String   @map("budget_id") @db.Uuid
  category        String   @db.VarChar(30)
  // Categories: material, labour, consumables, subcontract, freight, overhead, contingency
  description     String   @db.VarChar(255)
  bomItemId       String?  @map("bom_item_id") @db.Uuid
  quantity        Decimal  @default(0) @db.Decimal(12, 3)
  unitOfMeasure   String?  @map("unit_of_measure") @db.VarChar(20)
  unitRate        Decimal  @default(0) @map("unit_rate") @db.Decimal(12, 2)
  totalAmount     Decimal  @default(0) @map("total_amount") @db.Decimal(14, 2)
  remarks         String?  @db.VarChar(500)

  budget          ProjectBudget @relation(fields: [budgetId], references: [id], onDelete: Cascade)

  @@index([budgetId])
  @@map("budget_line_items")
}

// -- Job cost ledger -----------------------------------------

model JobCostEntry {
  id              String   @id @default(uuid()) @db.Uuid
  projectId       String   @map("project_id") @db.Uuid
  jobCardId       String?  @map("job_card_id") @db.Uuid
  category        String   @db.VarChar(30)
  // Categories: material, labour, consumables, subcontract, freight, overhead

  description     String   @db.VarChar(255)
  referenceType   String   @map("reference_type") @db.VarChar(30)
  // Reference types: material_issue, timesheet, po_grn, subcontract_invoice, freight_invoice, overhead_allocation
  referenceId     String   @map("reference_id") @db.VarChar(50)
  // ID of the source record (material issue ID, timesheet ID, GRN ID, etc.)

  quantity        Decimal  @default(0) @db.Decimal(12, 3)
  unitRate        Decimal  @default(0) @map("unit_rate") @db.Decimal(12, 2)
  totalAmount     Decimal  @default(0) @map("total_amount") @db.Decimal(14, 2)
  currency        String   @default("INR") @db.VarChar(3)

  // Traceability fields
  materialGrade   String?  @map("material_grade") @db.VarChar(50)
  heatNumber      String?  @map("heat_number") @db.VarChar(50)
  poNumber        String?  @map("po_number") @db.VarChar(30)
  vendorId        String?  @map("vendor_id") @db.Uuid
  employeeCode    String?  @map("employee_code") @db.VarChar(20)

  postingDate     DateTime @map("posting_date")
  isReversed      Boolean  @default(false) @map("is_reversed")
  reversedById    String?  @map("reversed_by_id") @db.Uuid
  reversalReason  String?  @map("reversal_reason") @db.VarChar(255)

  createdAt       DateTime @default(now()) @map("created_at")
  createdBy       String?  @map("created_by") @db.Uuid

  @@index([projectId])
  @@index([jobCardId])
  @@index([category])
  @@index([postingDate])
  @@index([referenceType, referenceId])
  @@map("job_cost_entries")
}

// -- Vendor invoices (accounts payable) ----------------------

model VendorInvoice {
  id                String   @id @default(uuid()) @db.Uuid
  invoiceNumber     String   @map("invoice_number") @db.VarChar(50)
  vendorId          String   @map("vendor_id") @db.Uuid
  vendorName        String   @map("vendor_name") @db.VarChar(150)
  projectId         String?  @map("project_id") @db.Uuid
  poId              String?  @map("po_id") @db.Uuid
  grnId             String?  @map("grn_id") @db.Uuid

  invoiceDate       DateTime @map("invoice_date")
  receivedDate      DateTime @map("received_date")
  dueDate           DateTime @map("due_date")

  // Amounts
  subtotal          Decimal  @db.Decimal(14, 2)
  taxType           String?  @map("tax_type") @db.VarChar(20) // CGST+SGST, IGST
  cgstAmount        Decimal  @default(0) @map("cgst_amount") @db.Decimal(12, 2)
  sgstAmount        Decimal  @default(0) @map("sgst_amount") @db.Decimal(12, 2)
  igstAmount        Decimal  @default(0) @map("igst_amount") @db.Decimal(12, 2)
  tdsRate           Decimal  @default(0) @map("tds_rate") @db.Decimal(5, 2)
  tdsAmount         Decimal  @default(0) @map("tds_amount") @db.Decimal(12, 2)
  totalAmount       Decimal  @map("total_amount") @db.Decimal(14, 2)
  netPayable        Decimal  @map("net_payable") @db.Decimal(14, 2)

  // Three-way match
  poMatchStatus     String   @default("pending") @map("po_match_status") @db.VarChar(20)
  grnMatchStatus    String   @default("pending") @map("grn_match_status") @db.VarChar(20)
  matchVariance     Decimal  @default(0) @map("match_variance") @db.Decimal(12, 2)
  // Match statuses: pending, matched, mismatch, waived

  status            String   @default("received") @db.VarChar(20)
  // Statuses: received → verified → approved → scheduled → paid → cancelled

  // Advance / retention
  advancePaid       Decimal  @default(0) @map("advance_paid") @db.Decimal(14, 2)
  retentionHeld     Decimal  @default(0) @map("retention_held") @db.Decimal(14, 2)
  retentionDueDate  DateTime? @map("retention_due_date")

  verifiedBy        String?  @map("verified_by") @db.Uuid
  verifiedAt        DateTime? @map("verified_at")
  approvedBy        String?  @map("approved_by") @db.Uuid
  approvedAt        DateTime? @map("approved_at")
  remarks           String?  @db.Text

  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  payments          PaymentRecord[]
  lineItems         VendorInvoiceLine[]

  @@unique([vendorId, invoiceNumber])
  @@index([vendorId])
  @@index([projectId])
  @@index([status])
  @@index([dueDate])
  @@map("vendor_invoices")
}

model VendorInvoiceLine {
  id              String   @id @default(uuid()) @db.Uuid
  invoiceId       String   @map("invoice_id") @db.Uuid
  description     String   @db.VarChar(255)
  poLineNumber    Int?     @map("po_line_number")
  quantity        Decimal  @db.Decimal(12, 3)
  unitRate        Decimal  @map("unit_rate") @db.Decimal(12, 2)
  amount          Decimal  @db.Decimal(14, 2)
  hsnCode         String?  @map("hsn_code") @db.VarChar(10)
  gstRate         Decimal  @default(18) @map("gst_rate") @db.Decimal(5, 2)

  // Match fields
  poQuantity      Decimal? @map("po_quantity") @db.Decimal(12, 3)
  grnQuantity     Decimal? @map("grn_quantity") @db.Decimal(12, 3)
  varianceQty     Decimal? @map("variance_qty") @db.Decimal(12, 3)

  invoice         VendorInvoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@index([invoiceId])
  @@map("vendor_invoice_lines")
}

// -- Client invoices (accounts receivable) -------------------

model ClientInvoice {
  id                String   @id @default(uuid()) @db.Uuid
  invoiceNumber     String   @unique @map("invoice_number") @db.VarChar(30)
  invoiceType       String   @map("invoice_type") @db.VarChar(20)
  // Types: proforma, tax_invoice, credit_note, debit_note
  projectId         String   @map("project_id") @db.Uuid
  milestoneId       String?  @map("milestone_id") @db.Uuid

  invoiceDate       DateTime @map("invoice_date")
  dueDate           DateTime @map("due_date")

  // Amounts
  subtotal          Decimal  @db.Decimal(14, 2)
  cgstAmount        Decimal  @default(0) @map("cgst_amount") @db.Decimal(12, 2)
  sgstAmount        Decimal  @default(0) @map("sgst_amount") @db.Decimal(12, 2)
  igstAmount        Decimal  @default(0) @map("igst_amount") @db.Decimal(12, 2)
  totalAmount       Decimal  @map("total_amount") @db.Decimal(14, 2)

  status            String   @default("draft") @db.VarChar(20)
  // Statuses: draft → approved → sent → partially_paid → paid → cancelled

  amountReceived    Decimal  @default(0) @map("amount_received") @db.Decimal(14, 2)
  balanceDue        Decimal  @default(0) @map("balance_due") @db.Decimal(14, 2)

  clientName        String   @map("client_name") @db.VarChar(150)
  clientGstin       String?  @map("client_gstin") @db.VarChar(20)
  billingAddress    String?  @map("billing_address") @db.Text

  approvedBy        String?  @map("approved_by") @db.Uuid
  approvedAt        DateTime? @map("approved_at")
  sentAt            DateTime? @map("sent_at")
  remarks           String?  @db.Text

  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  receipts          ClientReceipt[]
  lineItems         ClientInvoiceLine[]

  @@index([projectId])
  @@index([status])
  @@index([dueDate])
  @@map("client_invoices")
}

model ClientInvoiceLine {
  id              String   @id @default(uuid()) @db.Uuid
  invoiceId       String   @map("invoice_id") @db.Uuid
  description     String   @db.VarChar(255)
  quantity        Decimal  @default(1) @db.Decimal(12, 3)
  unitRate        Decimal  @map("unit_rate") @db.Decimal(14, 2)
  amount          Decimal  @db.Decimal(14, 2)
  hsnCode         String?  @map("hsn_code") @db.VarChar(10)
  gstRate         Decimal  @default(18) @map("gst_rate") @db.Decimal(5, 2)
  sacCode         String?  @map("sac_code") @db.VarChar(10)

  invoice         ClientInvoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@index([invoiceId])
  @@map("client_invoice_lines")
}

// -- Payment records -----------------------------------------

model PaymentRecord {
  id              String   @id @default(uuid()) @db.Uuid
  direction       String   @db.VarChar(10) // outgoing (vendor), incoming (client)
  vendorInvoiceId String?  @map("vendor_invoice_id") @db.Uuid
  clientReceiptId String?  @map("client_receipt_id") @db.Uuid

  paymentDate     DateTime @map("payment_date")
  amount          Decimal  @db.Decimal(14, 2)
  paymentMode     String   @map("payment_mode") @db.VarChar(20)
  // Modes: neft, rtgs, cheque, upi, cash, lc, bank_guarantee
  referenceNumber String   @map("reference_number") @db.VarChar(50)
  bankName        String?  @map("bank_name") @db.VarChar(100)
  remarks         String?  @db.VarChar(500)

  status          String   @default("completed") @db.VarChar(20)
  // Statuses: pending, completed, bounced, reversed

  approvedBy      String?  @map("approved_by") @db.Uuid
  createdAt       DateTime @default(now()) @map("created_at")
  createdBy       String?  @map("created_by") @db.Uuid

  vendorInvoice   VendorInvoice? @relation(fields: [vendorInvoiceId], references: [id])

  @@index([vendorInvoiceId])
  @@index([paymentDate])
  @@map("payment_records")
}

// -- Client receipts -----------------------------------------

model ClientReceipt {
  id              String   @id @default(uuid()) @db.Uuid
  clientInvoiceId String   @map("client_invoice_id") @db.Uuid
  receiptDate     DateTime @map("receipt_date")
  amount          Decimal  @db.Decimal(14, 2)
  paymentMode     String   @map("payment_mode") @db.VarChar(20)
  referenceNumber String   @map("reference_number") @db.VarChar(50)
  bankName        String?  @map("bank_name") @db.VarChar(100)
  tdsDeducted     Decimal  @default(0) @map("tds_deducted") @db.Decimal(12, 2)
  remarks         String?  @db.VarChar(500)
  createdAt       DateTime @default(now()) @map("created_at")
  createdBy       String?  @map("created_by") @db.Uuid

  clientInvoice   ClientInvoice @relation(fields: [clientInvoiceId], references: [id])

  @@index([clientInvoiceId])
  @@map("client_receipts")
}

// -- Billing milestones --------------------------------------

model BillingMilestone {
  id              String   @id @default(uuid()) @db.Uuid
  projectId       String   @map("project_id") @db.Uuid
  sequenceNumber  Int      @map("sequence_number")
  name            String   @db.VarChar(150)
  description     String?  @db.VarChar(500)

  percentageOfContract Decimal @map("percentage_of_contract") @db.Decimal(5, 2)
  milestoneAmount      Decimal @map("milestone_amount") @db.Decimal(14, 2)

  // Link to production stage that triggers this milestone
  linkedStageCode      String? @map("linked_stage_code") @db.VarChar(30)
  // Stages: material_procurement, rolling_complete, welding_complete,
  //         nde_complete, pwht_complete, hydro_test, painting_complete, dispatch

  status          String   @default("pending") @db.VarChar(20)
  // Statuses: pending → achieved → invoice_raised → paid

  achievedAt      DateTime? @map("achieved_at")
  achievedBy      String?   @map("achieved_by") @db.Uuid
  invoiceId       String?   @map("invoice_id") @db.Uuid

  clientCertRequired  Boolean @default(true) @map("client_cert_required")
  clientCertReceivedAt DateTime? @map("client_cert_received_at")

  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@unique([projectId, sequenceNumber])
  @@index([projectId])
  @@index([status])
  @@map("billing_milestones")
}

// -- Bank guarantees -----------------------------------------

model BankGuarantee {
  id              String   @id @default(uuid()) @db.Uuid
  projectId       String   @map("project_id") @db.Uuid
  bgNumber        String   @unique @map("bg_number") @db.VarChar(50)
  bgType          String   @map("bg_type") @db.VarChar(30)
  // Types: performance, advance_payment, retention, bid_bond, warranty
  issuingBank     String   @map("issuing_bank") @db.VarChar(100)
  amount          Decimal  @db.Decimal(14, 2)
  currency        String   @default("INR") @db.VarChar(3)
  issueDate       DateTime @map("issue_date")
  expiryDate      DateTime @map("expiry_date")
  claimPeriod     DateTime? @map("claim_period")
  beneficiary     String   @db.VarChar(150)

  status          String   @default("active") @db.VarChar(20)
  // Statuses: active, expired, released, invoked, renewed

  renewalDate     DateTime? @map("renewal_date")
  releasedAt      DateTime? @map("released_at")
  remarks         String?  @db.Text
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@index([projectId])
  @@index([expiryDate])
  @@index([status])
  @@map("bank_guarantees")
}

// -- Overhead rates ------------------------------------------

model OverheadRate {
  id              String   @id @default(uuid()) @db.Uuid
  effectiveFrom   DateTime @map("effective_from")
  effectiveTo     DateTime? @map("effective_to")
  ratePerLabourHour Decimal @map("rate_per_labour_hour") @db.Decimal(10, 2)
  description     String?  @db.VarChar(255)
  approvedBy      String?  @map("approved_by") @db.Uuid
  createdAt       DateTime @default(now()) @map("created_at")

  @@index([effectiveFrom])
  @@map("overhead_rates")
}

// -- Labour rates --------------------------------------------

model LabourRate {
  id              String   @id @default(uuid()) @db.Uuid
  tradeCategory   String   @map("trade_category") @db.VarChar(30)
  // Categories: welder_6g, welder_tig, welder_smaw, fitter, helper,
  //             qc_inspector, painter, rigger, crane_operator, supervisor
  ratePerHour     Decimal  @map("rate_per_hour") @db.Decimal(10, 2)
  overtimeMultiplier Decimal @default(1.5) @map("overtime_multiplier") @db.Decimal(4, 2)
  effectiveFrom   DateTime @map("effective_from")
  effectiveTo     DateTime? @map("effective_to")
  createdAt       DateTime @default(now()) @map("created_at")

  @@unique([tradeCategory, effectiveFrom])
  @@index([tradeCategory])
  @@map("labour_rates")
}
```

---

## 2. Business logic rules and calculation engines

### 2.1 — Cost accumulation engine

This is the core financial brain. Every material issue, labour booking, and PO receipt automatically posts a `JobCostEntry`. No manual data entry.

**Claude Code instruction:** Write to `apps/api/src/modules/finance/engines/costAccumulator.ts`.

```typescript
import { prisma } from "../../../lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export class CostAccumulator {

  /**
   * Called by Stores module when material is issued to production.
   * Trigger: POST /api/stores/material-issue
   */
  async postMaterialIssue(params: {
    projectId: string;
    jobCardId: string;
    materialIssueId: string;
    description: string;
    materialGrade: string;
    heatNumber: string;
    poNumber: string;
    vendorId: string;
    quantity: number;
    unitRate: number;     // Weighted average cost from inventory
    postingDate: Date;
    createdBy: string;
  }) {
    return prisma.jobCostEntry.create({
      data: {
        projectId: params.projectId,
        jobCardId: params.jobCardId,
        category: "material",
        description: params.description,
        referenceType: "material_issue",
        referenceId: params.materialIssueId,
        quantity: params.quantity,
        unitRate: params.unitRate,
        totalAmount: params.quantity * params.unitRate,
        materialGrade: params.materialGrade,
        heatNumber: params.heatNumber,
        poNumber: params.poNumber,
        vendorId: params.vendorId,
        postingDate: params.postingDate,
        createdBy: params.createdBy,
      },
    });
  }

  /**
   * Called by Production module when operator logs time against a job card.
   * Trigger: PUT /api/production/job-cards/:id/log-time
   */
  async postLabourTime(params: {
    projectId: string;
    jobCardId: string;
    timesheetId: string;
    employeeCode: string;
    tradeCategory: string;
    normalHours: number;
    overtimeHours: number;
    postingDate: Date;
    createdBy: string;
  }) {
    // Look up current labour rate for this trade
    const rate = await prisma.labourRate.findFirst({
      where: {
        tradeCategory: params.tradeCategory,
        effectiveFrom: { lte: params.postingDate },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: params.postingDate } },
        ],
      },
      orderBy: { effectiveFrom: "desc" },
    });

    if (!rate) throw new Error(`No labour rate found for ${params.tradeCategory}`);

    const normalCost = params.normalHours * Number(rate.ratePerHour);
    const otCost = params.overtimeHours * Number(rate.ratePerHour) * Number(rate.overtimeMultiplier);
    const totalHours = params.normalHours + params.overtimeHours;
    const totalCost = normalCost + otCost;

    // Post labour cost
    const labourEntry = await prisma.jobCostEntry.create({
      data: {
        projectId: params.projectId,
        jobCardId: params.jobCardId,
        category: "labour",
        description: `${params.tradeCategory} — ${totalHours}h (${params.overtimeHours}h OT)`,
        referenceType: "timesheet",
        referenceId: params.timesheetId,
        quantity: totalHours,
        unitRate: totalCost / totalHours,
        totalAmount: totalCost,
        employeeCode: params.employeeCode,
        postingDate: params.postingDate,
        createdBy: params.createdBy,
      },
    });

    // Auto-post overhead allocation
    const overheadRate = await prisma.overheadRate.findFirst({
      where: {
        effectiveFrom: { lte: params.postingDate },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: params.postingDate } },
        ],
      },
      orderBy: { effectiveFrom: "desc" },
    });

    if (overheadRate) {
      await prisma.jobCostEntry.create({
        data: {
          projectId: params.projectId,
          jobCardId: params.jobCardId,
          category: "overhead",
          description: `Overhead allocation — ${totalHours}h × ₹${overheadRate.ratePerLabourHour}/h`,
          referenceType: "overhead_allocation",
          referenceId: params.timesheetId,
          quantity: totalHours,
          unitRate: Number(overheadRate.ratePerLabourHour),
          totalAmount: totalHours * Number(overheadRate.ratePerLabourHour),
          postingDate: params.postingDate,
          createdBy: params.createdBy,
        },
      });
    }

    return labourEntry;
  }

  /**
   * Called by Procurement module when GRN is created for subcontract services.
   * Trigger: POST /api/procurement/goods-receipt (for service POs)
   */
  async postSubcontractCost(params: {
    projectId: string;
    grnId: string;
    poNumber: string;
    vendorId: string;
    description: string;
    amount: number;
    postingDate: Date;
    createdBy: string;
  }) {
    return prisma.jobCostEntry.create({
      data: {
        projectId: params.projectId,
        category: "subcontract",
        description: params.description,
        referenceType: "po_grn",
        referenceId: params.grnId,
        quantity: 1,
        unitRate: params.amount,
        totalAmount: params.amount,
        poNumber: params.poNumber,
        vendorId: params.vendorId,
        postingDate: params.postingDate,
        createdBy: params.createdBy,
      },
    });
  }

  /**
   * Reverse a cost entry (for material returns, timesheet corrections).
   */
  async reverseEntry(entryId: string, reason: string, reversedBy: string) {
    const original = await prisma.jobCostEntry.findUnique({ where: { id: entryId } });
    if (!original) throw new Error("Cost entry not found");
    if (original.isReversed) throw new Error("Entry already reversed");

    // Mark original as reversed
    await prisma.jobCostEntry.update({
      where: { id: entryId },
      data: { isReversed: true, reversedById: reversedBy, reversalReason: reason },
    });

    // Create negative reversal entry
    return prisma.jobCostEntry.create({
      data: {
        projectId: original.projectId,
        jobCardId: original.jobCardId,
        category: original.category,
        description: `REVERSAL: ${original.description} — ${reason}`,
        referenceType: `reversal_${original.referenceType}`,
        referenceId: original.id,
        quantity: original.quantity.negated(),
        unitRate: original.unitRate,
        totalAmount: original.totalAmount.negated(),
        materialGrade: original.materialGrade,
        heatNumber: original.heatNumber,
        poNumber: original.poNumber,
        vendorId: original.vendorId,
        employeeCode: original.employeeCode,
        postingDate: new Date(),
        createdBy: reversedBy,
      },
    });
  }
}
```

### 2.2 — Variance analysis engine

**Claude Code instruction:** Write to `apps/api/src/modules/finance/engines/varianceAnalyzer.ts`.

```typescript
import { prisma } from "../../../lib/prisma";

export interface VarianceResult {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;       // budgeted - actual (positive = under budget)
  variancePct: number;    // variance as % of budget
  status: "green" | "amber" | "red";
}

export interface ProjectCostSummary {
  projectId: string;
  contractValue: number;
  totalBudget: number;
  totalActual: number;
  earnedValue: number;
  cpi: number;            // Cost performance index (EV / AC)
  cv: number;             // Cost variance (EV - AC)
  eac: number;            // Estimate at completion
  etc: number;            // Estimate to complete
  marginActual: number;   // (contract - actual) / contract × 100
  categoryBreakdown: VarianceResult[];
}

export class VarianceAnalyzer {

  async getProjectCostSummary(projectId: string): Promise<ProjectCostSummary> {
    // Get latest approved budget
    const budget = await prisma.projectBudget.findFirst({
      where: { projectId, status: "approved" },
      orderBy: { revisionNumber: "desc" },
    });

    if (!budget) throw new Error("No approved budget found for this project");

    // Get actual costs grouped by category
    const actuals = await prisma.jobCostEntry.groupBy({
      by: ["category"],
      where: { projectId, isReversed: false },
      _sum: { totalAmount: true },
    });

    const actualMap: Record<string, number> = {};
    let totalActual = 0;
    for (const a of actuals) {
      actualMap[a.category] = Number(a._sum.totalAmount) || 0;
      totalActual += actualMap[a.category];
    }

    // Build category breakdown
    const categories = [
      { key: "material", budget: Number(budget.materialBudget) },
      { key: "labour", budget: Number(budget.labourBudget) },
      { key: "consumables", budget: Number(budget.consumablesBudget) },
      { key: "subcontract", budget: Number(budget.subcontractBudget) },
      { key: "freight", budget: Number(budget.freightBudget) },
      { key: "overhead", budget: Number(budget.overheadBudget) },
    ];

    const categoryBreakdown: VarianceResult[] = categories.map((c) => {
      const actual = actualMap[c.key] || 0;
      const variance = c.budget - actual;
      const variancePct = c.budget > 0 ? (variance / c.budget) * 100 : 0;
      let status: "green" | "amber" | "red" = "green";
      if (variancePct < -15) status = "red";
      else if (variancePct < -5) status = "amber";
      return {
        category: c.key,
        budgeted: c.budget,
        actual,
        variance,
        variancePct,
        status,
      };
    });

    // Earned value calculation
    // EV = % complete × total budget (% from project schedule)
    // For now, use cost-based approximation: EV = totalBudget × (totalActual / totalBudget) — will be linked to schedule later
    const totalBudget = Number(budget.totalBudget);
    const contractValue = Number(budget.contractValue);

    // Simple EV approximation (replace with schedule-based % when production module is integrated)
    const percentComplete = totalBudget > 0 ? Math.min(totalActual / totalBudget, 1) : 0;
    const earnedValue = totalBudget * percentComplete;

    const cpi = totalActual > 0 ? earnedValue / totalActual : 1;
    const cv = earnedValue - totalActual;
    const eac = cpi > 0 ? totalBudget / cpi : totalBudget;
    const etc = eac - totalActual;
    const marginActual = contractValue > 0
      ? ((contractValue - totalActual) / contractValue) * 100
      : 0;

    return {
      projectId,
      contractValue,
      totalBudget,
      totalActual,
      earnedValue,
      cpi: Math.round(cpi * 100) / 100,
      cv: Math.round(cv * 100) / 100,
      eac: Math.round(eac * 100) / 100,
      etc: Math.round(etc * 100) / 100,
      marginActual: Math.round(marginActual * 100) / 100,
      categoryBreakdown,
    };
  }

  /**
   * Get aging analysis for payables or receivables.
   */
  async getAgingAnalysis(direction: "payable" | "receivable") {
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 86400000);
    const d60 = new Date(now.getTime() - 60 * 86400000);
    const d90 = new Date(now.getTime() - 90 * 86400000);

    if (direction === "payable") {
      const invoices = await prisma.vendorInvoice.findMany({
        where: { status: { in: ["verified", "approved", "scheduled"] } },
        select: { id: true, vendorName: true, totalAmount: true, netPayable: true, dueDate: true, invoiceNumber: true },
      });

      const buckets = { current: 0, d30: 0, d60: 0, d90plus: 0 };
      const items = invoices.map((inv) => {
        const due = inv.dueDate;
        let bucket = "current";
        if (due < d90) { bucket = "d90plus"; buckets.d90plus += Number(inv.netPayable); }
        else if (due < d60) { bucket = "d60"; buckets.d60 += Number(inv.netPayable); }
        else if (due < d30) { bucket = "d30"; buckets.d30 += Number(inv.netPayable); }
        else { buckets.current += Number(inv.netPayable); }
        return { ...inv, bucket };
      });

      return { buckets, items, total: Object.values(buckets).reduce((s, v) => s + v, 0) };
    }

    // Receivable aging
    const invoices = await prisma.clientInvoice.findMany({
      where: { status: { in: ["sent", "partially_paid"] } },
      select: { id: true, clientName: true, totalAmount: true, balanceDue: true, dueDate: true, invoiceNumber: true },
    });

    const buckets = { current: 0, d30: 0, d60: 0, d90plus: 0 };
    const items = invoices.map((inv) => {
      const due = inv.dueDate;
      let bucket = "current";
      if (due < d90) { bucket = "d90plus"; buckets.d90plus += Number(inv.balanceDue); }
      else if (due < d60) { bucket = "d60"; buckets.d60 += Number(inv.balanceDue); }
      else if (due < d30) { bucket = "d30"; buckets.d30 += Number(inv.balanceDue); }
      else { buckets.current += Number(inv.balanceDue); }
      return { ...inv, bucket };
    });

    return { buckets, items, total: Object.values(buckets).reduce((s, v) => s + v, 0) };
  }

  /**
   * Three-way match: PO vs GRN vs vendor invoice.
   */
  async performThreeWayMatch(invoiceId: string) {
    const invoice = await prisma.vendorInvoice.findUnique({
      where: { id: invoiceId },
      include: { lineItems: true },
    });

    if (!invoice) throw new Error("Invoice not found");

    // For each line item, compare qty and rate with PO and GRN
    const results = [];
    let allMatched = true;

    for (const line of invoice.lineItems) {
      const poQty = Number(line.poQuantity) || 0;
      const grnQty = Number(line.grnQuantity) || 0;
      const invQty = Number(line.quantity);

      const qtyMatch = Math.abs(invQty - grnQty) < 0.01;
      const poMatch = Math.abs(invQty - poQty) < 0.01;

      if (!qtyMatch || !poMatch) allMatched = false;

      results.push({
        lineId: line.id,
        description: line.description,
        poQty,
        grnQty,
        invoiceQty: invQty,
        qtyMatch,
        poMatch,
        variance: invQty - grnQty,
      });
    }

    // Update invoice match status
    await prisma.vendorInvoice.update({
      where: { id: invoiceId },
      data: {
        poMatchStatus: allMatched ? "matched" : "mismatch",
        grnMatchStatus: allMatched ? "matched" : "mismatch",
      },
    });

    return { allMatched, lines: results };
  }

  /**
   * Cash flow forecast for next N days.
   */
  async getCashFlowForecast(days: number = 90) {
    const now = new Date();
    const future = new Date(now.getTime() + days * 86400000);

    // Expected outflows: vendor invoices due
    const outflows = await prisma.vendorInvoice.findMany({
      where: {
        status: { in: ["verified", "approved", "scheduled"] },
        dueDate: { gte: now, lte: future },
      },
      select: { dueDate: true, netPayable: true, vendorName: true },
      orderBy: { dueDate: "asc" },
    });

    // Expected inflows: client invoices due
    const inflows = await prisma.clientInvoice.findMany({
      where: {
        status: { in: ["sent", "partially_paid"] },
        dueDate: { gte: now, lte: future },
      },
      select: { dueDate: true, balanceDue: true, clientName: true },
      orderBy: { dueDate: "asc" },
    });

    // BG expirations
    const bgExpirations = await prisma.bankGuarantee.findMany({
      where: {
        status: "active",
        expiryDate: { gte: now, lte: future },
      },
      select: { expiryDate: true, amount: true, bgType: true, bgNumber: true },
      orderBy: { expiryDate: "asc" },
    });

    // Group by week
    const weeks: Record<string, { inflow: number; outflow: number }> = {};
    for (let d = new Date(now); d <= future; d.setDate(d.getDate() + 7)) {
      const weekKey = d.toISOString().slice(0, 10);
      weeks[weekKey] = { inflow: 0, outflow: 0 };
    }

    return { outflows, inflows, bgExpirations, weeks };
  }
}
```

---

## 3. Page-by-page implementation

### Page 1: Finance dashboard (`/finance/dashboard`)

**Layout:** KPI cards row + two-column body (charts left, action lists right)

**KPI cards (top row, 5 cards):**
- Monthly revenue: sum of client invoices raised this month, compared to target
- Outstanding receivables: total balanceDue across all unpaid client invoices
- Outstanding payables: total netPayable across all unpaid vendor invoices
- Cash flow (30-day): projected inflows minus outflows for next 30 days
- Average project margin: mean of marginActual across all active projects

**Left column — Charts:**
- Revenue trend: bar chart, last 12 months of invoiced revenue
- Budget vs actual: grouped bar chart per active project (budget bar + actual bar)
- Cost category breakdown: donut chart showing material / labour / consumables / subcontract / overhead split

**Right column — Action lists:**
- Vendor invoices pending approval (top 5 by amount, link to AP page)
- Client invoices overdue (top 5 by days overdue, link to AR page)
- BG expiring in 30 days (list with renew action)
- Budget alerts: projects where any category exceeds 80% of budget (red/amber flags)

**API calls on mount:**
```
GET /api/finance/dashboard/kpis
GET /api/finance/dashboard/revenue-trend?months=12
GET /api/finance/dashboard/budget-vs-actual
GET /api/finance/dashboard/action-items
```

---

### Page 2: Job costing (`/finance/job-costing`)

**Sub-tabs:** Cost summary | Cost ledger | Variance analysis | Benchmarking

**Tab 2a — Cost summary:**
- Project selector dropdown at top
- Summary card showing: contract value, total budget, total actual, variance %, projected margin
- Six category cards (material, labour, consumables, subcontract, freight, overhead), each showing: budgeted → actual → variance with color-coded bar
- Cost accumulation chart: stacked area chart showing cumulative costs by category over time (S-curve)

**Tab 2b — Cost ledger:**
- Full transaction-level table of all JobCostEntry records for selected project
- Columns: date, category, description, reference, qty, rate, amount, heat number, PO, employee
- Filters: category, date range, job card, reference type
- Sort by: date, amount, category
- Export to Excel
- Reversal action (with reason modal) for finance_manager role only

**Tab 2c — Variance analysis:**
- Per-category variance table with traffic light indicators
- Earned value metrics panel: CPI, SPI, CV, SV, EAC, ETC
- Forecast chart: if current burn rate continues, when will we exceed budget?
- Drill-down: click a category to see which line items caused the overrun

**Tab 2d — Benchmarking:**
- Compare current project costs against historical averages for same vessel type
- Metrics: cost per ton, cost per welding inch, material cost as % of total
- Table: past 10 similar projects with their final actual costs

**API endpoints:**
```
GET  /api/finance/job-costing/:projectId/summary
GET  /api/finance/job-costing/:projectId/ledger?page=1&limit=50&category=&dateFrom=&dateTo=
GET  /api/finance/job-costing/:projectId/variance
GET  /api/finance/job-costing/:projectId/earned-value
GET  /api/finance/job-costing/benchmark?vesselType=pressure_vessel
POST /api/finance/job-costing/entries/:entryId/reverse
```

---

### Page 3: Accounts payable (`/finance/payable`)

**Sub-tabs:** Invoice register | Three-way match | Payment scheduling | Vendor ledger

**Tab 3a — Invoice register:**
- Table of all vendor invoices
- Columns: invoice#, vendor, date, amount, tax, net payable, PO#, match status, approval status, due date, aging
- Filters: status, vendor, project, date range, match status
- Actions: view, verify, approve, schedule payment, cancel
- New invoice button → form with line items

**Tab 3b — Three-way match:**
- Select invoice → side-by-side comparison
- Left column: PO line items (qty, rate)
- Center column: GRN received (qty, condition)
- Right column: Invoice claimed (qty, rate)
- Highlight mismatches in red
- Actions: accept match, flag mismatch, waive variance (with approval)

**Tab 3c — Payment scheduling:**
- Calendar view of upcoming payment due dates
- Grouped by week, with total per week
- Drag invoices between weeks to reschedule
- Payment batch creation: select multiple invoices → generate payment instruction file (CSV for bank upload)
- Approval workflow: accounts executive creates batch → finance manager approves → director authorizes (above threshold)

**Tab 3d — Vendor ledger:**
- Vendor selector dropdown
- Complete transaction history: POs, GRNs, invoices, advance payments, deductions, payments
- Running balance
- Export vendor statement as PDF

**API endpoints:**
```
GET    /api/finance/payable/invoices?page=1&limit=20&status=&vendor=&project=
POST   /api/finance/payable/invoices
GET    /api/finance/payable/invoices/:id
PUT    /api/finance/payable/invoices/:id/verify
PUT    /api/finance/payable/invoices/:id/approve
POST   /api/finance/payable/invoices/:id/match
GET    /api/finance/payable/payment-schedule?from=&to=
POST   /api/finance/payable/payment-batches
PUT    /api/finance/payable/payment-batches/:id/approve
POST   /api/finance/payable/payments
GET    /api/finance/payable/vendor-ledger/:vendorId?from=&to=
```

---

### Page 4: Accounts receivable (`/finance/receivable`)

**Sub-tabs:** Invoice register | Receipts | Aging | Client ledger

**Tab 4a — Invoice register:**
- Table of all client invoices
- Columns: invoice#, type, project, client, date, amount, tax, total, status, paid, balance, aging
- Status filters: draft, approved, sent, partially_paid, paid, cancelled
- Actions: create draft, approve, mark as sent, record receipt, cancel
- Create invoice form: select project → auto-populate milestones → add line items → calculate tax → preview → save

**Tab 4b — Receipts:**
- Table of all client receipts
- Columns: receipt date, client invoice#, amount, mode, reference#, bank, TDS deducted
- Record receipt form: select invoice → enter amount, mode, reference, bank → auto-update invoice balance
- Partial payment handling: invoice stays "partially_paid" until balance = 0

**Tab 4c — Aging analysis:**
- Aging summary cards: current, 1-30 days, 31-60 days, 61-90 days, 90+ days
- Stacked bar chart by client
- Drill-down table: each overdue invoice with days overdue, contact info, last follow-up date
- Follow-up action: log a follow-up call/email with next action date

**Tab 4d — Client ledger:**
- Project/client selector
- Full transaction history: invoices raised, receipts recorded, TDS deducted, retention held, retention released
- Running balance
- Statement PDF generation with company letterhead

**API endpoints:**
```
GET    /api/finance/receivable/invoices?page=1&limit=20&status=&project=
POST   /api/finance/receivable/invoices
GET    /api/finance/receivable/invoices/:id
PUT    /api/finance/receivable/invoices/:id/approve
PUT    /api/finance/receivable/invoices/:id/send
POST   /api/finance/receivable/receipts
GET    /api/finance/receivable/aging
GET    /api/finance/receivable/client-ledger/:projectId?from=&to=
```

---

### Page 5: Milestone billing (`/finance/billing`)

**Layout:** Project selector → milestone timeline → invoice linkage

**Milestone timeline (visual):**
- Horizontal pipeline showing all milestones for selected project
- Each milestone card shows: name, % of contract, amount, status icon
- Status colors: gray (pending), blue (achieved), green (invoiced), gold (paid)
- Click a milestone to expand details

**Milestone detail panel:**
- Linked production stage and its current completion %
- If stage complete: "Milestone achieved" badge with date
- Client certification status: required? received? date?
- Invoice linkage: has invoice been raised? invoice number, amount, payment status
- Action buttons:
  - Mark as achieved (requires production stage verification)
  - Generate invoice (creates draft client invoice from milestone)
  - Upload client milestone certificate

**Billing summary table:**
- Contract value | Billed to date | Balance to bill | Received | Outstanding
- Progress bar: billed as % of contract
- Forecast: based on schedule, when will next milestone be achieved?

**Milestone template setup (for new projects):**
- Standard templates: 30-20-30-20, 40-30-20-10, equal milestones
- Custom entry: add milestones with %, link to production stage
- Auto-calculate milestone amounts from contract value

**API endpoints:**
```
GET    /api/finance/billing/milestones/:projectId
POST   /api/finance/billing/milestones/:projectId
PUT    /api/finance/billing/milestones/:milestoneId
PUT    /api/finance/billing/milestones/:milestoneId/achieve
POST   /api/finance/billing/milestones/:milestoneId/generate-invoice
GET    /api/finance/billing/summary/:projectId
```

---

### Page 6: Budget management (`/finance/budget`)

**Sub-tabs:** Budget list | Budget builder | Revision history | Monitoring

**Tab 6a — Budget list:**
- Table of all project budgets
- Columns: project code, project name, revision#, total budget, contract value, margin %, status, prepared by
- Filters: status (draft, submitted, approved), project manager
- Quick actions: view, edit (draft only), submit, approve

**Tab 6b — Budget builder:**
- Project selector → if no budget exists, start fresh; if exists, show revision option
- BOM auto-import: pull all BOM line items with current pricing from procurement
- Category sections (collapsible):
  - Material: each BOM item with qty, unit rate, total — editable rates
  - Labour: hours per process stage × labour rate per trade — auto-calculated from process flow
  - Consumables: welding rods, gases, grinding discs — standard consumption rates per welding inch
  - Subcontract: NDE services, PWHT, transport — manual entry with vendor quote reference
  - Freight: inbound material freight + outbound dispatch — manual entry
  - Overhead: total labour hours × overhead rate — auto-calculated
- Summary section:
  - Subtotal per category
  - Contingency (configurable %, default 5%)
  - Total cost
  - Contract value (from project)
  - Margin = (contract - total cost) / contract × 100
  - Margin health: green (>15%), amber (10-15%), red (<10%)
- Save draft → Submit for approval → Approval chain: estimator → PM → finance manager → director

**Tab 6c — Revision history:**
- List of all budget revisions for a project
- Side-by-side comparison: select two revisions → diff view highlighting changed line items
- Change reason log per revision
- Linked change orders (if budget revision was triggered by a scope change)

**Tab 6d — Budget monitoring:**
- Live dashboard per project: budget vs actual with burn rate
- Alert configuration: set threshold % per category (default 80%)
- Notification rules: who gets alerted when threshold is breached
- Forecast: linear projection — if current spend rate continues, will budget be exceeded?
- What-if calculator: "if material costs increase 10%, what's the impact on margin?"

**API endpoints:**
```
GET    /api/finance/budget?status=&project=
GET    /api/finance/budget/:projectId/latest
POST   /api/finance/budget/:projectId
PUT    /api/finance/budget/:budgetId
PUT    /api/finance/budget/:budgetId/submit
PUT    /api/finance/budget/:budgetId/approve
GET    /api/finance/budget/:projectId/revisions
GET    /api/finance/budget/:projectId/compare?rev1=1&rev2=2
POST   /api/finance/budget/:projectId/import-bom
GET    /api/finance/budget/:projectId/monitoring
PUT    /api/finance/budget/:projectId/alert-config
POST   /api/finance/budget/:projectId/whatif
```

---

### Page 7: Reports (`/finance/reports`)

**Report categories:**

**7a — Project financial reports:**
- Project P&L statement: revenue (invoices raised) minus all costs, by project
- Project cost summary: one-page PDF with all categories, budget vs actual, margin
- Multi-project comparison: table of all projects with key financial metrics side by side

**7b — Payable reports:**
- Outstanding payable summary: total unpaid grouped by vendor
- Vendor payment history: all payments to a vendor in date range
- Aging report: payable aging buckets
- Advance outstanding: all unreturned advances to vendors
- TDS summary: all TDS deducted per vendor per quarter (for TDS return filing)

**7c — Receivable reports:**
- Outstanding receivable summary: total unpaid grouped by project/client
- Aging report: receivable aging buckets
- Collection efficiency: how quickly are invoices being paid vs due date
- Retention schedule: all retention amounts held with release due dates

**7d — Cash and bank reports:**
- Cash flow statement: inflows vs outflows by month
- Cash flow forecast: projected inflows/outflows for next 90 days
- Bank guarantee register: all BGs with status, expiry, renewal dates

**7e — Tax reports:**
- GST summary: CGST, SGST, IGST — input vs output for the period
- TDS payable summary: grouped by section, vendor
- TDS receivable summary: TDS deducted by clients

**7f — Management reports:**
- Monthly financial summary: one-page with revenue, costs, margin, cash position
- Project profitability ranking: all projects ranked by margin %
- Cost trend: monthly total cost trending with 12-month rolling average

**Report generation approach:**
- Each report has a "Generate" button that creates a PDF via server-side rendering
- Option to schedule recurring report (daily/weekly/monthly) with email distribution
- Export raw data to Excel for any report

**API endpoints:**
```
GET  /api/finance/reports/project-pnl/:projectId?from=&to=
GET  /api/finance/reports/project-cost-summary/:projectId
GET  /api/finance/reports/multi-project-comparison?projects=id1,id2,id3
GET  /api/finance/reports/payable-outstanding
GET  /api/finance/reports/payable-aging
GET  /api/finance/reports/receivable-outstanding
GET  /api/finance/reports/receivable-aging
GET  /api/finance/reports/cash-flow?from=&to=
GET  /api/finance/reports/cash-flow-forecast?days=90
GET  /api/finance/reports/bg-register
GET  /api/finance/reports/gst-summary?from=&to=
GET  /api/finance/reports/tds-summary?from=&to=
GET  /api/finance/reports/monthly-summary?month=2026-05
GET  /api/finance/reports/profitability-ranking
GET  /api/finance/reports/:reportType/export-excel
POST /api/finance/reports/schedule
```

---

## 4. Complete API endpoint reference

| # | Method | Path | Permission | Description |
|---|--------|------|-----------|-------------|
| 1 | GET | /api/finance/dashboard/kpis | read | Dashboard KPI cards |
| 2 | GET | /api/finance/dashboard/revenue-trend | read | Monthly revenue chart data |
| 3 | GET | /api/finance/dashboard/budget-vs-actual | read | Budget vs actual per project |
| 4 | GET | /api/finance/dashboard/action-items | read | Pending approvals and alerts |
| 5 | GET | /api/finance/job-costing/:projectId/summary | read | Project cost summary |
| 6 | GET | /api/finance/job-costing/:projectId/ledger | read | Cost ledger with pagination |
| 7 | GET | /api/finance/job-costing/:projectId/variance | read | Variance analysis |
| 8 | GET | /api/finance/job-costing/:projectId/earned-value | read | Earned value metrics |
| 9 | GET | /api/finance/job-costing/benchmark | read | Historical benchmarking |
| 10 | POST | /api/finance/job-costing/entries/:id/reverse | update | Reverse a cost entry |
| 11 | GET | /api/finance/payable/invoices | read | Vendor invoice list |
| 12 | POST | /api/finance/payable/invoices | create | Create vendor invoice |
| 13 | GET | /api/finance/payable/invoices/:id | read | Vendor invoice detail |
| 14 | PUT | /api/finance/payable/invoices/:id | update | Update vendor invoice |
| 15 | PUT | /api/finance/payable/invoices/:id/verify | update | Verify invoice |
| 16 | PUT | /api/finance/payable/invoices/:id/approve | approve | Approve invoice |
| 17 | POST | /api/finance/payable/invoices/:id/match | update | Run three-way match |
| 18 | GET | /api/finance/payable/payment-schedule | read | Payment calendar |
| 19 | POST | /api/finance/payable/payment-batches | create | Create payment batch |
| 20 | PUT | /api/finance/payable/payment-batches/:id/approve | approve | Approve batch |
| 21 | POST | /api/finance/payable/payments | create | Record a payment |
| 22 | GET | /api/finance/payable/vendor-ledger/:vendorId | read | Vendor ledger |
| 23 | GET | /api/finance/receivable/invoices | read | Client invoice list |
| 24 | POST | /api/finance/receivable/invoices | create | Create client invoice |
| 25 | GET | /api/finance/receivable/invoices/:id | read | Client invoice detail |
| 26 | PUT | /api/finance/receivable/invoices/:id/approve | approve | Approve client invoice |
| 27 | PUT | /api/finance/receivable/invoices/:id/send | update | Mark invoice as sent |
| 28 | POST | /api/finance/receivable/receipts | create | Record client receipt |
| 29 | GET | /api/finance/receivable/aging | read | Receivable aging |
| 30 | GET | /api/finance/receivable/client-ledger/:projectId | read | Client ledger |
| 31 | GET | /api/finance/billing/milestones/:projectId | read | Project milestones |
| 32 | POST | /api/finance/billing/milestones/:projectId | create | Create milestones |
| 33 | PUT | /api/finance/billing/milestones/:id | update | Update milestone |
| 34 | PUT | /api/finance/billing/milestones/:id/achieve | update | Mark achieved |
| 35 | POST | /api/finance/billing/milestones/:id/generate-invoice | create | Generate invoice from milestone |
| 36 | GET | /api/finance/billing/summary/:projectId | read | Billing summary |
| 37 | GET | /api/finance/budget | read | Budget list |
| 38 | POST | /api/finance/budget/:projectId | create | Create budget |
| 39 | PUT | /api/finance/budget/:budgetId | update | Update budget |
| 40 | PUT | /api/finance/budget/:budgetId/submit | update | Submit for approval |
| 41 | PUT | /api/finance/budget/:budgetId/approve | approve | Approve budget |
| 42 | POST | /api/finance/budget/:projectId/import-bom | create | Import BOM into budget |

---

## 5. Inter-module integration hooks

These are event-driven automatic postings. When an action occurs in another module, it triggers a cost entry in finance. No user action required.

### 5.1 — Stores → Finance (material cost posting)

**Trigger event:** Material issue confirmed in stores module  
**Source endpoint:** `POST /api/stores/material-issue`  
**Finance action:** Call `CostAccumulator.postMaterialIssue()`  
**Data flow:**
```
Stores issues 5 tons SA-516 Gr.70 plate to project PV-2026-001
→ Inventory deducted at weighted average cost ₹72,500/ton
→ JobCostEntry created: category=material, amount=₹3,62,500
→ Budget vs actual updates in real time
```

**Reversal trigger:** Material returned to stores  
**Source endpoint:** `POST /api/stores/material-return`  
**Finance action:** Call `CostAccumulator.reverseEntry()` with original entry ID

### 5.2 — Production → Finance (labour and overhead posting)

**Trigger event:** Operator logs time against job card  
**Source endpoint:** `PUT /api/production/job-cards/:id/log-time`  
**Finance action:** Call `CostAccumulator.postLabourTime()`  
**Data flow:**
```
Welder W-023 (6G TIG) logs 8 normal + 2 OT hours on job card JC-0047
→ Labour rate lookup: ₹450/hr, OT multiplier 1.5×
→ Labour cost: (8 × 450) + (2 × 450 × 1.5) = ₹3,600 + ₹1,350 = ₹4,950
→ Overhead: 10 hours × ₹180/hr = ₹1,800
→ Two JobCostEntries created: labour ₹4,950 + overhead ₹1,800
```

### 5.3 — Procurement → Finance (subcontract and freight posting)

**Trigger event:** GRN created for service PO (NDE, PWHT, transport)  
**Source endpoint:** `POST /api/procurement/goods-receipt`  
**Finance action:** Call `CostAccumulator.postSubcontractCost()`  
**Data flow:**
```
GRN raised for RT/UT inspection services from NDE vendor
→ PO amount ₹85,000, GRN confirms work completed
→ JobCostEntry created: category=subcontract, amount=₹85,000
```

### 5.4 — Production → Finance (milestone achievement)

**Trigger event:** Production stage completed (e.g., hydro test passed)  
**Source endpoint:** `PUT /api/production/stages/:id/complete`  
**Finance action:** Check if any billing milestone is linked to this stage → update milestone status to "achieved"  
**Data flow:**
```
Production marks hydro test as passed for PV-2026-001
→ Finance checks: milestone "Hydro test complete" (30% = ₹18,00,000) is linked
→ Milestone status → "achieved", achievedAt = now
→ Finance dashboard shows "1 milestone ready for invoicing"
→ Finance manager clicks "Generate invoice" → client invoice draft created
```

### 5.5 — Procurement → Finance (vendor invoice auto-link)

**Trigger event:** Vendor submits invoice against a PO  
**Source endpoint:** `POST /api/finance/payable/invoices`  
**Finance action:** Auto-fetch PO and GRN data for three-way matching  
**Data flow:**
```
Vendor invoice ₹4,25,000 entered against PO-2026-0034
→ System pulls PO lines: 5 items totaling ₹4,25,000
→ System pulls GRN: received 5 items, quantities match
→ Three-way match: all lines matched → status = "matched"
→ Invoice proceeds to verification and approval
```

---

## 6. Frontend component structure

### 6.1 — Feature folder structure

```
apps/web/src/features/finance/
├── components/
│   ├── BudgetBuilder.tsx           # Multi-section budget form
│   ├── BudgetCategorySection.tsx   # Collapsible category with line items
│   ├── CashFlowChart.tsx           # D3/Recharts cash flow projection
│   ├── CostBreakdownDonut.tsx      # Donut chart for cost categories
│   ├── CostLedgerTable.tsx         # Paginated transaction table
│   ├── EarnedValuePanel.tsx        # CPI, SPI, CV, SV display
│   ├── InvoiceForm.tsx             # Vendor/client invoice creation
│   ├── InvoicePreview.tsx          # PDF preview before sending
│   ├── MilestoneTimeline.tsx       # Horizontal milestone pipeline
│   ├── PaymentBatchModal.tsx       # Multi-select invoices for batch
│   ├── RevenueBarChart.tsx         # Monthly revenue trending
│   ├── ThreeWayMatchView.tsx       # PO vs GRN vs Invoice comparison
│   ├── VarianceTable.tsx           # Category variance with traffic lights
│   └── VendorLedgerStatement.tsx   # Full vendor transaction history
├── pages/
│   ├── index.tsx                   # Module route definitions
│   ├── FinanceDashboard.tsx
│   ├── JobCosting.tsx
│   ├── AccountsPayable.tsx
│   ├── AccountsReceivable.tsx
│   ├── MilestoneBilling.tsx
│   ├── BudgetManagement.tsx
│   └── FinanceReports.tsx
├── services/
│   └── financeApi.ts               # Axios calls to all 42 endpoints
├── hooks/
│   ├── useProjectCostSummary.ts    # React Query hook for cost data
│   ├── useAgingAnalysis.ts         # Hook for aging buckets
│   ├── useBudgetBuilder.ts         # Form state management for budget
│   └── useMilestones.ts            # Milestone CRUD operations
└── types/
    └── finance.types.ts            # TypeScript interfaces for all entities
```

### 6.2 — Key component specifications

**CostLedgerTable.tsx:**
- Uses `@tanstack/react-table` for server-side pagination, sorting, filtering
- Column visibility toggle (user can show/hide columns)
- Row click → slide-out drawer with full entry details and reversal button
- Export button triggers server-side Excel generation and download
- Negative amounts (reversals) displayed in red with strikethrough on original

**MilestoneTimeline.tsx:**
- Horizontal scrollable timeline with milestone cards connected by lines
- Each card: milestone name, % of contract, amount, status badge
- Achieved milestones: checkmark icon, green background
- Current milestone: pulsing blue border
- Click to expand: shows linked production stage, certification status, invoice link
- "Generate invoice" button appears only when status = "achieved" and no invoice exists

**ThreeWayMatchView.tsx:**
- Three-column layout with sticky headers
- Column 1: PO line items (source of truth)
- Column 2: GRN quantities (what was physically received)
- Column 3: Invoice claims (what vendor is billing)
- Matching rows: green checkmark
- Mismatched rows: red highlight with variance amount
- Footer: total match status, overall verdict, action buttons (accept/flag/waive)

**BudgetBuilder.tsx:**
- Accordion-style sections for each category
- Material section: "Import from BOM" button → auto-populates all BOM items with latest vendor pricing
- Labour section: auto-calculated from process flow (estimated hours per stage × labour rate)
- Overhead section: auto-calculated as total labour hours × current overhead rate
- Live running total in sticky footer with margin % indicator
- Save draft / Submit for approval buttons with confirmation modal

---

## 7. GST and tax computation rules

### 7.1 — GST handling

```
INTRA-STATE supply (vendor and company in same state):
  CGST = 9% of taxable value
  SGST = 9% of taxable value
  Total GST = 18%

INTER-STATE supply (vendor and company in different states):
  IGST = 18% of taxable value

Input tax credit (ITC):
  GST paid on vendor invoices = input credit
  GST collected on client invoices = output liability
  Net GST payable = output - input (filed monthly via GSTR-3B)
```

### 7.2 — TDS handling

```
TDS on vendor payments (company deducts before paying):
  Section 194C (contractors): 1% (individual/HUF) or 2% (others)
  Section 194J (professional services): 10%
  Section 194I (rent): 10%
  Threshold: ₹30,000 per payment or ₹1,00,000 per year

TDS on client receipts (client deducts from our invoice):
  Usually 2% under 194C
  Record as TDS receivable (claim credit in tax return)
```

---

## 8. Testing checklist

### 8.1 — Cost accumulation tests
1. Issue material to project → verify JobCostEntry created with correct amount
2. Issue material, then return partial qty → verify reversal entry with negative amount
3. Log 8 normal + 2 OT hours for 6G welder → verify labour cost = (8×rate) + (2×rate×1.5)
4. Verify overhead auto-posts with labour entry
5. Create GRN for subcontract service → verify subcontract cost entry posted
6. Verify no duplicate entries if the same source event fires twice (idempotency check)
7. Verify reversed entries don't appear in variance calculations

### 8.2 — Budget tests
8. Create budget from BOM import → verify all BOM items appear with correct pricing
9. Calculate labour from process flow → verify hours × rate math
10. Submit budget for approval → verify status changes and notifications
11. Approve budget → verify variance analysis becomes available
12. Create revision → verify new revision number, previous revision preserved
13. What-if: increase material by 10% → verify margin recalculation

### 8.3 — Payable tests
14. Enter vendor invoice → verify three-way match runs automatically
15. Match with quantity variance → verify mismatch status flagged
16. Approve invoice → verify it appears in payment schedule
17. Create payment batch → verify total matches selected invoices
18. Record payment → verify vendor invoice status changes to "paid"
19. Verify TDS auto-calculated based on vendor category and section

### 8.4 — Receivable tests
20. Generate invoice from milestone → verify amount matches milestone %
21. Record partial payment → verify invoice status = "partially_paid"
22. Record remaining payment → verify status = "paid", balance = 0
23. TDS deducted by client → verify recorded separately from payment amount
24. Aging calculation → verify invoices fall into correct bucket by days overdue

### 8.5 — Milestone tests
25. Production marks hydro test complete → verify linked milestone auto-achieves
26. Generate invoice from achieved milestone → verify draft invoice created correctly
27. Billing summary totals = sum of all milestone amounts = contract value
28. Cannot generate invoice for unachieved milestone → verify validation error

### 8.6 — Integration tests
29. Full lifecycle: create project → create budget → approve → issue material → log labour → achieve milestone → invoice client → receive payment → verify final P&L matches
30. Concurrent project costing: costs from two projects posting simultaneously → verify isolation

---

## 9. Claude Code execution sequence

### Round 1: Schema and engines
```
1. Add all 14 Prisma models to schema.prisma
2. Run: npx prisma migrate dev --name add_finance_module
3. Create costAccumulator.ts engine
4. Create varianceAnalyzer.ts engine
5. Seed labour rates and overhead rates
6. Seed sample billing milestone templates
```

### Round 2: Core API routes
```
7. Create finance.routes.ts with all 42 endpoint stubs
8. Implement dashboard endpoints (KPIs, charts, action items)
9. Implement job costing endpoints (summary, ledger, variance, EV)
10. Implement payable endpoints (CRUD, match, payment)
11. Implement receivable endpoints (CRUD, receipts, aging)
12. Implement milestone endpoints (CRUD, achieve, generate invoice)
13. Implement budget endpoints (CRUD, import BOM, approve, whatif)
14. Implement report endpoints (all 12 report types)
15. Wire all routes into Express app with authenticate + authorize middleware
```

### Round 3: Integration hooks
```
16. Add CostAccumulator.postMaterialIssue() call in stores material-issue endpoint
17. Add CostAccumulator.postLabourTime() call in production log-time endpoint
18. Add CostAccumulator.postSubcontractCost() call in procurement GRN endpoint
19. Add milestone auto-achievement check in production stage-complete endpoint
20. Add three-way match auto-run in vendor invoice creation endpoint
21. Test all integration hooks with seed data
```

### Round 4: Frontend pages
```
22. Create finance feature folder structure
23. Create financeApi.ts service with all API calls
24. Build FinanceDashboard page with KPI cards and charts
25. Build JobCosting page with 4 sub-tabs
26. Build AccountsPayable page with 4 sub-tabs
27. Build AccountsReceivable page with 4 sub-tabs
28. Build MilestoneBilling page with timeline component
29. Build BudgetManagement page with builder and monitoring
30. Build FinanceReports page with report generation
```

### Round 5: Polish and testing
```
31. Add PDF generation for client invoices (use @react-pdf/renderer)
32. Add Excel export for all table views
33. Add email notification triggers (invoice approved, payment due, BG expiring)
34. Run all 30 test scenarios from section 8
35. Add loading states, error boundaries, empty states to all pages
36. Mobile responsive check on all finance pages
```

---

## Appendix A: Invoice number format

```
Client invoice:    INV-{YYYY}-{SEQ:4}        Example: INV-2026-0047
Proforma invoice:  PI-{YYYY}-{SEQ:4}         Example: PI-2026-0012
Credit note:       CN-{YYYY}-{SEQ:4}         Example: CN-2026-0003
Debit note:        DN-{YYYY}-{SEQ:4}         Example: DN-2026-0001
Payment voucher:   PV-{YYYY}-{SEQ:4}         Example: PV-2026-0089
Receipt voucher:   RV-{YYYY}-{SEQ:4}         Example: RV-2026-0034
```

## Appendix B: Approval matrix

| Action | Amount threshold | Approver chain |
|--------|-----------------|----------------|
| Vendor invoice approval | < ₹1,00,000 | Finance executive → Finance manager |
| Vendor invoice approval | ₹1L — ₹10L | Finance executive → Finance manager → Director |
| Vendor invoice approval | > ₹10,00,000 | Finance executive → Finance manager → Director → MD |
| Payment batch | < ₹5,00,000 | Finance manager |
| Payment batch | ₹5L — ₹25L | Finance manager → Director |
| Payment batch | > ₹25,00,000 | Finance manager → Director → MD |
| Budget approval | All | Estimator → PM → Finance manager → Director |
| Client invoice | All | Finance executive → Finance manager |
| Cost entry reversal | All | Finance manager (with mandatory reason) |

## Appendix C: Dashboard KPI calculation formulas

```
Monthly revenue = SUM(client_invoices.total_amount)
                  WHERE invoice_date is in current month
                  AND status NOT IN ('draft', 'cancelled')

Outstanding receivables = SUM(client_invoices.balance_due)
                         WHERE status IN ('sent', 'partially_paid')

Outstanding payables = SUM(vendor_invoices.net_payable)
                      WHERE status IN ('verified', 'approved', 'scheduled')

Cash flow 30d = SUM(expected inflows next 30d) - SUM(expected outflows next 30d)
  Inflows = client invoices due in next 30 days (balance_due)
  Outflows = vendor invoices due in next 30 days (net_payable)

Average project margin = AVG((contract_value - total_actual) / contract_value × 100)
                        WHERE project status = 'in_progress'
                        AND approved budget exists

CPI = Earned value / Actual cost
  Earned value = total_budget × schedule_percent_complete
  Actual cost = SUM(job_cost_entries.total_amount) WHERE NOT reversed

EAC = total_budget / CPI
ETC = EAC - actual_cost
```

---

*End of implementation plan*
