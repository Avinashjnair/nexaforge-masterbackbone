const express = require("express");
const { requireRole } = require("../middleware/auth");
const { calculateMRP, replenishShortages } = require("../services/mrp");
const { publish, TOPICS } = require("../events/rabbitmq");

const router = express.Router({ mergeParams: true });

// GET /api/mrp/:projectId — run MRP calculation and return shortfall report
router.get("/:projectId", async (req, res, next) => {
  try {
    const result = await calculateMRP(req.params.projectId);
    const summary = {
      total_items: result.length,
      short_count: result.filter((i) => i.status === "short").length,
      ok_count: result.filter((i) => i.status === "ok").length,
    };
    res.json({ project_id: req.params.projectId, summary, items: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/mrp/:projectId/replenish — auto-raise MR for all short items
router.post("/:projectId/replenish", requireRole("manager"), async (req, res, next) => {
  try {
    const result = await replenishShortages(req.params.projectId, req.user.sub);

    if (!result) {
      return res.json({ message: "No shortages found — nothing to replenish", replenished: false });
    }

    const { mr, shortItems } = result;

    await publish(TOPICS.MRP_REPLENISHMENT_TRIGGERED, {
      projectId: req.params.projectId,
      mrId: mr.id,
      mrNo: mr.mr_no,
      shortCount: shortItems.length,
      triggeredBy: req.user.sub,
    }).catch((e) => console.warn("[MRP] replenishment publish failed:", e.message));

    if (req.io) {
      req.io.to("dept:procurement").emit("mrp:replenishment_triggered", {
        type: "mrp:replenishment_triggered",
        projectId: req.params.projectId,
        mrNo: mr.mr_no,
        shortCount: shortItems.length,
      });
      req.io.to("dept:store").emit("mrp:replenishment_triggered", {
        type: "mrp:replenishment_triggered",
        projectId: req.params.projectId,
        mrNo: mr.mr_no,
        shortCount: shortItems.length,
      });
    }

    res.status(201).json({
      message: `MR ${mr.mr_no} raised for ${shortItems.length} short item(s)`,
      replenished: true,
      mr,
      short_items: shortItems,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
