import type {
  RichTextASTNode,
  RichTextASTNodeType,
} from '@azzapp/shared/richText/richTextTypes';

/**
 * Selection range
 */
export type SelectionType = {
  start: number;
  end: number;
};

/**
 * Selection range
 */
export type TextAndSelection = {
  ast: RichTextASTNode;
  selection?: SelectionType;
  selectedTag: RichTextASTNodeType[];
};
