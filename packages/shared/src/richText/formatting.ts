import { isDefined } from '../isDefined';
import {
  deleteTagFromRichTextAST,
  simplifyRichTextAST,
  splitRichTextAST,
  splitRichTextASTInThree,
} from './internalToolbox';
import { createNodeFromChildren, isRichTextTag } from './stringToolbox';
import type {
  RichTextASTNode,
  RichTextASTNodeType,
  RichTextASTTags,
} from './richTextTypes';

/**
 * helper function which returns the list of tag from the selection tag returned are fully in the selection
 *
 * @param node current node
 * @param start start selection to check
 * @param end end selection to check
 * @returns list of tag fully included in selection
 */
export const getTagsInSelectionFromRichText = (
  node: RichTextASTNode,
  start: number,
  end: number,
): RichTextASTNodeType[] => {
  if (node.children && node.start <= start && node.end >= end) {
    const result = node.children?.reduce(
      (acc: RichTextASTNodeType[], n) => {
        return [...acc, ...getTagsInSelectionFromRichText(n, start, end)];
      },
      [isRichTextTag(node.type) ? node.type : undefined].filter(isDefined),
    );
    return result;
  }
  return [];
};

/**
 * add a the formatting to the ast
 * This function will decide how to apply the change
 * If the selection where you apply the style doesn't contain a coherent formatting,
 * the formatting will be apply on the whole text
 * If the selection is already formatted in the style to apply, it will be removed
 */
const applyFormattingOnRichTextInner = (
  root: RichTextASTNode,
  start: number,
  end: number,
  tag: RichTextASTTags,
): RichTextASTNode => {
  // Invalid request, not in this node
  if (start === end || root.start > start || root.end < end) return root;

  // split the text and create a new subnode !
  if (root.type === 'text') {
    const [firstAST, secondAST, thirdAST] = splitRichTextASTInThree(
      root,
      start,
      end,
    );
    return createNodeFromChildren('fragment', [
      deleteTagFromRichTextAST(firstAST, tag),
      createNodeFromChildren(tag, [deleteTagFromRichTextAST(secondAST, tag)]),
      deleteTagFromRichTextAST(thirdAST, tag),
    ]);
  }

  let firstItemIdx = -1;
  let lastItemIdx = -1;

  // Check if logic cat be directly applied to a subnode
  // here children is always true
  if (root.children) {
    // Search in subnode: subNodeFoundIndex the exact subnode which will handle the change
    // or firstItemIdx and lastItemIdx which are the first and the last indexes which will handle the change
    let subNodeFoundIndex = -1;
    for (let i = 0; i < root.children.length; i++) {
      const currentNode = root.children[i];
      if (currentNode.start <= start && currentNode.end >= end) {
        subNodeFoundIndex = i;
      }
      if (currentNode.start <= start && currentNode.end >= start) {
        firstItemIdx = i;
      }
      if (currentNode.start < end && currentNode.end >= end) {
        lastItemIdx = i;
      }
    }
    if (subNodeFoundIndex >= 0) {
      // exact match
      if (root.type === tag) {
        // it the save tag => split the tree to remove formatting only in the good part
        const [first, second, third] = splitRichTextASTInThree(
          root,
          start,
          end,
        );

        const newChildren = [first, ...(second?.children || []), third]?.map(
          child => deleteTagFromRichTextAST(child, tag),
        );
        return createNodeFromChildren('fragment', newChildren);
      } else {
        // all processing is done in subnode
        const newChildren = [...root.children];
        newChildren[subNodeFoundIndex] = applyFormattingOnRichTextInner(
          newChildren[subNodeFoundIndex],
          start,
          end,
          tag,
        );
        return createNodeFromChildren(root.type, newChildren);
      }
    } else if (firstItemIdx >= 0 && lastItemIdx >= 0) {
      // Start and end found we need to add the formatting
      if (root.type === tag) {
        // split in three to ensure sub formatting are well regenerated
        const [first, second, third] = splitRichTextASTInThree(
          root,
          start,
          end,
        );
        const newChildren = [first, ...(second?.children || []), third]?.map(
          child => deleteTagFromRichTextAST(child, tag),
        );
        return createNodeFromChildren('fragment', newChildren);
      } else {
        // split the tree to ensure sub formatting are well regenerated
        // the 7 parts:
        // 1 - the children untouched at the start
        // 2 - the first segment of the cut child at start position
        // 3 - the second segment of the cut child at start position
        // 4 - The list of children between start child and end child
        // 5 - the first segment of the cut child at end position
        // 6 - the second segment of the cut child at end position
        // 7 - he children untouched at the end
        /// Formatting change change only between 3 and 5

        const startSplit = splitRichTextAST(root.children[firstItemIdx], start);
        const endSplit = splitRichTextAST(root.children[lastItemIdx], end);

        const theChildren = [
          deleteTagFromRichTextAST(startSplit.second, tag),
          ...root.children
            .slice(firstItemIdx + 1, lastItemIdx)
            .map(child => deleteTagFromRichTextAST(child, tag))
            .filter(isDefined),
          deleteTagFromRichTextAST(endSplit.first, tag),
        ];

        const newChildren = [
          ...root.children
            .slice(0, firstItemIdx)
            .map(child => deleteTagFromRichTextAST(child, tag)),
          deleteTagFromRichTextAST(startSplit.first, tag),
          createNodeFromChildren(tag, theChildren),
          deleteTagFromRichTextAST(endSplit.second, tag),
          ...root.children
            .slice(lastItemIdx + 1, root.children.length)
            .map(child => deleteTagFromRichTextAST(child, tag)),
        ];

        const result = createNodeFromChildren(root.type, newChildren);
        return result;
      }
    }
  }
  throw new Error('RichTextApplyFormatting: we should not be here !');
};

/**
 * public API function, checks input and applyFormattingOnRichTextInner
 */
export const applyFormattingOnRichText = (
  root: RichTextASTNode,
  start: number,
  end: number,
  tag: RichTextASTTags,
): RichTextASTNode => {
  if (start <= 0) {
    start = 0;
  }
  if (end >= root.end) {
    end = root.end;
  }
  if (start >= end) return root;
  const result = simplifyRichTextAST(
    applyFormattingOnRichTextInner(root, start, end, tag),
  );
  if (result) {
    return result;
  }
  throw new Error();
};
