import { applyFormattingOnRichText } from '../formatting';
import {
  checkRichTextASTCoherence,
  simplifyRichTextAST,
  splitRichTextASTChildren,
} from '../internalToolbox';
import {
  generateHTMLFromRichText,
  parseHTMLToRichText,
} from '../stringToolbox';
import type { RichTextASTTags } from 'richText/richTextTypes';

const enableDebugLog = false;

const debugLog = (...props: any[]) => {
  if (enableDebugLog) console.log(...props);
};

export const checkAST = (text: string): string => {
  const ast = parseHTMLToRichText(text);
  debugLog('checkAST:ast', JSON.stringify(ast));
  const simpleAst = simplifyRichTextAST(ast);
  expect(checkRichTextASTCoherence(simpleAst!)).toEqual(true);
  debugLog('checkAST:simpleAst', JSON.stringify(simpleAst));
  return generateHTMLFromRichText(simpleAst);
};

export const splitAST = (text: string, index: number) => {
  const ast = parseHTMLToRichText(text);
  debugLog('splitAST:ast', JSON.stringify(ast));
  if (ast.children) {
    const simpleAst = splitRichTextASTChildren(ast.children, index);
    const firstAST = simplifyRichTextAST({
      type: 'root',
      start: simpleAst[0][0].start ?? 0,
      end: simpleAst[0][simpleAst[0].length - 1].end,
      children: simpleAst[0],
    });
    expect(checkRichTextASTCoherence(firstAST!)).toEqual(true);
    const secondAST = simplifyRichTextAST({
      type: 'root',
      start: simpleAst[1][0].start ?? 0,
      end: simpleAst[1][simpleAst[1].length - 1].end,
      children: simpleAst[1],
    });
    expect(checkRichTextASTCoherence(secondAST!)).toEqual(true);

    const result = [
      generateHTMLFromRichText(firstAST),
      generateHTMLFromRichText(secondAST),
    ];
    debugLog('splitAST:simpleAst', result);
    return result;
  }
  return ['', ''];
};

export const insertTag = (
  text: string,
  start: number,
  end: number,
  tag: string,
) => {
  debugLog('insertTag: text', text);
  let ast = parseHTMLToRichText(text);
  expect(checkRichTextASTCoherence(ast)).toEqual(true);
  debugLog('insertTag: initial ast', generateHTMLFromRichText(ast));
  ast = applyFormattingOnRichText(ast, start, end, tag as RichTextASTTags);
  debugLog('ast', JSON.stringify(ast));
  expect(checkRichTextASTCoherence(ast)).toEqual(true);
  debugLog('insertTag: transformed ast', generateHTMLFromRichText(ast));
  const simpleAst = simplifyRichTextAST(ast);
  expect(checkRichTextASTCoherence(simpleAst!)).toEqual(true);
  debugLog('insertTag: simpleAst ast', generateHTMLFromRichText(simpleAst));
  return generateHTMLFromRichText(simpleAst);
};

export const checkResultASTAsString = (result: any, expectation: string) => {
  expect(checkRichTextASTCoherence(result)).toEqual(true);
  expect(generateHTMLFromRichText(result)).toBe(expectation);
};
