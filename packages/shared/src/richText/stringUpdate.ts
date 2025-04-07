/**
 * This file defined string toolbox to add, remove and update text string an AST
 * All these functions take a Node and action to do.
 * Depending on the node type handle the action in current node or recursively apply the action
 */
import { isDefined } from '../isDefined';
import {
  simplifyRichTextAST,
  splitRichTextAST,
  splitRichTextASTInThree,
} from './internalToolbox';
import {
  createNodeFromText,
  generateHTMLFromRichText,
  getRawTextFromRichText,
  parseHTMLToRichText,
} from './stringToolbox';
import type { RichTextASTNode } from './richTextTypes';

/*
 * Add text in a node
 * in order to parse the tree only once, the inner function return:
 * [RichTextASTNode, number]
 * RichTextASTNode is the updated node
 * the number represent the number of already inserted characters,
 * after inserting we need to propagate the start/end value changes
 */
const addTextInner = (
  node: RichTextASTNode,
  text: string,
  position: number,
  insertedLength: number = 0,
): [RichTextASTNode, number] => {
  if (node.type === 'root' && node.start === 0 && node.end === 0) {
    // special case for root
    return [
      {
        type: 'root',
        start: 0,
        end: text.length,
        children: [createNodeFromText(text, 0)],
      },
      text.length,
    ];
  }
  // already inserted just propagate the changes
  if (insertedLength) {
    // already inserted !
    node.start = node.start + insertedLength;
    node.end = node.end + insertedLength;
    node.children = node.children
      ?.map(child => addTextInner(child, text, position, insertedLength)[0])
      .filter(isDefined);
    return [node, insertedLength];
  }
  // continue
  if (node.start > position || node.end < position) {
    return [node, insertedLength];
  }
  // let's add the text
  if (node.type === 'text') {
    const originalText = node.value;
    node.value =
      (originalText?.substring(0, position - node.start) || '') +
      text +
      (originalText?.substring(position - node.start, originalText.length) ||
        '');
    node.end = node.end + text.length;
    return [node, text.length];
  }
  // recurse
  let newInsertedLength = 0;
  node.children = node.children?.map(child => {
    const [newChildren, newInsertedLength2] = addTextInner(
      child,
      text,
      position,
      newInsertedLength,
    );
    newInsertedLength = newInsertedLength2;
    return newChildren;
  });
  node.end = node.end + newInsertedLength;
  return [node, newInsertedLength];
};

// public api, add text at position
export const addTextInRichText = (
  node: RichTextASTNode,
  text: string,
  position: number,
) => {
  if (text.length === 0) {
    return node;
  }
  if (position < 0) {
    position = 0;
  } else if (position > node.end) {
    position = node.end;
  }
  const result = addTextInner(node, text, position);
  return result[0];
};

/*
 * remove text in a node
 * In order to parse the tree only once, the inner function return:
 * [RichTextASTNode, number]
 * RichTextASTNode is the updated node
 * the number represent the number of already removed characters,
 * after inserting we need to propagate the start/end value changes
 */
const removeTextInner = (
  node: RichTextASTNode,
  position: number,
  length: number,
  removedLength: number = 0,
): [RichTextASTNode, number] => {
  if (removedLength) {
    // already removed !
    node.start -= removedLength;
    node.end -= removedLength;
    node.children = node.children
      ?.map(
        child =>
          removeTextInner(child, position, removedLength, removedLength)[0],
      )
      .filter(isDefined);
    return [node, removedLength];
  }

  if (node.start > position || node.end < position) {
    return [node, removedLength];
  }

  if (node.type === 'text' && node.value) {
    const originalText = node.value;
    node.value =
      (originalText?.substring(0, position - node.start) || '') +
      (originalText?.substring(
        position - node.start + length,
        originalText.length,
      ) || '');
    if (node.value.length === 0) {
      node.value = undefined;
    }
    node.end -= length;
    return [node, length];
  }

  // Check if logic cat be directly applied to a subnode
  if (node.children) {
    let subNodeFoundIndex = -1;
    for (let i = 0; i < node.children.length; i++) {
      const currentNode = node.children[i];
      if (
        currentNode.start <= position &&
        currentNode.end >= position + length
      ) {
        subNodeFoundIndex = i;
      }
    }
    if (subNodeFoundIndex >= 0) {
      for (
        let nextIdx = subNodeFoundIndex;
        nextIdx < node.children.length;
        nextIdx++
      ) {
        const res = removeTextInner(
          node.children[nextIdx],
          position,
          length,
          removedLength,
        );
        removedLength = res[1];
        node.children[nextIdx] = res[0];
      }
      node.end -= removedLength;
      return [node, removedLength];
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [first, _, third] = splitRichTextASTInThree(
    node,
    position,
    position + length,
  );
  // we can forget second part, it is removed
  const cleanThird = third
    ? removeTextInner(third, position, length, length)
    : undefined;

  return [
    {
      type: node.type,
      start: node.start,
      end: node.end - length,
      children: [first, cleanThird?.[0]].filter(isDefined),
    },
    length,
  ];
};

/**
 * API function which checks input and call removeTextInner
 */
export const removeTextInRichText = (
  node: RichTextASTNode,
  position: number,
  length: number,
): RichTextASTNode => {
  if (position < 0) {
    length += position;
    position = 0;
  }
  if (position + length > node.end) {
    length = node.end - position;
  }
  if (length <= 0) {
    return node;
  }

  const result = removeTextInner(node, position, length);
  const simplifiedResult = simplifyRichTextAST(result[0]);
  if (simplifiedResult) return simplifiedResult;
  throw new Error(
    'No result, but must have a result in removeText:' +
      JSON.stringify(node) +
      ' position ' +
      position +
      ' length ' +
      length,
  );
};

/**
 * API function which replace a string by another string
 * It simply remove old string and add the new one
 */
export function updateTextInRichText(
  root: RichTextASTNode,
  start: number,
  end: number,
  value: string,
): RichTextASTNode {
  let newAst: RichTextASTNode | undefined = removeTextInRichText(
    root,
    start,
    end - start,
  );
  if (value.length) {
    newAst = addTextInRichText(newAst, value, start);
  }
  newAst = simplifyRichTextAST(newAst);
  if (newAst) {
    return newAst;
  }
  throw new Error('updateText: no result error');
}

/**
 * API function force text in an AST.
 * Ensure strings length are equals before calling this function
 */
const forceUpdateTextInRichTextInner = (
  node: RichTextASTNode,
  text: string,
): RichTextASTNode => {
  if (node.type === 'text') {
    node.value = text.slice(node.start, node.end);
  }
  if (node.children) {
    node.children = node.children.map(n => {
      return forceUpdateTextInRichTextInner(n, text);
    });
  }
  return node;
};

export const forceUpdateTextInRichText = (
  node: RichTextASTNode,
  text: string,
): RichTextASTNode => {
  if (node.start === 0 && node.end === text.length) {
    return forceUpdateTextInRichTextInner(node, text);
  } else {
    console.warn('impossible to forceUpdateTextInRichText length do not match');
    return node;
  }
};

/**
 * Helper function to help splitting text into multiple columns
 *
 * @param text input text to split
 * @param nbColumn number of column to generate
 * @returns an array of formatted sting to display
 */
export const splitRichTextIntoColumns = (
  text: string,
  nbColumn: number,
): string[] => {
  if (nbColumn === 1) {
    return [text];
  }
  const ast = parseHTMLToRichText(text);

  // need to remove html tags to compute word count
  const cleanedText = getRawTextFromRichText(ast);
  const words = cleanedText.split(' ');
  const wordsPerColumn = Math.ceil(words.length / nbColumn);
  const columns = Array.from({ length: nbColumn }, () => '');

  // split the text without html tags
  for (let i = 0; i < nbColumn; i++) {
    columns[i] = words
      .slice(i * wordsPerColumn, (i + 1) * wordsPerColumn)
      .join(' ');
  }

  // regenerate splitted text with the tags
  let astToSplit: RichTextASTNode | undefined = ast;
  const richColumns = columns.map(text => {
    if (!astToSplit) return '';
    // split text into 2 parts
    const splittedAST = splitRichTextAST(
      astToSplit,
      astToSplit.start + text.length,
    );
    astToSplit = splittedAST.second;

    // trim second text
    const secondText = getRawTextFromRichText(astToSplit);
    let spaceStart = 0;
    while (secondText[spaceStart] === ' ') {
      spaceStart = spaceStart + 1;
    }
    if (astToSplit) {
      removeTextInRichText(astToSplit, astToSplit.start, spaceStart);
    }
    // return generated text
    const result = generateHTMLFromRichText(splittedAST.first);
    return result;
  });
  return richColumns;
};
