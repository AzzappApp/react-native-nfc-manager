/**
 * This file defines AST (Abstract Syntax Tree) Node tree type
 */

/**
 * an array of string representing supported tags
 */
export const richTextASTTagsArray = ['b', 'c', 'i'] as const;

/**
 * text tags corresponding to text style, bold, underline, italic
 */
export type RichTextASTTags = (typeof richTextASTTagsArray)[number];

/**
 * All possible types:
 * RichTextASTTags: all the style types
 * fragment is a virtual node which should be clean latter
 * root is similar to a fragment but it is always the root
 * text a text node
 */
export type RichTextASTNodeType =
  | RichTextASTTags
  | 'fragment'
  | 'root'
  | 'text';

/**
 * The AST node definition
 * type: see: RichTextASTNodeType
 * start: start position of a node
 * end: end position of a node. end > start
 * children: child node (not available with 'text' type)
 * value: text value length of text must be end - start (available only with 'text' type)
 */
export type RichTextASTNode = {
  type: RichTextASTNodeType;
  start: number;
  end: number;
  children?: RichTextASTNode[];
  value?: string;
};
