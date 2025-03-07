import { deleteTagFromRichTextAST } from '../internalToolbox';
import { parseHTMLToRichText } from '../stringToolbox';
import { checkAST, checkResultASTAsString, splitAST } from './toolbox';
import type { RichTextASTNode } from '../richTextTypes';

describe('RichText: Internal functions', () => {
  describe('deleteTagFromNode', () => {
    test('deleteTagFromNode simple', () => {
      let result: RichTextASTNode | undefined =
        parseHTMLToRichText('a<i>a</i>a');
      result = deleteTagFromRichTextAST(result, 'i');
      checkResultASTAsString(result, 'aaa');
    });
    test('deleteTagFromNode nested 1', () => {
      let result: RichTextASTNode | undefined =
        parseHTMLToRichText('a<i><b>a</b></i>a');
      result = deleteTagFromRichTextAST(result, 'i');
      checkResultASTAsString(result, 'a<b>a</b>a');
    });
    test('deleteTagFromNode nested 2', () => {
      let result: RichTextASTNode | undefined =
        parseHTMLToRichText('a<b><i>a</i></b>a');
      result = deleteTagFromRichTextAST(result, 'i');
      checkResultASTAsString(result, 'a<b>a</b>a');
    });
    test('deleteTagFromNode invalid tag', () => {
      let result: RichTextASTNode | undefined =
        parseHTMLToRichText('a<b><i>a</i></b>a');
      result = deleteTagFromRichTextAST(result, 'GGG');
      checkResultASTAsString(result, 'a<b><i>a</i></b>a');
    });
  });
  describe('simplifyAST', () => {
    test('no change 1', () => {
      const html = '<i>a</i>';
      const result = checkAST(html);
      expect(result).toBe(html);
    });
    test('no change 2', () => {
      const html = '<i><b>a</b></i>';
      const result = checkAST(html);
      expect(result).toBe(html);
    });
    test('simplify double tags', () => {
      const html = '<i>a</i><i>a</i>';
      const result = checkAST(html);
      expect(result).toBe('<i>aa</i>');
    });
    test('simplify side by side tags nested', () => {
      const html = '<b><i>a</i><i>a</i></b>';
      const result = checkAST(html);
      expect(result).toBe('<b><i>aa</i></b>');
    });
  });
  describe('splitAST', () => {
    test('simple text', () => {
      const html = 'abcd';
      const result = splitAST(html, 2);
      expect(result[0]).toBe('ab');
      expect(result[1]).toBe('cd');
    });
    test('simple tag', () => {
      const html = '<i>abcd</i>';
      const result = splitAST(html, 2);
      expect(result[0]).toBe('<i>ab</i>');
      expect(result[1]).toBe('<i>cd</i>');
    });
    test('mixed tag 1', () => {
      const html = '<i><b>ab</b>cd</i>';
      const result = splitAST(html, 2);
      expect(result[0]).toBe('<i><b>ab</b></i>');
      expect(result[1]).toBe('<i>cd</i>');
    });
    test('mixed tag 2', () => {
      const html = '<i><b>a</b>bcd</i>';
      const result = splitAST(html, 2);
      expect(result[0]).toBe('<i><b>a</b>b</i>');
      expect(result[1]).toBe('<i>cd</i>');
    });
    test('nested tag', () => {
      const html = '<i><b>abcd</b></i>';
      const result = splitAST(html, 2);
      expect(result[0]).toBe('<i><b>ab</b></i>');
      expect(result[1]).toBe('<i><b>cd</b></i>');
    });
    test('nested tag', () => {
      const html = '<i><b>ab</b></i>cd';
      const result = splitAST(html, 2);
      expect(result[0]).toBe('<i><b>ab</b></i>');
      expect(result[1]).toBe('cd');
    });
  });
});
