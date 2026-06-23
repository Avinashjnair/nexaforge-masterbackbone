const { canTransition, assertTransition, TRANSITIONS } = require("../services/ncrStateMachine");

describe("NCR State Machine", () => {
  describe("canTransition", () => {
    it("allows open → under_review", () => {
      expect(canTransition("open", "under_review")).toBe(true);
    });

    it("blocks open → closed (skip)", () => {
      expect(canTransition("open", "closed")).toBe(false);
    });

    it("allows under_review → rework", () => {
      expect(canTransition("under_review", "rework")).toBe(true);
    });

    it("allows rework → under_review (re-inspection loop)", () => {
      expect(canTransition("rework", "under_review")).toBe(true);
    });

    it("blocks rework → closed (skip)", () => {
      expect(canTransition("rework", "closed")).toBe(false);
    });

    it("allows under_review → accepted", () => {
      expect(canTransition("under_review", "accepted")).toBe(true);
    });

    it("allows accepted → closed", () => {
      expect(canTransition("accepted", "closed")).toBe(true);
    });

    it("blocks closed → any (terminal state)", () => {
      Object.keys(TRANSITIONS).forEach((s) => {
        if (s !== "closed") expect(canTransition("closed", s)).toBe(false);
      });
    });

    it("handles unknown status gracefully", () => {
      expect(canTransition("nonexistent", "open")).toBe(false);
    });
  });

  describe("assertTransition", () => {
    it("throws 422 on invalid transition", () => {
      expect(() => assertTransition("open", "closed")).toThrow();
      try {
        assertTransition("open", "closed");
      } catch (err) {
        expect(err.status).toBe(422);
        expect(err.message).toContain("open");
        expect(err.message).toContain("closed");
      }
    });

    it("does not throw on valid transition", () => {
      expect(() => assertTransition("open", "under_review")).not.toThrow();
    });
  });
});
