const { subscribe, TOPICS } = require("./rabbitmq");
const db = require("../db/knex");

// Register all event subscribers. Called once at startup after RabbitMQ connects.
async function registerSubscribers(io) {

  // ── S-02 subscribers ──────────────────────────────────────────

  // QC listens for phase changes — may need to create new ITP checklist
  await subscribe(TOPICS.PROJECT_PHASE_CHANGED, "qc.phase.listener", async (payload) => {
    console.log("[Event] project.phase.changed →", payload.projectNo, "phase", payload.newPhase);
    if (io) io.to(`project:${payload.projectId}`).emit("project:phase_changed", payload);
  });

  // Store + Procurement listen for material requests raised by production
  await subscribe(TOPICS.MATERIAL_REQUEST_RAISED, "store.mr.listener", async (payload) => {
    console.log("[Event] material.request.raised → MR", payload.mrNo);
    if (io) {
      io.to("dept:store").emit("store:material_request", payload);
      // Procurement also notified — they may need to source if stock is short
      io.to("dept:procurement").emit("store:material_request", payload);
    }
  });

  // ENH-03: Finance listens for milestones triggered — auto-create draft invoice
  await subscribe(TOPICS.MILESTONE_TRIGGERED, "finance.milestone.listener", async (payload) => {
    console.log("[Event] milestone.triggered → project", payload.projectId, "milestone", payload.milestoneId);

    // Auto-draft invoice if milestone has a billing amount and auto_invoice is enabled
    if (payload.milestoneId) {
      try {
        const milestone = await db("milestones").where("id", payload.milestoneId).first();
        if (milestone && milestone.auto_invoice !== false && milestone.billing_amount) {
          const [{ count }] = await db("invoices").count("id as count");
          const invoiceNo = `INV-${String(Number(count) + 1).padStart(5, "0")}`;

          const issueDate = new Date().toISOString().slice(0, 10);
          const dueDate   = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

          const [invoice] = await db("invoices")
            .insert({
              project_id:  milestone.project_id,
              milestone_id: milestone.id,
              invoice_no:  invoiceNo,
              status:      "draft",
              amount:      milestone.billing_amount,
              tax_amount:  0,
              paid_amount: 0,
              currency:    "USD",
              issue_date:  issueDate,
              due_date:    dueDate,
              notes:       `Auto-drafted from milestone: ${milestone.name}`,
            })
            .returning("*");

          await db("milestones")
            .where("id", milestone.id)
            .update({ status: "invoiced", updated_at: db.fn.now() });

          console.log("[ENH-03] Auto-drafted invoice", invoice.invoice_no, "for milestone", milestone.name);

          if (io) {
            const notification = { type: "finance:invoice_auto_drafted", invoice, milestone };
            io.to("dept:finance").emit("finance:invoice_auto_drafted", notification);
            io.to(`project:${milestone.project_id}`).emit("finance:invoice_auto_drafted", notification);
          }
          return;
        }
      } catch (err) {
        console.error("[ENH-03] Auto-invoice creation failed:", err.message);
      }
    }

    if (io) {
      io.to(`project:${payload.projectId}`).emit("finance:milestone_triggered", payload);
      io.to("dept:finance").emit("finance:milestone_triggered", payload);
    }
  });

  // GM + Production — ITP hold points
  await subscribe(TOPICS.HOLD_POINT_TRIGGERED, "gm.hold.listener", async (payload) => {
    console.log("[Event] hold.point.triggered → project", payload.projectId);
    if (io) {
      io.emit("qc:hold_triggered", payload);
      io.to("dept:gm").emit("qc:hold_triggered", payload);
    }
  });

  // ── S-10 subscribers (ARCH-03) ────────────────────────────────

  // Production + QC notified when GM assigns a project
  await subscribe(TOPICS.PROJECT_ASSIGNED, "dept.project.assigned.listener", async (payload) => {
    console.log("[Event] project.assigned →", payload.projectNo, "by", payload.assignedBy);
    if (!io) return;
    const notification = { type: "project:assigned", ...payload };
    io.to("dept:production").emit("project:assigned", notification);
    io.to("dept:qc").emit("project:assigned", notification);
    io.to(`project:${payload.projectId}`).emit("project:assigned", notification);
  });

  // Procurement + Store notified when BOQ/MRP is generated
  await subscribe(TOPICS.BOQ_GENERATED, "dept.boq.listener", async (payload) => {
    console.log("[Event] boq.generated → project", payload.projectId);
    if (!io) return;
    const notification = { type: "boq:generated", ...payload };
    io.to("dept:procurement").emit("boq:generated", notification);
    io.to("dept:store").emit("boq:generated", notification);
  });

  // QC notified when GRN received — auto-raise inspection call
  await subscribe(TOPICS.GRN_RECEIVED, "qc.grn.listener", async (payload) => {
    console.log("[Event] grn.received → GRN", payload.grnNo, "for project", payload.projectId);
    if (!io) return;
    const notification = { type: "grn:received", ...payload };
    io.to("dept:qc").emit("grn:received", notification);
    if (payload.projectId) io.to(`project:${payload.projectId}`).emit("grn:received", notification);
  });

  // NCR raised → Production (stop affected work) + GM notified
  await subscribe(TOPICS.NCR_RAISED, "dept.ncr.listener", async (payload) => {
    console.log("[Event] ncr.raised →", payload.ncrNo, "severity:", payload.severity);
    if (!io) return;
    const notification = { type: "ncr:raised", ...payload };
    io.to("dept:production").emit("ncr:raised", notification);
    io.to("dept:gm").emit("ncr:raised", notification);
    if (payload.projectId) io.to(`project:${payload.projectId}`).emit("ncr:raised", notification);
  });

  // Store notified when QC passes an incoming inspection — release to stock
  await subscribe(TOPICS.INSPECTION_PASSED, "store.inspection.listener", async (payload) => {
    console.log("[Event] inspection.passed → GRN", payload.grnId, "result:", payload.result);
    if (!io) return;
    io.to("dept:store").emit("inspection:passed", { type: "inspection:passed", ...payload });
  });

  // Deviation requested → QC (review) + GM (approve) — stub for S-12 table
  await subscribe(TOPICS.DEVIATION_REQUESTED, "dept.deviation.listener", async (payload) => {
    console.log("[Event] deviation.requested → project", payload.projectId);
    if (!io) return;
    const notification = { type: "deviation:requested", ...payload };
    io.to("dept:qc").emit("deviation:requested", notification);
    io.to("dept:gm").emit("deviation:requested", notification);
  });

  // S-10: GM intervention — push to the target department room + GM room
  await subscribe(TOPICS.GM_INTERVENTION, "dept.gm.intervention.listener", async (payload) => {
    console.log("[Event] gm.intervention →", payload.action_type, "target:", payload.target_dept);
    if (!io) return;
    const notification = {
      type: "gm:intervention",
      action_type: payload.action_type,
      project_id: payload.project_id,
      reason: payload.reason,
      gm_name: payload.gm_name,
      intervention_id: payload.intervention_id,
    };
    // Push to the targeted department (if specified)
    if (payload.target_dept) {
      io.to(`dept:${payload.target_dept}`).emit("gm:intervention", notification);
    } else {
      // Broadcast to all departments when no specific target
      io.emit("gm:intervention", notification);
    }
    // GM room always receives a confirmation
    io.to("dept:gm").emit("gm:intervention", notification);
  });

  // S-10: Rush order — push to production + procurement
  await subscribe(TOPICS.RUSH_ORDER_TRIGGERED, "dept.rush.listener", async (payload) => {
    console.log("[Event] rush.order.triggered → project", payload.project_id);
    if (!io) return;
    const notification = { type: "rush:order", ...payload };
    io.to("dept:production").emit("rush:order_triggered", notification);
    io.to("dept:procurement").emit("rush:order_triggered", notification);
  });

  // ── S-15 subscribers ──────────────────────────────────────────

  // Kaizen submitted — notify the relevant dept manager
  await subscribe(TOPICS.KAIZEN_SUBMITTED, "dept.kaizen.listener", async (payload) => {
    console.log("[Event] kaizen.submitted →", payload.title, "from dept:", payload.dept);
    if (!io) return;
    const notification = { type: "kaizen:submitted", ...payload };
    if (payload.dept) io.to(`dept:${payload.dept}`).emit("kaizen:submitted", notification);
    io.to("dept:gm").emit("kaizen:submitted", notification);
  });

  // Site visit requested — notify GM and Production
  await subscribe(TOPICS.SITE_VISIT_REQUESTED, "dept.site_visit.listener", async (payload) => {
    console.log("[Event] site.visit.requested → visit", payload.visit_no);
    if (!io) return;
    const notification = { type: "site_visit:requested", ...payload };
    io.to("dept:gm").emit("site_visit:requested", notification);
    io.to("dept:production").emit("site_visit:requested", notification);
    if (payload.project_id) io.to(`project:${payload.project_id}`).emit("site_visit:requested", notification);
  });

  // ── S-12 subscribers ──────────────────────────────────────────

  // Production notified when GM approves or rejects a deviation
  await subscribe(TOPICS.DEVIATION_APPROVED, "dept.deviation.approved.listener", async (payload) => {
    console.log("[Event] deviation.approved →", payload.deviation_no);
    if (!io) return;
    io.to("dept:production").emit("deviation:approved", { type: "deviation:approved", ...payload });
    if (payload.project_id) io.to(`project:${payload.project_id}`).emit("deviation:approved", { type: "deviation:approved", ...payload });
  });

  await subscribe(TOPICS.DEVIATION_REJECTED, "dept.deviation.rejected.listener", async (payload) => {
    console.log("[Event] deviation.rejected →", payload.deviation_no);
    if (!io) return;
    io.to("dept:production").emit("deviation:rejected", { type: "deviation:rejected", ...payload });
    if (payload.project_id) io.to(`project:${payload.project_id}`).emit("deviation:rejected", { type: "deviation:rejected", ...payload });
  });

  // ── S-12 completion: MRP auto-replenishment ──────────────────

  await subscribe(TOPICS.MRP_REPLENISHMENT_TRIGGERED, "dept.mrp.replenishment.listener", async (payload) => {
    console.log(`[Event] mrp.replenishment.triggered → MR ${payload.mrNo}, ${payload.shortCount} short items, project ${payload.projectId}`);
    if (!io) return;
    const notification = { type: "mrp:replenishment_triggered", ...payload };
    io.to("dept:procurement").emit("mrp:replenishment_triggered", notification);
    io.to("dept:store").emit("mrp:replenishment_triggered", notification);
    if (payload.projectId) io.to(`project:${payload.projectId}`).emit("mrp:replenishment_triggered", notification);
  });

  // ── S-12 completion: Quality gate failed → auto-NCR ──────────

  await subscribe(TOPICS.QUALITY_GATE_FAILED, "dept.quality.gate.failed.listener", async (payload) => {
    console.log(`[Event] quality.gate.failed → NCR ${payload.ncrNo}, ITP step ${payload.stepNo}, project ${payload.projectId}`);
    if (!io) return;
    const notification = { type: "quality_gate:failed", ...payload };
    io.to("dept:qc").emit("quality_gate:failed", notification);
    io.to("dept:production").emit("quality_gate:failed", notification);
    io.to("dept:gm").emit("quality_gate:failed", notification);
    if (payload.projectId) io.to(`project:${payload.projectId}`).emit("quality_gate:failed", notification);
  });

  console.log("[Events] all subscribers registered");
}

module.exports = { registerSubscribers };
