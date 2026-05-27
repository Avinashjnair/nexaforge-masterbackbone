/**
 * Unit tests for the MRP calculation service.
 * Mocks the DB so no real Postgres needed.
 */
jest.mock("../db/knex");

const db = require("../db/knex");
const { calculateMRP } = require("../services/mrp");

describe("calculateMRP", () => {
  const PROJECT_ID = "proj-001";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns shortage when inventory is insufficient", async () => {
    // BOM: one top-level assembly with two children (leaves)
    const bomItems = [
      { id: "a1", project_id: PROJECT_ID, parent_id: null, description: "Shell Plate", quantity: 10, unit: "pcs", pn: null, material: "316L", item_type: "assembly" },
      { id: "a2", project_id: PROJECT_ID, parent_id: "a1", description: "Nozzle 2\"", quantity: 4, unit: "pcs", pn: "N-001", material: "316L", item_type: "part" },
      { id: "a3", project_id: PROJECT_ID, parent_id: "a1", description: "Gasket Set", quantity: 4, unit: "set", pn: "G-001", material: "PTFE", item_type: "part" },
    ];

    const inventoryItems = [
      { description: "Nozzle 2\"", qty_on_hand: 20, qty_reserved: 10 },  // available: 10, need: 40 → short
      { description: "Gasket Set", qty_on_hand: 50, qty_reserved: 5 },   // available: 45, need: 40 → ok
    ];

    // Mock knex chain
    db.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      whereNull: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValueOnce(bomItems.filter(b => !b.parent_id)) // roots
               .mockResolvedValueOnce(bomItems), // all items
      whereIn: jest.fn().mockReturnThis(),
    });

    // Override the inventory query
    db.mockReturnValueOnce({
      where: jest.fn().mockReturnThis(),
      whereNull: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue(bomItems.filter(b => !b.parent_id)),
    });

    // Simpler approach: spy on module-level db calls
    const mockDb = jest.fn();
    mockDb.mockImplementation((table) => {
      if (table === "bom_items") {
        return {
          where: jest.fn().mockReturnThis(),
          whereNull: jest.fn().mockReturnThis(),
          select: jest.fn()
            .mockResolvedValueOnce(bomItems.filter(b => !b.parent_id))
            .mockResolvedValueOnce(bomItems),
        };
      }
      if (table === "inventory_items") {
        return {
          whereIn: jest.fn().mockReturnThis(),
          select: jest.fn().mockResolvedValue(inventoryItems),
        };
      }
    });

    // Inject mock
    jest.resetModules();
    jest.doMock("../db/knex", () => mockDb);
    const { calculateMRP: mrp } = require("../services/mrp");

    const result = await mrp(PROJECT_ID);

    const nozzle = result.find(r => r.description === "Nozzle 2\"");
    const gasket = result.find(r => r.description === "Gasket Set");

    expect(nozzle.status).toBe("short");
    expect(nozzle.shortage_qty).toBe(30); // need 40, have 10
    expect(gasket.status).toBe("ok");
    expect(gasket.shortage_qty).toBe(0);
  });

  it("returns ok when inventory covers all requirements", async () => {
    const bomItems = [
      { id: "b1", project_id: PROJECT_ID, parent_id: null, description: "Valve DN50", quantity: 2, unit: "pcs", pn: "V-001", material: "SS", item_type: "part" },
    ];

    const mockDb = jest.fn();
    mockDb.mockImplementation((table) => {
      if (table === "bom_items") {
        return {
          where: jest.fn().mockReturnThis(),
          whereNull: jest.fn().mockReturnThis(),
          select: jest.fn().mockResolvedValue(bomItems),
        };
      }
      if (table === "inventory_items") {
        return {
          whereIn: jest.fn().mockReturnThis(),
          select: jest.fn().mockResolvedValue([{ description: "Valve DN50", qty_on_hand: 10, qty_reserved: 0 }]),
        };
      }
    });

    jest.resetModules();
    jest.doMock("../db/knex", () => mockDb);
    const { calculateMRP: mrp } = require("../services/mrp");

    const result = await mrp(PROJECT_ID);
    expect(result[0].status).toBe("ok");
    expect(result[0].shortage_qty).toBe(0);
    expect(result[0].required_qty).toBe(2);
    expect(result[0].on_hand_qty).toBe(10);
  });

  it("returns shortage when item not in inventory at all", async () => {
    const bomItems = [
      { id: "c1", project_id: PROJECT_ID, parent_id: null, description: "Exotic Part", quantity: 5, unit: "pcs", pn: null, material: null, item_type: "part" },
    ];

    const mockDb = jest.fn();
    mockDb.mockImplementation((table) => {
      if (table === "bom_items") {
        return {
          where: jest.fn().mockReturnThis(),
          whereNull: jest.fn().mockReturnThis(),
          select: jest.fn().mockResolvedValue(bomItems),
        };
      }
      if (table === "inventory_items") {
        return {
          whereIn: jest.fn().mockReturnThis(),
          select: jest.fn().mockResolvedValue([]),
        };
      }
    });

    jest.resetModules();
    jest.doMock("../db/knex", () => mockDb);
    const { calculateMRP: mrp } = require("../services/mrp");

    const result = await mrp(PROJECT_ID);
    expect(result[0].status).toBe("short");
    expect(result[0].shortage_qty).toBe(5);
    expect(result[0].on_hand_qty).toBe(0);
  });
});
