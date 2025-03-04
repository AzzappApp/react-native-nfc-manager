import { insertTag } from './toolbox';

describe('RichText: parseHTML', () => {
  describe('Very simple & basic: add', () => {
    test('simple add first position', () => {
      const result = insertTag('ab', 0, 1, 'b');
      expect(result).toBe('<b>a</b>b');
    });
    test('simple add second position', () => {
      const result = insertTag('ab', 1, 2, 'b');
      expect(result).toBe('a<b>b</b>');
    });
    test('simple no insert', () => {
      const result = insertTag('ab', 1, 1, 'b');
      expect(result).toBe('ab');
    });
    test('simple add full text', () => {
      const result = insertTag('ab', 0, 2, 'b');
      expect(result).toBe('<b>ab</b>');
    });
    test('out of range, start > end', () => {
      const result = insertTag('ab', 10, 2, 'b');
      expect(result).toBe('ab');
    });
    test('out of range, start > node.end', () => {
      const result = insertTag('ab', 10, 20, 'b');
      expect(result).toBe('ab');
    });
    test('out of range, start < 0 & end > node.length', () => {
      const result = insertTag('ab', -1, 20, 'b');
      expect(result).toBe('<b>ab</b>');
    });
  });

  describe('Very simple & basic: remove', () => {
    test('simple remove first position', () => {
      const result = insertTag('<b>a</b>b', 0, 1, 'b');
      expect(result).toBe('ab');
    });
    test('simple add second position', () => {
      const result = insertTag('a<b>b</b>', 1, 2, 'b');
      expect(result).toBe('ab');
    });
    test('simple add full text', () => {
      const result = insertTag('<b>ab</b>', 0, 2, 'b');
      expect(result).toBe('ab');
    });
  });
});
