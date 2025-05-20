import { evaluateExpr } from '../helpers';
import type { EnrichedData, EnrichedDataFieldExpr } from '../types';

describe('evaluateExpr', () => {
  const baseData: EnrichedData = {
    contact: {
      firstName: 'Alice',
      phoneNumbers: [{ number: '+123', label: 'mobile' }],
      title: '',
      socials: null,
    },
    profile: {
      summary: 'Dev',
      interests: [],
    },
  };

  it('returns true for non-empty string field', () => {
    expect(evaluateExpr(baseData, 'contact.firstName')).toBe(true);
  });

  it('returns false for empty string', () => {
    const data = { ...baseData, contact: { ...baseData.contact, title: '  ' } };
    expect(evaluateExpr(data, 'contact.title')).toBe(false);
  });

  it('returns true for non-empty array', () => {
    expect(evaluateExpr(baseData, 'contact.phoneNumbers')).toBe(true);
  });

  it('returns false for empty array', () => {
    expect(evaluateExpr(baseData, 'profile.interests')).toBe(false);
  });

  it('returns false for null', () => {
    const data = {
      ...baseData,
      profile: { ...baseData.profile, summary: null },
    };
    expect(evaluateExpr(data, 'profile.summary')).toBe(false);
  });

  it('returns true for valid function expression', () => {
    const expr = (data: EnrichedData) => data.contact.firstName === 'Alice';
    expect(evaluateExpr(baseData, expr)).toBe(true);
  });

  it('returns false if function throws', () => {
    const expr = (_data: EnrichedData) => {
      throw new Error('oops');
    };
    expect(evaluateExpr(baseData, expr)).toBe(false);
  });

  it('returns true for all() if all expressions are true', () => {
    const expr: EnrichedDataFieldExpr = {
      all: ['contact.firstName', 'contact.phoneNumbers'],
    };
    expect(evaluateExpr(baseData, expr)).toBe(true);
  });

  it('returns false for all() if one expression is false', () => {
    const expr: EnrichedDataFieldExpr = {
      all: ['contact.firstName', 'profile.interests'],
    };
    expect(evaluateExpr(baseData, expr)).toBe(false);
  });

  it('returns true for any() if at least one is true', () => {
    const expr: EnrichedDataFieldExpr = {
      any: ['profile.interests', 'contact.firstName'],
    };
    expect(evaluateExpr(baseData, expr)).toBe(true);
  });

  it('returns false for any() if all are false', () => {
    const expr: EnrichedDataFieldExpr = {
      any: ['profile.interests', 'contact.title'],
    };
    expect(evaluateExpr(baseData, expr)).toBe(false);
  });

  it('returns true for not() if inner is false', () => {
    const expr: EnrichedDataFieldExpr = {
      not: 'profile.interests',
    };
    expect(evaluateExpr(baseData, expr)).toBe(true);
  });

  it('returns false for not() if inner is true', () => {
    const expr: EnrichedDataFieldExpr = {
      not: 'contact.firstName',
    };
    expect(evaluateExpr(baseData, expr)).toBe(false);
  });
});
