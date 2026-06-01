const jwt = require("jsonwebtoken");

// Role hierarchy — higher index = more privilege
const ROLE_HIERARCHY = ["user", "senior", "manager", "gm"];

function getRoleLevel(role) {
  const idx = ROLE_HIERARCHY.indexOf(role?.toLowerCase());
  return idx === -1 ? -1 : idx;
}

function authenticateJWT(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Returns middleware that allows access at minRole or above
function requireRole(minRole) {
  return (req, res, next) => {
    const userLevel = getRoleLevel(req.user?.role);
    const requiredLevel = getRoleLevel(minRole);
    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

// Department keys as stored in users.department
const DEPARTMENTS = ["gm", "marketing", "production", "qc", "finance", "store", "hr", "procurement", "welding"];

// Sidebar page → departments allowed (gm always allowed — checked separately)
const DEPT_PAGE_MAP = {
  // Cross-department command centre — GM only. Other departments land directly
  // in their own module (see frontend DEPT_HOME), so they no longer get a
  // generic Dashboard nav entry.
  dashboard:   ["gm"],
  projects:    DEPARTMENTS,
  marketing:   ["marketing"],
  production:  ["production"],
  quality:     ["qc"],
  procurement: ["procurement"],
  inventory:   ["store"],
  finance:     ["finance"],
  hr:          ["hr"],
  welding:     ["welding"],
  analytics:   ["gm"],
};

// Blocks access unless the user's department matches one of the allowed departments.
// GM role bypasses all department checks.
function requireDepartment(...allowedDepts) {
  return (req, res, next) => {
    if (req.user?.role === "gm") return next();
    const dept = req.user?.department?.toLowerCase();
    if (!dept || !allowedDepts.map(d => d.toLowerCase()).includes(dept)) {
      return res.status(403).json({ error: "Access restricted to your department" });
    }
    next();
  };
}

module.exports = { authenticateJWT, requireRole, requireDepartment, DEPARTMENTS, DEPT_PAGE_MAP, ROLE_HIERARCHY };
