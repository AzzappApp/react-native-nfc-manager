import { isDefined } from '../isDefined';
import {
  richTextASTTagsArray,
  type RichTextASTNode,
  type RichTextASTNodeType,
  type RichTextASTTags,
} from './richTextTypes';

/**
 * @param c a character
 * @returns true if c is a valid html tag
 */
export const isRichTextTag = (c: string) =>
  richTextASTTagsArray.includes(c as RichTextASTTags);

/**
 * Statically generate regexp to parse correctly the text
 */
// Escape special characters in +3 and -3
const escapedTags = richTextASTTagsArray.map(tag =>
  tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
);

const richTextTagPattern = new RegExp(`^<(${escapedTags.join('|')})>`);

/**
 * @param input string to parse
 * @param index current parsing position
 * @param initialPosition position in initial string
 * @returns an array containing, the parsed node and number of user character parsed
 */
const parseHTMLInner = (
  input: string | undefined = '',
  index: number = 0,
  initialPosition: number = 0,
): [RichTextASTNode[], number] => {
  const currentNode: RichTextASTNode[] = [];
  let textBuffer = '';
  let parseLength = 0;

  while (index < input.length) {
    if (input[index] === '<') {
      // Detect opening tag
      const startTagMatch = input.slice(index).match(richTextTagPattern);
      if (startTagMatch) {
        // Detect closing tag
        const endTagMatch = input
          .slice(index)
          .match(
            new RegExp(
              `</${startTagMatch[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}>`,
            ),
          );

        if (endTagMatch !== null && endTagMatch.index !== undefined) {
          // Flush text buffer before processing the tag
          if (textBuffer) {
            currentNode.push(
              createNodeFromText(textBuffer, initialPosition + parseLength),
            );
            parseLength += textBuffer.length;
            textBuffer = '';
          }

          const subHtml = input.substring(
            index + startTagMatch[0].length,
            index + endTagMatch.index,
          );
          const [node, len] = parseHTMLInner(
            subHtml,
            0,
            initialPosition + parseLength,
          );

          const newNode: RichTextASTNode = {
            type: startTagMatch[1] as RichTextASTTags,
            start: initialPosition + parseLength,
            end: initialPosition + parseLength + len,
            children: Array.isArray(node) ? node : [node],
          };
          parseLength += len;
          currentNode.push(newNode);
          index =
            index +
            subHtml.length +
            endTagMatch[0].length +
            startTagMatch[0].length;
          textBuffer = '';
          continue;
        }
      }
    }

    // Accumulate text content
    textBuffer += input[index];
    index++;
  }

  // Flush remaining text buffer
  if (textBuffer) {
    currentNode.push(
      createNodeFromText(textBuffer, initialPosition + parseLength),
    );
    parseLength += textBuffer.length;
  }
  return [currentNode, parseLength];
};

/**
 * @param input string to parse
 * @returns the created node
 */
export const parseHTMLToRichText = (
  input: string | undefined,
): RichTextASTNode => {
  const parsedHTML = parseHTMLInner(input, 0);
  const root: RichTextASTNode = {
    type: 'root',
    children: parsedHTML[0],
    start: 0,
    end: parsedHTML[1],
  };
  return root;
};

/**
 * @param input node to handle
 * @returns the html string corresponding to input node
 */
export const generateHTMLFromRichText = (node?: RichTextASTNode): string => {
  if (!node) return '';
  if (node.type === 'text') {
    return node.value ?? '';
  }
  if (!node.children) {
    return '';
  }

  const innerHTML = node.children.map(generateHTMLFromRichText).join('');
  return node.type === 'root' || node.type === 'fragment'
    ? innerHTML
    : `<${node.type}>${innerHTML}</${node.type}>`;
};

/**
 * Return string raw string value in the AST, without formatting
 */
export const getRawTextFromRichText = (node?: RichTextASTNode): string => {
  if (!node) return '';
  if (node.type === 'text') {
    return node.value ?? '';
  }
  if (!node.children) {
    return '';
  }
  return node.children.map(getRawTextFromRichText).join('');
};

/**
 * Return a new node with children
 */
export const createNodeFromChildren = (
  type: RichTextASTNodeType,
  children: Array<RichTextASTNode | undefined>,
): RichTextASTNode => {
  const filteredChildren = children.filter(isDefined);
  return {
    type,
    children: filteredChildren,
    start: filteredChildren[0].start,
    end: filteredChildren[filteredChildren.length - 1].end,
  };
};

/**
 * Return a new text node at position
 */
export const createNodeFromText = (
  value: string,
  startPosition: number,
): RichTextASTNode => {
  if (!value) {
    return { type: 'fragment', start: startPosition, end: startPosition };
  }
  return {
    type: 'text',
    value,
    start: startPosition,
    end: startPosition + value.length,
  };
};
