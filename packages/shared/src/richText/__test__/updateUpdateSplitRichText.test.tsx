import { splitRichTextIntoColumns } from '../stringUpdate';

describe('RichText: splitRichTextIntoColumns', () => {
  test('simple', () => {
    const texts = splitRichTextIntoColumns('a b c', 3);
    expect(texts[0]).toBe('a');
    expect(texts[1]).toBe('b');
    expect(texts[2]).toBe('c');
  });
  test('simple with tag', () => {
    const texts = splitRichTextIntoColumns('<b>a b c</b>', 3);
    expect(texts[0]).toBe('<b>a</b>');
    expect(texts[1]).toBe('<b>b</b>');
    expect(texts[2]).toBe('<b>c</b>');
  });
  test('simple with two tags', () => {
    const texts = splitRichTextIntoColumns('<i><b>a b c</b></i>', 3);
    expect(texts[0]).toBe('<i><b>a</b></i>');
    expect(texts[1]).toBe('<i><b>b</b></i>');
    expect(texts[2]).toBe('<i><b>c</b></i>');
  });
  test('simple not enough word', () => {
    const texts = splitRichTextIntoColumns('a b', 3);
    expect(texts[0]).toBe('a');
    expect(texts[1]).toBe('b');
    expect(texts[2]).toBe('');
  });
  test('simple multiple words', () => {
    const texts = splitRichTextIntoColumns('a b c d', 2);
    expect(texts[0]).toBe('a b');
    expect(texts[1]).toBe('c d');
  });
  test('simple multiple words with tag', () => {
    const texts = splitRichTextIntoColumns('<b>a b c d</b>', 2);
    expect(texts[0]).toBe('<b>a b</b>');
    expect(texts[1]).toBe('<b>c d</b>');
  });
});
