import { convertToNonNullArray } from '../arrayHelpers';

describe('arrayHelpers', () => {
  describe('convertToNonNullArray', () => {
    test('should returns an array filtered from the nullish value', () => {
      const baseArray = [1, {}, null, false, '', undefined];
      const nonNullArray = convertToNonNullArray(baseArray);
      expect(nonNullArray).toEqual([1, {}, false, '']);
      expect(baseArray).toEqual([1, {}, null, false, '', undefined]);
    });
  });
});
