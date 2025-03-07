import { getTagsInSelectionFromRichText } from '../formatting';
import { parseHTMLToRichText } from '../stringToolbox';

describe('RichText: getTagsInSelectionFromRichText', () => {
  test('getTagsInSelectionFromRichText out of tag', () => {
    const ast = parseHTMLToRichText('a<i>a</i>a');
    const result = getTagsInSelectionFromRichText(ast, 0, 1);
    expect(result).toStrictEqual([]);
  });
  test('getTagsInSelectionFromRichText out of tag 2', () => {
    const ast = parseHTMLToRichText('a<i>a</i>a');
    const result = getTagsInSelectionFromRichText(ast, 2, 3);
    expect(result).toStrictEqual([]);
  });
  test('getTagsInSelectionFromRichText out of tag 3', () => {
    const ast = parseHTMLToRichText('a<i>a</i>a');
    const result = getTagsInSelectionFromRichText(ast, 0, 3);
    expect(result).toStrictEqual([]);
  });
  test('getTagsInSelectionFromRichText in tag 1', () => {
    const ast = parseHTMLToRichText('a<i>a</i>a');
    const result = getTagsInSelectionFromRichText(ast, 1, 2);
    expect(result).toStrictEqual(['i']);
  });
  test('getTagsInSelectionFromRichText in tag 2', () => {
    const ast = parseHTMLToRichText('a<i><b>a</b></i>a');
    const result = getTagsInSelectionFromRichText(ast, 1, 2);
    expect(result).toStrictEqual(['i', 'b']);
  });
  test('getTagsInSelectionFromRichText in tag 3', () => {
    const ast = parseHTMLToRichText('a<i><b>a</b>b</i>a');
    const result = getTagsInSelectionFromRichText(ast, 1, 3);
    expect(result).toStrictEqual(['i']);
  });
  test('getTagsInSelectionFromRichText out of range', () => {
    const ast = parseHTMLToRichText('a<i><b>a</b>b</i>a');
    const result = getTagsInSelectionFromRichText(ast, 5, 8);
    expect(result).toStrictEqual([]);
  });
});
