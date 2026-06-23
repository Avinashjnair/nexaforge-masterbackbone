'use strict';

const { canTransition, assertTransition, TRANSITIONS } = require('../../src/services/ncrStateMachine');

describe('NCR State Machine', () => {
  describe('canTransition', () => {
    test('open → under_review is valid', () => {
      expect(canTransition('open', 'under_review')).toBe(true);
    });

    test('open → closed is invalid (cannot skip states)', () => {
      expect(canTransition('open', 'closed')).toBe(false);
    });

    test('open → rework is invalid', () => {
      expect(canTransition('open', 'rework')).toBe(false);
    });

    test('under_review → rework is valid', () => {
      expect(canTransition('under_review', 'rework')).toBe(true);
    });

    test('under_review → accepted is valid', () => {
      expect(canTransition('under_review', 'accepted')).toBe(true);
    });

    test('under_review → rejected is valid', () => {
      expect(canTransition('under_review', 'rejected')).toBe(true);
    });

    test('under_review → closed is valid (direct disposition)', () => {
      expect(canTransition('under_review', 'closed')).toBe(true);
    });

    test('rework → under_review is valid (re-inspection loop)', () => {
      expect(canTransition('rework', 'under_review')).toBe(true);
    });

    test('rework → closed is invalid (must re-inspect first)', () => {
      expect(canTransition('rework', 'closed')).toBe(false);
    });

    test('accepted → closed is valid', () => {
      expect(canTransition('accepted', 'closed')).toBe(true);
    });

    test('rejected → closed is valid', () => {
      expect(canTransition('rejected', 'closed')).toBe(true);
    });

    test('closed → anything is invalid (terminal state)', () => {
      Object.keys(TRANSITIONS).forEach(state => {
        expect(canTransition('closed', state)).toBe(false);
      });
    });

    test('unknown status returns false', () => {
      expect(canTransition('bogus', 'open')).toBe(false);
      expect(canTransition('open', 'bogus')).toBe(false);
    });
  });

  describe('assertTransition', () => {
    test('valid transition does not throw', () => {
      expect(() => assertTransition('open', 'under_review')).not.toThrow();
    });

    test('invalid transition throws with status 422', () => {
      try {
        assertTransition('open', 'closed');
        fail('should have thrown');
      } catch (err) {
        expect(err.status).toBe(422);
        expect(err.message).toMatch(/Invalid NCR transition/);
        expect(err.message).toMatch(/open.*closed/);
      }
    });

    test('error message lists allowed transitions', () => {
      try {
        assertTransition('rework', 'closed');
      } catch (err) {
        expect(err.message).toMatch(/under_review/);
      }
    });

    test('closed state error says "none"', () => {
      try {
        assertTransition('closed', 'open');
      } catch (err) {
        expect(err.message).toMatch(/none/);
      }
    });
  });

  describe('TRANSITIONS map completeness', () => {
    test('all states have defined transitions array', () => {
      ['open', 'under_review', 'rework', 'accepted', 'rejected', 'closed'].forEach(state => {
        expect(Array.isArray(TRANSITIONS[state])).toBe(true);
      });
    });
  });
});
