import { insertTag } from './toolbox';

describe('RichText: parseHTML', () => {
  describe('duplicated Tag: add and clean up', () => {
    test('real strange use case', () => {
      const result = insertTag('<i><b>ab</b>cd</i>', 1, 3, 'c');
      expect(result).toBe('<i><b>a</b><c><b>b</b>c</c>d</i>');
    });
    test('multiple remove sub tag', () => {
      const result = insertTag('<i>L<b>ab</b>cd<b>ef</b>L</i>', 0, 8, 'b');
      expect(result).toBe('<i><b>LabcdefL</b></i>');
    });
    test('multiple nested tags', () => {
      const result = insertTag('<i>L<b>ab</b>cd<b>ef</b>L</i>', 2, 6, 'b');
      expect(result).toBe('<i>L<b>abcdef</b>L</i>');
    });
    test('multiple nested tags 2', () => {
      const result = insertTag('<i>L<b>ab</b>cd<b>ef</b>L</i>', 2, 6, 'c');
      expect(result).toBe('<i>L<b>a</b><c><b>b</b>cd<b>e</b></c><b>f</b>L</i>');
    });
    test('multiple nested tags 3', () => {
      const result = insertTag('<i>L<b>ab</b>cd<b>ef</b>L</i>', 2, 6, 'i');
      expect(result).toBe('<i>L<b>a</b></i><b>b</b>cd<b>e</b><i><b>f</b>L</i>');
    });
    test('multiple nested tags 4', () => {
      const result = insertTag('<i>L<b>ab</b>cd<b>ef</b>L</i>', 2, 6, 'c');
      expect(result).toBe('<i>L<b>a</b><c><b>b</b>cd<b>e</b></c><b>f</b>L</i>');
    });
    test('multiple nested tags 5', () => {
      const result = insertTag('b<c><b>a</b></c>', 0, 2, 'b');
      expect(result).toBe('<b>b<c>a</c></b>');
    });
  });
});
