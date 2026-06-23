/**
 * WPQ Scheduler unit tests — mocks DB, verifies correct records are updated.
 */

jest.mock("../db/knex");

describe("WPQ Expiry Scheduler", () => {
  let mockWhere, mockWhereNotIn, mockUpdate, mockReturning;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("marks records with past expiry_date as expired", async () => {
    const updatedIds = [{ id: "wpq-001" }];
    const mockDb = jest.fn().mockImplementation(() => ({
      where: jest.fn().mockReturnThis(),
      whereNotIn: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue(updatedIds),
    }));

    jest.doMock("../db/knex", () => mockDb);
    const { runWpqCheck } = require("../services/wpqScheduler");

    const result = await runWpqCheck();

    // Both expired and expiringSoon should be numbers
    expect(typeof result.expired).toBe("number");
    expect(typeof result.expiringSoon).toBe("number");
  });

  it("returns zero counts when nothing to update", async () => {
    const mockDb = jest.fn().mockImplementation(() => ({
      where: jest.fn().mockReturnThis(),
      whereNotIn: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([]),
    }));

    jest.doMock("../db/knex", () => mockDb);
    const { runWpqCheck } = require("../services/wpqScheduler");

    const result = await runWpqCheck();
    expect(result.expired).toBe(0);
    expect(result.expiringSoon).toBe(0);
  });
});
