const db = require("../db/knex");

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Logs every mutating request to audit_log after the response is sent.
// READ requests are intentionally excluded to avoid noise.
function auditLog(req, res, next) {
  if (!MUTATION_METHODS.has(req.method)) return next();

  const originalJson = res.json.bind(res);

  res.json = function (body) {
    res.json = originalJson;

    // Fire-and-forget — never block the response
    setImmediate(async () => {
      try {
        const parts = req.path.replace(/^\//, "").split("/");
        const entity = parts[0] || "unknown";
        const entityId = parts[1] || null;

        await db("audit_log").insert({
          user_id: req.user?.sub || null,
          action: req.method,
          entity,
          entity_id: entityId,
          new_values: req.body ? JSON.stringify(req.body) : null,
          ip_address: req.ip,
          user_agent: req.headers["user-agent"] || null,
        });
      } catch (err) {
        console.error("[AuditLog] write error:", err.message);
      }
    });

    return originalJson(body);
  };

  next();
}

module.exports = { auditLog };
