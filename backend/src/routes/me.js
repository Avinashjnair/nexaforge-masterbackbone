const express = require("express");
const { DEPT_PAGE_MAP } = require("../middleware/auth");

const router = express.Router();

// Sidebar definition — order matters (this is render order)
const ALL_NAV_ITEMS = [
  { page: "dashboard",   label: "Dashboard",       group: "Overview",    badge: null },
  { page: "projects",    label: "Projects",         group: "Overview",    badge: null },
  { page: "marketing",   label: "Marketing & CRM",  group: "Operations",  badge: null },
  { page: "production",  label: "Production",       group: "Operations",  badge: null },
  { page: "quality",     label: "Quality Control",  group: "Operations",  badge: null },
  { page: "procurement", label: "Procurement",      group: "Operations",  badge: null },
  { page: "inventory",   label: "Store & Inventory",group: "Operations",  badge: null },
  { page: "finance",     label: "Finance",          group: "Management",  badge: null },
  { page: "hr",          label: "HR & Workforce",   group: "Management",  badge: null },
  { page: "welding",     label: "Welding / WPS",    group: "Management",  badge: null },
  { page: "analytics",   label: "Analytics & KPIs", group: "Management",  badge: null },
];

// GET /me/permissions
// Returns the sidebar items the current user may access, plus their department colour.
router.get("/permissions", (req, res) => {
  const role = req.user?.role?.toLowerCase();
  const dept = req.user?.department?.toLowerCase();
  const isGM = role === "gm";

  const allowedPages = ALL_NAV_ITEMS.filter(({ page }) => {
    if (isGM) return true;
    const allowed = DEPT_PAGE_MAP[page] || [];
    return allowed.includes(dept);
  });

  const DEPT_COLOURS = {
    gm:          "#7C3AED",
    marketing:   "#2563EB",
    production:  "#D97706",
    qc:          "#059669",
    finance:     "#DC2626",
    store:       "#0891B2",
    hr:          "#E11D48",
    procurement: "#4338CA",
    welding:     "#EA580C",
  };

  res.json({
    department: dept,
    role,
    accent: DEPT_COLOURS[dept] || "#e8622a",
    nav: allowedPages,
  });
});

module.exports = router;
