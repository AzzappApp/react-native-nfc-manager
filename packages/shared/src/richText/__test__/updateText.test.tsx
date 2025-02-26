import { checkRichTextASTCoherence } from '../internalToolbox';
import {
  parseHTMLToRichText,
  generateHTMLFromRichText,
} from '../stringToolbox';
import { updateTextInRichText } from '../stringUpdate';
import type { RichTextASTNode } from 'richText/richTextTypes';

const testResult = (node: RichTextASTNode, result: string) => {
  expect(checkRichTextASTCoherence(node)).toEqual(true);
  expect(generateHTMLFromRichText(node)).toBe(result);
};

describe('RichText: updateText', () => {
  test('simple', () => {
    const ast = parseHTMLToRichText('a');
    const result = updateTextInRichText(ast, 0, 1, 'bc');
    testResult(result, 'bc');
  });
  test('simple 2', () => {
    const ast = parseHTMLToRichText('a');
    const result = updateTextInRichText(ast, 0, 1, '');
    testResult(result, '');
  });
  test('simple 3', () => {
    const ast = parseHTMLToRichText('abc');
    const result = updateTextInRichText(ast, 1, 2, '');
    testResult(result, 'ac');
  });
  test('simple 4', () => {
    const ast = parseHTMLToRichText('abc');
    const result = updateTextInRichText(ast, 0, 3, '');
    testResult(result, '');
  });
  test('simple 5', () => {
    const ast = parseHTMLToRichText('abc');
    const result = updateTextInRichText(ast, 2, 3, 'de');
    testResult(result, 'abde');
  });
  test('simple 6', () => {
    const ast = parseHTMLToRichText('abc');
    const result = updateTextInRichText(ast, 0, 1, 'de');
    testResult(result, 'debc');
  });
  test('simple in tag', () => {
    const ast = parseHTMLToRichText('<b>a</b>');
    const result = updateTextInRichText(ast, 0, 1, '');
    testResult(result, '');
  });
  test('simple in tag 2', () => {
    const ast = parseHTMLToRichText('<b>a</b>');
    const result = updateTextInRichText(ast, 0, 1, 'bc');
    testResult(result, 'bc');
  });
  test('nested Simple', () => {
    const ast = parseHTMLToRichText('<b>ab<i>cd</i></b>');
    const result = updateTextInRichText(ast, 2, 4, '');
    testResult(result, '<b>ab</b>');
  });
  test('nested 1', () => {
    const ast = parseHTMLToRichText('<b>ab<i>cd</i></b>');
    const result = updateTextInRichText(ast, 1, 3, '');
    testResult(result, '<b>a<i>d</i></b>');
  });

  test('multiple removal 1', () => {
    const ast = parseHTMLToRichText('<b>ab<i>cd</i><c>ef</c></b>');
    const result = updateTextInRichText(ast, 1, 5, '');
    testResult(result, '<b>a<c>f</c></b>');
  });
  test('multiple removal 2', () => {
    const ast = parseHTMLToRichText('<b>ab<i>cd</i><c>ef</c></b>');
    const result = updateTextInRichText(ast, 1, 5, 'g');
    testResult(result, '<b>ag<c>f</c></b>');
  });
  test('multiple removal 3', () => {
    const ast = parseHTMLToRichText('<b>ab<i>cd</i><c>ef</c>g</b>');
    const result = updateTextInRichText(ast, 3, 6, '');
    testResult(result, '<b>ab<i>c</i>g</b>');
  });
});
