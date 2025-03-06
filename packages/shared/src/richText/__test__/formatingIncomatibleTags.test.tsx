import { insertTag } from './toolbox';

describe('RichText: formatting manage incompatible tags', () => {
  describe('small and big are incompatible tags', () => {
    test('basic', () => {
      const result = insertTag('<+3>a</+3>', 0, 1, '-3');
      expect(result).toBe('<-3>a</-3>');
    });
    test('basic split in three', () => {
      const result = insertTag('<+3>abc</+3>', 1, 2, '-3');
      expect(result).toBe('<+3>a</+3><-3>b</-3><+3>c</+3>');
    });
    test('remove inner tag', () => {
      const result = insertTag('<+3>a</+3><-3>b</-3><+3>c</+3>', 1, 2, '-3');
      expect(result).toBe('<+3>a</+3>b<+3>c</+3>');
    });
    test('add global tag', () => {
      const result = insertTag('<+3>a</+3><-3>b</-3><+3>c</+3>', 0, 3, '-3');
      expect(result).toBe('<-3>abc</-3>');
    });
    test('add nested tag', () => {
      const result = insertTag('<+3>a</+3><-3>b</-3><+3>c</+3>', 0, 2, '-3');
      expect(result).toBe('<-3>ab</-3><+3>c</+3>');
    });
    test('add nested tag with bold', () => {
      const result = insertTag(
        '<b><+3>a</+3><-3>b</-3></b><+3>c</+3>',
        1,
        3,
        '-3',
      );
      expect(result).toBe('<b><+3>a</+3></b><-3><b>b</b>c</-3>');
    });
  });
});
