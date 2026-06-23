const express = require("express");
const db = require("../db/knex");
const { requireRole } = require("../middleware/auth");
const { publish, TOPICS } = require("../events/rabbitmq");

const router = express.Router({ mergeParams: true });

// GET /projects/:id/weld-joints — all joints with NDE summary
router.get("/", async (req, res, next) => {
  try {
    const joints = await db("weld_joints as j")
      .leftJoin("wps as w", "j.wps_id", "w.id")
      .leftJoin("employees as e", "j.welder_id", "e.id")
      .select(
        "j.*",
        "w.wps_no",
        "w.process as wps_process",
        "e.full_name as welder_name",
        "e.employee_no as welder_stamp"
      )
      .where("j.project_id", req.params.id)
      .orderBy("j.joint_no");

    const jointIds = joints.map((j) => j.id);
    const ndeRecords = jointIds.length
      ? await db("nde_records").whereIn("joint_id", jointIds).orderBy("test_date")
      : [];

    const ndeByJoint = {};
    ndeRecords.forEach((r) => {
      (ndeByJoint[r.joint_id] = ndeByJoint[r.joint_id] || []).push(r);
    });

    res.json(
      joints.map((j) => ({ ...j, nde_records: ndeByJoint[j.id] || [] }))
    );
  } catch (err) {
    next(err);
  }
});

// POST /projects/:id/weld-joints — add joint, assign WPS
router.post("/", requireRole("senior"), async (req, res, next) => {
  try {
    const { joint_no, wps_id, drawing_ref, joint_type, material, thickness_mm, diameter_mm } = req.body;
    if (!joint_no) return res.status(400).json({ error: "joint_no is required" });

    const [joint] = await db("weld_joints")
      .insert({
        project_id: req.params.id,
        joint_no,
        wps_id: wps_id || null,
        drawing_ref: drawing_ref || null,
        joint_type: joint_type || null,
        material: material || null,
        thickness_mm: thickness_mm || null,
        diameter_mm: diameter_mm || null,
        status: "pending",
      })
      .returning("*");

    res.status(201).json(joint);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Joint number already exists for this project" });
    next(err);
  }
});

// PATCH /weld-joints/:jointId/welder — assign welder stamp
router.patch("/:jointId/welder", requireRole("senior"), async (req, res, next) => {
  try {
    const { employee_id, weld_date } = req.body;
    if (!employee_id) return res.status(400).json({ error: "employee_id is required" });

    // Verify WPQ is active for the joint's WPS
    const joint = await db("weld_joints").where("id", req.params.jointId).first();
    if (!joint) return res.status(404).json({ error: "Weld joint not found" });

    if (joint.wps_id) {
      const wpq = await db("wpq")
        .where({ employee_id, wps_id: joint.wps_id, status: "active" })
        .first();

      if (!wpq) {
        return res.status(422).json({
          error: "Welder has no active WPQ for this WPS. Check qualification status.",
        });
      }
    }

    const [updated] = await db("weld_joints")
      .where("id", req.params.jointId)
      .update({
        welder_id: employee_id,
        weld_date: weld_date || db.fn.now(),
        status: "in_progress",
        updated_at: db.fn.now(),
      })
      .returning("*");

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /weld-joints/:jointId/status — update joint status
router.patch("/:jointId/status", requireRole("senior"), async (req, res, next) => {
  try {
    const VALID = ["pending", "in_progress", "welded", "nde_required", "accepted", "rejected"];
    const { status } = req.body;
    if (!VALID.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID.join(", ")}` });
    }

    const [updated] = await db("weld_joints")
      .where("id", req.params.jointId)
      .update({ status, updated_at: db.fn.now() })
      .returning("*");

    if (!updated) return res.status(404).json({ error: "Weld joint not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /nde-records — log NDE result; auto-raises NCR on reject
router.post("/nde", requireRole("senior"), async (req, res, next) => {
  try {
    const { joint_id, method, test_date, technician, procedure_ref, result, findings } = req.body;
    if (!joint_id || !method || !result) {
      return res.status(400).json({ error: "joint_id, method, and result are required" });
    }

    const [nde] = await db("nde_records")
      .insert({ joint_id, method, test_date: test_date || null, technician, procedure_ref, result, findings })
      .returning("*");

    // Update joint status based on NDE result
    const joint = await db("weld_joints").where("id", joint_id).first();
    if (joint) {
      const newJointStatus = result === "accept" ? "accepted" : "rejected";
      await db("weld_joints").where("id", joint_id).update({ status: newJointStatus, updated_at: db.fn.now() });

      // Business rule: NDE reject → auto-raise NCR
      if (result === "reject") {
        const [{ count }] = await db("ncrs").count("id as count");
        const ncrNo = `NCR-${String(Number(count) + 1).padStart(4, "0")}`;

        const [autoNcr] = await db("ncrs")
          .insert({
            project_id: joint.project_id,
            ncr_no: ncrNo,
            title: `NDE Reject — Joint ${joint.joint_no} (${method})`,
            description: findings || `Auto-raised: NDE ${method} rejection on joint ${joint.joint_no}`,
            severity: "major",
            status: "open",
            raised_by: req.user.sub,
          })
          .returning("*");

        await publish(TOPICS.NCR_RAISED, {
          ncrId: autoNcr.id,
          ncrNo: autoNcr.ncr_no,
          projectId: joint.project_id,
          severity: "major",
          autoRaised: true,
          jointId: joint_id,
          ndeMethod: method,
        }).catch((e) => console.warn("[NDE] NCR publish failed:", e.message));

        return res.status(201).json({ nde, auto_ncr: autoNcr });
      }
    }

    res.status(201).json({ nde });
  } catch (err) {
    next(err);
  }
});

// GET /projects/:id/mrb — MRB document list
router.get("/mrb", async (req, res, next) => {
  try {
    const projectId = req.params.id;

    const [project, joints, itpSteps, ncrs, inspections] = await Promise.all([
      db("projects as p").leftJoin("clients as c", "p.client_id", "c.id")
        .select("p.*", "c.name as client_name").where("p.id", projectId).first(),
      db("weld_joints as j")
        .leftJoin("employees as e", "j.welder_id", "e.id")
        .leftJoin("wps as w", "j.wps_id", "w.id")
        .select("j.*", "e.full_name as welder_name", "e.employee_no", "w.wps_no")
        .where("j.project_id", projectId),
      db("itp_steps").where("project_id", projectId).orderBy("step_no"),
      db("ncrs").where("project_id", projectId).orderBy("created_at"),
      db("grn as g")
        .leftJoin("purchase_orders as po", "g.po_id", "po.id")
        .select("g.*", "po.po_no")
        .where("po.project_id", projectId),
    ]);

    const ndeRecords = joints.length
      ? await db("nde_records").whereIn("joint_id", joints.map((j) => j.id))
      : [];

    res.json({
      mrb_summary: {
        project_no: project?.project_no,
        project_name: project?.name,
        client: project?.client_name,
        generated_at: new Date().toISOString(),
      },
      sections: {
        weld_register: {
          title: "Weld Joint Register",
          count: joints.length,
          items: joints,
        },
        nde_reports: {
          title: "NDE Reports",
          count: ndeRecords.length,
          items: ndeRecords,
        },
        itp: {
          title: "Inspection & Test Plan",
          count: itpSteps.length,
          approved: itpSteps.filter((s) => s.status === "approved").length,
          items: itpSteps,
        },
        ncrs: {
          title: "Non-Conformance Reports",
          count: ncrs.length,
          open: ncrs.filter((n) => n.status !== "closed").length,
          items: ncrs,
        },
        material_certs: {
          title: "Material Receiving & Certs",
          count: inspections.length,
          items: inspections,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
