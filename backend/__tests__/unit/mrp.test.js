'use strict';

// Mock DB before requiring mrp
jest.mock('../../src/db/knex', () => {
  const mockFn = jest.fn();
  mockFn.fn = {};
  return mockFn;
});

const db = require('../../src/db/knex');
const { calculateMRP } = require('../../src/services/mrp');

// ── DB mock helpers ────────────────────────────────────────────
function mockDbChain(resolvedValue) {
  const chain = {
    where:    jest.fn().mockReturnThis(),
    whereIn:  jest.fn().mockReturnThis(),
    whereNull:jest.fn().mockReturnThis(),
    select:   jest.fn().mockResolvedValue(resolvedValue),
    first:    jest.fn().mockResolvedValue(resolvedValue),
  };
  return chain;
}

// ── Test data ──────────────────────────────────────────────────
const bomFlat = [
  // root assembly
  { id: 'a1', project_id: 'P-001', parent_id: null, description: 'Shell Assembly', quantity: 1, pn: 'ASM-001', material: 'Assembly', unit: 'EA' },
  // children (leaves)
  { id: 'p1', project_id: 'P-001', parent_id: 'a1', description: '316L Plate 10mm', quantity: 4, pn: 'PLT-001', material: '316L SS', unit: 'SHT' },
  { id: 'p2', project_id: 'P-001', parent_id: 'a1', description: 'ER316L Filler Wire', quantity: 10, pn: 'WIRE-001', material: 'Consumable', unit: 'KG' },
];

const inventory = [
  { description: '316L Plate 10mm',  qty_on_hand: 6, qty_reserved: 2 },  // net 4 — exactly enough
  { description: 'ER316L Filler Wire', qty_on_hand: 5, qty_reserved: 0 }, // net 5 — SHORT by 5
];

describe('calculateMRP', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    let callCount = 0;
    db.mockImplementation((table) => {
      if (table === 'bom_items') {
        callCount++;
        // First call = root items (whereNull parent_id), second = all items
        if (callCount === 1) return mockDbChain([bomFlat[0]]);    // roots only
        return mockDbChain(bomFlat);                               // all items
      }
      if (table === 'inventory_items') return mockDbChain(inventory);
      if (table === 'projects') {
        const chain = mockDbChain({ contract_value: 100000 });
        chain.where = jest.fn().mockReturnThis();
        chain.select = jest.fn().mockReturnThis();
        chain.first = jest.fn().mockResolvedValue({ contract_value: 100000 });
        return chain;
      }
      return mockDbChain([]);
    });
  });

  test('returns an array of MRP lines', async () => {
    const result = await calculateMRP('P-001');
    expect(Array.isArray(result)).toBe(true);
  });

  test('only returns leaf BOM items (no assemblies)', async () => {
    const result = await calculateMRP('P-001');
    const descriptions = result.map(r => r.description);
    expect(descriptions).not.toContain('Shell Assembly');
    expect(descriptions).toContain('316L Plate 10mm');
    expect(descriptions).toContain('ER316L Filler Wire');
  });

  test('plate has status "ok" when on-hand meets required', async () => {
    const result = await calculateMRP('P-001');
    const plate = result.find(r => r.description === '316L Plate 10mm');
    expect(plate).toBeDefined();
    expect(plate.shortage_qty).toBe(0);
    expect(plate.status).toBe('ok');
  });

  test('filler wire has status "short" when on-hand insufficient', async () => {
    const result = await calculateMRP('P-001');
    const wire = result.find(r => r.description === 'ER316L Filler Wire');
    expect(wire).toBeDefined();
    expect(wire.shortage_qty).toBe(5);
    expect(wire.status).toBe('short');
  });

  test('required_qty respects parent multiplier', async () => {
    const result = await calculateMRP('P-001');
    const plate = result.find(r => r.description === '316L Plate 10mm');
    // qty = 4 × parent qty 1 = 4
    expect(plate.required_qty).toBe(4);
  });

  test('each MRP line has required fields', async () => {
    const result = await calculateMRP('P-001');
    result.forEach(line => {
      expect(line).toHaveProperty('bom_item_id');
      expect(line).toHaveProperty('description');
      expect(line).toHaveProperty('required_qty');
      expect(line).toHaveProperty('on_hand_qty');
      expect(line).toHaveProperty('shortage_qty');
      expect(line).toHaveProperty('status');
    });
  });

  test('item with no inventory entry has shortage equal to required qty', async () => {
    // Remove both inventory items to simulate empty store
    db.mockImplementation((table) => {
      if (table === 'bom_items') {
        const callsBefore = db.mock.calls.filter(c => c[0] === 'bom_items').length;
        if (callsBefore <= 1) return mockDbChain([bomFlat[0]]);
        return mockDbChain(bomFlat);
      }
      if (table === 'inventory_items') return mockDbChain([]);
      if (table === 'projects') {
        const c = mockDbChain(null);
        c.first = jest.fn().mockResolvedValue({ contract_value: 100000 });
        return c;
      }
      return mockDbChain([]);
    });

    const result = await calculateMRP('P-001');
    result.forEach(line => {
      expect(line.shortage_qty).toBe(line.required_qty);
      expect(line.status).toBe('short');
    });
  });
});
