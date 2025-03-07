import { parseHTMLToRichText } from '../stringToolbox';
import {
  addTextInRichText,
  forceUpdateTextInRichText,
  removeTextInRichText,
} from '../stringUpdate';
import { checkResultASTAsString } from './toolbox';

describe('RichText: text manipulation', () => {
  describe('addText', () => {
    test('empty text', () => {
      let result = parseHTMLToRichText('');
      result = addTextInRichText(result, 'a', 0);
      checkResultASTAsString(result, 'a');
    });
    test('simple text 1', () => {
      let result = parseHTMLToRichText('b');
      result = addTextInRichText(result, 'a', 0);
      checkResultASTAsString(result, 'ab');
    });
    test('simple text 2', () => {
      let result = parseHTMLToRichText('a');
      result = addTextInRichText(result, 'b', 1);
      checkResultASTAsString(result, 'ab');
    });
    test('simple text 3', () => {
      let result = parseHTMLToRichText('<b>a</b>b');
      result = addTextInRichText(result, 'c', 2);
      checkResultASTAsString(result, '<b>a</b>bc');
    });
    test('text in tag', () => {
      let result = parseHTMLToRichText('<i>a</i>');
      result = addTextInRichText(result, 'b', 1);
      checkResultASTAsString(result, '<i>ab</i>');
    });
    test('text in tag 2', () => {
      let result = parseHTMLToRichText('<i><c>c</c>a</i>');
      result = addTextInRichText(result, 'b', 1);
      checkResultASTAsString(result, '<i><c>cb</c>a</i>');
    });
    test('text in tag 3', () => {
      let result = parseHTMLToRichText('<i><c>c</c>a</i>');
      result = addTextInRichText(result, 'b', 0);
      checkResultASTAsString(result, '<i><c>bc</c>a</i>');
    });
    test('text in tag 4', () => {
      let result = parseHTMLToRichText('<i><c>c</c>a</i>');
      result = addTextInRichText(result, 'b', 2);
      checkResultASTAsString(result, '<i><c>c</c>ab</i>');
    });
    test('text in tag 5', () => {
      let result = parseHTMLToRichText('<i><c>cd</c>a</i>');
      result = addTextInRichText(result, 'b', 1);
      checkResultASTAsString(result, '<i><c>cbd</c>a</i>');
    });
    test('error: add text after the end', () => {
      let result = parseHTMLToRichText('<i><c>cd</c>a</i>');
      result = addTextInRichText(result, 'b', 10);
      checkResultASTAsString(result, '<i><c>cd</c>ab</i>');
    });
    test('error: add text before the start', () => {
      let result = parseHTMLToRichText('<i><c>cd</c>a</i>');
      result = addTextInRichText(result, 'b', -1);
      checkResultASTAsString(result, '<i><c>bcd</c>a</i>');
    });
  });
  describe('removeText', () => {
    test('remove all text 1', () => {
      let result = parseHTMLToRichText('a');
      result = removeTextInRichText(result, 0, 1);
      checkResultASTAsString(result, '');
    });
    test('remove all text 2', () => {
      let result = parseHTMLToRichText('ab');
      result = removeTextInRichText(result, 0, 2);
      checkResultASTAsString(result, '');
    });
    test('remove last character', () => {
      let result = parseHTMLToRichText('ab bc');
      result = removeTextInRichText(result, 3, 2);
      checkResultASTAsString(result, 'ab ');
    });
    test('remove all text in tag 1', () => {
      let result = parseHTMLToRichText('<i>ab</i>');
      result = removeTextInRichText(result, 0, 2);
      checkResultASTAsString(result, '');
    });
    test('remove all text in tag 2', () => {
      let result = parseHTMLToRichText('<b><i>ab</i></b>');
      result = removeTextInRichText(result, 0, 2);
      checkResultASTAsString(result, '');
    });
    test('remove sub text in tag 1', () => {
      let result = parseHTMLToRichText('<b>abc</b>');
      result = removeTextInRichText(result, 1, 1);
      checkResultASTAsString(result, '<b>ac</b>');
    });
    test('remove sub text in tag 2', () => {
      let result = parseHTMLToRichText('<b>a<c>b</c>c</b>');
      result = removeTextInRichText(result, 1, 1);
      checkResultASTAsString(result, '<b>ac</b>');
    });
    test('remove sub text in nested tag', () => {
      let result = parseHTMLToRichText('<b>a<c>b</c>c</b>');
      result = removeTextInRichText(result, 1, 2);
      checkResultASTAsString(result, '<b>a</b>');
    });
    test('remove sub text in nested tag 2', () => {
      let result = parseHTMLToRichText('<b>a<c>b</c>c</b>');
      result = removeTextInRichText(result, 0, 3);
      checkResultASTAsString(result, '');
    });
    test('remove sub text in nested tag 3', () => {
      let result = parseHTMLToRichText('<b>ab<c>c</c>de</b>');
      result = removeTextInRichText(result, 1, 3);
      checkResultASTAsString(result, '<b>ae</b>');
    });
    test('Simple error: out of range position 1', () => {
      let result = parseHTMLToRichText('a');
      result = removeTextInRichText(result, 1, 1);
      checkResultASTAsString(result, 'a');
    });
    test('Simple error: out of range position 2', () => {
      let result = parseHTMLToRichText('a');
      result = removeTextInRichText(result, -1, 2);
      checkResultASTAsString(result, '');
    });
    test('Simple error: out of range position 3', () => {
      let result = parseHTMLToRichText('a');
      result = removeTextInRichText(result, -1, 1);
      checkResultASTAsString(result, 'a');
    });
    test('Simple error: out of range length', () => {
      let result = parseHTMLToRichText('a');
      result = removeTextInRichText(result, 0, 2);
      checkResultASTAsString(result, '');
    });
  });
  describe('forceUpdateTextInRichText', () => {
    test('forceUpdateTextInRichText basic', () => {
      let result = parseHTMLToRichText('a');
      result = forceUpdateTextInRichText(result, 'b');
      checkResultASTAsString(result, 'b');
    });
    test('forceUpdateTextInRichText with tag', () => {
      let result = parseHTMLToRichText('a<b>a</b>a');
      result = forceUpdateTextInRichText(result, 'bbb');
      checkResultASTAsString(result, 'b<b>b</b>b');
    });
    test('forceUpdateTextInRichText invalid', () => {
      let result = parseHTMLToRichText('a<b>a</b>a');
      result = forceUpdateTextInRichText(result, 'bb');
      checkResultASTAsString(result, 'a<b>a</b>a');
    });
  });
});
