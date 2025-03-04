import { insertTag } from './toolbox';

describe('RichText: parseHTML', () => {
  describe('duplicated Tag: add and clean up', () => {
    test('add nested in first position', () => {
      const result = insertTag('<b>a</b>b', 0, 2, 'b');
      expect(result).toBe('<b>ab</b>');
    });
    test('add nested in second position', () => {
      const result = insertTag('a<b>b</b>', 0, 2, 'b');
      expect(result).toBe('<b>ab</b>');
    });
    test('add nested in full ', () => {
      const result = insertTag('a<b><i>b</i></b>', 0, 2, 'b');
      expect(result).toBe('<b>a<i>b</i></b>');
    });
    test('add nested inside anther tag', () => {
      const result = insertTag('<b>ab</b>', 0, 1, 'i');
      expect(result).toBe('<b><i>a</i>b</b>');
    });
    test('add nested inside anther tag 2', () => {
      const result = insertTag('<b>aab</b>', 1, 2, 'i');
      expect(result).toBe('<b>a<i>a</i>b</b>');
    });
    test('add nested inside anther tag 3', () => {
      const result = insertTag('<b>a<i>a</i>b</b>', 0, 1, 'i');
      expect(result).toBe('<b><i>aa</i>b</b>');
    });
    test('add nested inside anther tag 4', () => {
      const result = insertTag('<b>a<i>a</i>b</b>', 0, 3, 'i');
      expect(result).toBe('<b><i>aab</i></b>');
    });
    test('simple overlapped 1', () => {
      const result = insertTag('<b>a<i>a</i>b</b>', 0, 2, 'i');
      expect(result).toBe('<b><i>aa</i>b</b>');
    });
    test('simple overlapped 2', () => {
      const result = insertTag('<b>a<i>a</i>b</b>', 1, 3, 'i');
      expect(result).toBe('<b>a<i>ab</i></b>');
    });
    test('simple overlapped 3', () => {
      const result = insertTag('<b>a<i>a</i>b</b>', 0, 3, 'i');
      expect(result).toBe('<b><i>aab</i></b>');
    });
    test('split text 1', () => {
      const result = insertTag('<b>ab</b>c', 1, 3, 'i');
      expect(result).toBe('<b>a</b><i><b>b</b>c</i>');
    });
    test('split text 2', () => {
      const result = insertTag('<b><c>ab</c></b>c', 1, 3, 'i');
      expect(result).toBe('<b><c>a</c></b><i><b><c>b</c></b>c</i>');
    });
    test('split text 3', () => {
      const result = insertTag('<b><c>ab</c></b><i>c</i>', 1, 3, 'i');
      expect(result).toBe('<b><c>a</c></b><i><b><c>b</c></b>c</i>');
    });
    test('split text 4', () => {
      const result = insertTag('<b><c>ab</c></b><c>c</c>', 1, 3, 'i');
      expect(result).toBe('<b><c>a</c></b><i><b><c>b</c></b><c>c</c></i>');
    });
    test('remove sub style 1', () => {
      const result = insertTag('<i>abc</i>', 1, 2, 'i');
      expect(result).toBe('<i>a</i>b<i>c</i>');
    });
    test('remove sub style 2', () => {
      const result = insertTag('<i><b>ab</b>c</i>', 1, 2, 'i');
      expect(result).toBe('<i><b>a</b></i><b>b</b><i>c</i>');
    });
  });
});
