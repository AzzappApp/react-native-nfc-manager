import { filterHiddenContactFields, mergeHiddenArray } from '../contactHelpers';
import type {
  EnrichedContactFields,
  EnrichedContactHiddenFields,
} from '@azzapp/data';

describe('filterHiddenContactFields', () => {
  const baseContact: EnrichedContactFields = {
    firstName: 'Alice',
    lastName: 'Martin',
    company: 'Acme Inc.',
    phoneNumbers: [
      { label: 'work', number: '+33123456789' },
      { label: 'mobile', number: '+33698765432' },
    ],
    emails: [
      { label: 'pro', address: 'alice@acme.com' },
      { label: 'perso', address: 'alice@gmail.com' },
    ],
  };

  it('returns contact unchanged if hidden is null', () => {
    const result = filterHiddenContactFields(baseContact, null);
    expect(result).toEqual(baseContact);
  });

  it('returns contact unchanged if hidden is empty', () => {
    const result = filterHiddenContactFields(baseContact, {});
    expect(result).toEqual(baseContact);
  });

  it('hides simple field (company)', () => {
    const hidden: EnrichedContactHiddenFields = {
      contact: { company: true },
    };
    const result = filterHiddenContactFields(baseContact, hidden);
    expect(result.company).toBeUndefined();
    expect(result.firstName).toBe('Alice');
  });

  it('filters array field (phoneNumbers)', () => {
    const hidden: EnrichedContactHiddenFields = {
      contact: { phoneNumbers: [false, true] },
    };
    const result = filterHiddenContactFields(baseContact, hidden);
    expect(result.phoneNumbers).toHaveLength(1);
    expect(result.phoneNumbers?.[0].label).toBe('work');
  });

  it('handles empty arrays in hidden config', () => {
    const hidden: EnrichedContactHiddenFields = {
      contact: { phoneNumbers: [] },
    };
    const result = filterHiddenContactFields(baseContact, hidden);
    expect(result.phoneNumbers).toEqual(baseContact.phoneNumbers);
  });

  it('handles all elements hidden in array', () => {
    const hidden: EnrichedContactHiddenFields = {
      contact: { emails: [true, true] },
    };
    const result = filterHiddenContactFields(baseContact, hidden);
    expect(result.emails).toEqual([]);
  });

  it('ignores unknown keys in hidden config', () => {
    const hidden = {
      contact: {
        unknownField: true,
      },
    } as any;

    const result = filterHiddenContactFields(baseContact, hidden);
    expect(result).toEqual(baseContact);
  });
});

describe('merge boolean array', () => {
  test('invalid input', async () => {
    const newArray = mergeHiddenArray(undefined, undefined);
    expect(newArray).toEqual(undefined);
  });
  test('disable all', async () => {
    const newArray = mergeHiddenArray([false, false], [true, true]);
    expect(newArray).toEqual([true, true]);
  });
  test('disable last', async () => {
    const newArray = mergeHiddenArray([false, false], [false, true]);
    expect(newArray).toEqual([false, true]);
  });
  test('disable first', async () => {
    const newArray = mergeHiddenArray([false, false], [true, false]);
    expect(newArray).toEqual([true, false]);
  });
  test('disable with already disable first', async () => {
    const newArray = mergeHiddenArray([true, false], [true]);
    expect(newArray).toEqual([true, true]);
  });
  test('disable with already disable last', async () => {
    const newArray = mergeHiddenArray([false, true], [true]);
    expect(newArray).toEqual([true, true]);
  });
  test('disable with already disable mix', async () => {
    const newArray = mergeHiddenArray(
      [true, false, true, false, false],
      [true, false, true],
    );
    expect(newArray).toEqual([true, true, true, false, true]);
  });
});
