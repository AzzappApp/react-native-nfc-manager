import { getPrecision } from '../numberHelpers';

describe('numberHelpers', () => {
  describe('getPrecision', () => {
    test('should returns the precision of the given number', () => {
      expect(getPrecision(3)).toBe(0);
      expect(getPrecision(3.2)).toBe(1);
      expect(getPrecision(3.39734)).toBe(5);
    });
  });
});
