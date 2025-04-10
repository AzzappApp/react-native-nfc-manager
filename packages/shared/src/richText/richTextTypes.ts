/**
 * This file defines AST (Abstract Syntax Tree) Node tree type
 */

/**
 * an array of string representing supported tags
 */
export const richTextASTTagsArray = [
  'b', // bold
  'c', // underline
  'i', // italic
  '+3', // increase text size of 3 px
  '-3', // decrease text size of 3 px
  '+6', // increase text size of 6 px
  '-6', // decrease text size of 6 px
] as const;

/**
 * text tags corresponding to text style, bold, underline, italic
 */
export type RichTextASTTags = (typeof richTextASTTagsArray)[number];

/**
 * Incompatible tags management.
 * It shall not be possible put tags increase and decrease nested
 * When this case happens the tree will be split to ensure they are not nested
 */

export const richTextIncompatibleTags: Partial<
  Record<RichTextASTTags, RichTextASTTags[]>
> = {
  '+3': ['-3', '-6', '+6'], // Increase text size is incompatible with decrease text size
  '-3': ['+3', '-6', '+6'], // Decrease text size is incompatible with increase text size
  '+6': ['-3', '+3', '-6'], // Increase text size is incompatible with decrease text size
  '-6': ['+3', '+3', '+6'], // Decrease text size is incompatible with increase text size
};

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
