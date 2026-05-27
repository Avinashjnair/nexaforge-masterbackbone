/**
 * NCR state machine.
 * Valid transitions only — no skipping states.
 *
 * open → under_review → rework | accepted | rejected
 * rework → under_review (re-inspection loop)
 * under_review → closed (after disposition recorded)
 */

const TRANSITIONS = {
  open:         ["under_review"],
  under_review: ["rework", "accepted", "rejected", "closed"],
  rework:       ["under_review"],
  accepted:     ["closed"],
  rejected:     ["closed"],
  closed:       [],
};

function canTransition(fromStatus, toStatus) {
  return TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
}

function assertTransition(fromStatus, toStatus) {
  if (!canTransition(fromStatus, toStatus)) {
    const err = new Error(
      `Invalid NCR transition: ${fromStatus} → ${toStatus}. Allowed: ${TRANSITIONS[fromStatus]?.join(", ") || "none"}`
    );
    err.status = 422;
    throw err;
  }
}

module.exports = { canTransition, assertTransition, TRANSITIONS };
