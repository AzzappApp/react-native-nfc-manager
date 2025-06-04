import { cleanObject } from '../objectHelpers';

describe('cleanObject', () => {
  it('should remove null values', () => {
    const input = { a: 'foo', b: null, c: 42 };
    const result = cleanObject(input);
    expect(result).toEqual({ a: 'foo', c: 42 });
  });

  it('should remove undefined values', () => {
    const input = { a: 'bar', b: undefined, c: true };
    const result = cleanObject(input);
    expect(result).toEqual({ a: 'bar', c: true });
  });

  it('should remove empty arrays', () => {
    const input = { a: [], b: [1, 2], c: 'baz' };
    const result = cleanObject(input);
    expect(result).toEqual({ b: [1, 2], c: 'baz' });
  });

  it('should keep empty strings and 0', () => {
    const input = { a: '', b: 0, c: null };
    const result = cleanObject(input);
    expect(result).toEqual({ a: '', b: 0 });
  });

  it('should return empty object if all values are invalid', () => {
    const input = { a: null, b: undefined, c: [] };
    const result = cleanObject(input);
    expect(result).toEqual({});
  });

  it('should not mutate the original object', () => {
    const input = { a: null, b: 1 };
    const copy = { ...input };
    cleanObject(input);
    expect(input).toEqual(copy);
  });
});
