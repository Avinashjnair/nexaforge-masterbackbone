const db = require("../db/knex");
const { publish, TOPICS } = require("../events/rabbitmq");

/**
 * ITP Engine — enforces inspection point rules.
 *
 * Each step has three inspection parties (internal / customer / tpi),
 * each assigned a code:
 *   P (Perform):     NexaForge QC executes the inspection.
 *   R (Review):      Document/record review only — no physical block.
 *   W (Witness):     Inspector must attend; step proceeds after witnessing.
 *   H (Hold):        Production physically stops until this party approves.
 *
 * A step is "hold-active" when ANY party assigned H has not yet given an
 * "approved" sign-off for that party slot.
 */

async function signOffStep(itpStepId, signedBy, roleAtSign, result, comments, party = "internal") {
  const step = await db("itp_steps").where("id", itpStepId).first();
  if (!step) {
    const err = new Error("ITP step not found");
    err.status = 404;
    throw err;
  }

  // Validate that this party is actually assigned to this step
  const partyCodeMap = {
    internal: step.internal_code,
    customer: step.customer_code,
    tpi:      step.tpi_code,
  };
  const partyCode = partyCodeMap[party];
  if (!partyCode) {
    const err = new Error(`Party '${party}' is not assigned to this ITP step`);
    err.status = 400;
    throw err;
  }

  // Surveillance (S hold_type legacy): always resolves as approved
  const isSurveillance = step.hold_type === "S";
  const finalResult = isSurveillance ? "approved" : result;

  const [signOff] = await db("itp_sign_offs")
    .insert({
      itp_step_id: itpStepId,
      signed_by: signedBy,
      role_at_sign: roleAtSign,
      result: finalResult,
      comments: comments || null,
      party,
    })
    .returning("*");

  // Re-fetch all sign-offs to recompute hold status
  const allSignOffs = await db("itp_sign_offs")
    .where("itp_step_id", itpStepId)
    .select("party", "result")
    .orderBy("signed_at", "desc");

  // Latest sign-off per party
  const latestByParty = {};
  allSignOffs.forEach((so) => {
    if (!latestByParty[so.party]) latestByParty[so.party] = so.result;
  });

  // Hold is active if ANY H-code party has not yet given an approved sign-off
  const holdParties = Object.entries(partyCodeMap)
    .filter(([, code]) => code === "H")
    .map(([p]) => p);
  const holdActive = holdParties.some((p) => latestByParty[p] !== "approved");

  // Overall step status
  const assignedParties = Object.entries(partyCodeMap)
    .filter(([, code]) => !!code)
    .map(([p]) => p);
  const allApproved = assignedParties.every((p) => latestByParty[p] === "approved");
  const anyRejected = assignedParties.some((p) => latestByParty[p] === "rejected");

  const newStatus = anyRejected ? "rejected" : allApproved ? "approved" : "pending";

  await db("itp_steps").where("id", itpStepId).update({
    status: newStatus,
    is_hold_active: holdActive,
    updated_at: db.fn.now(),
  });

  // Emit event when a H-point is triggered (rejected or not yet cleared)
  if (holdActive && result !== "approved") {
    await publish(TOPICS.HOLD_POINT_TRIGGERED, {
      itpStepId,
      projectId: step.project_id,
      stepNo: step.step_no,
      activity: step.activity,
      result,
      party,
      signedBy,
    }).catch((e) => console.warn("[ITP] event publish failed:", e.message));
  }

  // Auto-raise NCR when a quality gate step is rejected
  let autoNcr = null;
  if (newStatus === "rejected") {
    try {
      const [{ count }] = await db("ncrs").count("id as count");
      const ncrNo = `NCR-${String(Number(count) + 1).padStart(4, "0")}`;

      const [ncr] = await db("ncrs")
        .insert({
          project_id: step.project_id,
          ncr_no: ncrNo,
          title: `Quality gate failed — ITP Step ${step.step_no}: ${step.activity}`,
          description: `Auto-raised when ITP step was rejected by party '${party}'. Comments: ${comments || "none"}`,
          severity: "major",
          status: "open",
          raised_by: signedBy,
        })
        .returning("*");

      autoNcr = ncr;

      await publish(TOPICS.QUALITY_GATE_FAILED, {
        itpStepId,
        projectId: step.project_id,
        stepNo: step.step_no,
        activity: step.activity,
        party,
        ncrId: ncr.id,
        ncrNo: ncr.ncr_no,
      }).catch((e) => console.warn("[ITP] quality_gate_failed publish failed:", e.message));

      await publish(TOPICS.NCR_RAISED, {
        ncrId: ncr.id,
        ncrNo: ncr.ncr_no,
        projectId: step.project_id,
        severity: "major",
        raisedBy: signedBy,
      }).catch((e) => console.warn("[ITP] ncr_raised publish failed:", e.message));

      console.log(`[ITP] Auto-NCR ${ncrNo} raised for rejected step ${step.step_no} on project ${step.project_id}`);
    } catch (e) {
      console.error("[ITP] Auto-NCR creation failed:", e.message);
    }
  }

  return {
    step: { ...step, status: newStatus, is_hold_active: holdActive },
    signOff,
    surveillance: isSurveillance,
    auto_ncr: autoNcr,
  };
}

async function hasActiveHoldBlock(projectId) {
  return db("itp_steps")
    .where({ project_id: projectId, is_hold_active: true })
    .select("id", "step_no", "activity");
}

module.exports = { signOffStep, hasActiveHoldBlock };
