import { isDefined } from '../isDefined';
import { richTextASTTagsArray } from './richTextTypes';
import { isRichTextTag } from './stringToolbox';
import type { RichTextASTTags, RichTextASTNode } from './richTextTypes';

type SplitResult = { first?: RichTextASTNode; second?: RichTextASTNode };
type SplitArrayResult = [RichTextASTNode[], RichTextASTNode[]];

/**
 * @param node a node to process
 * @param tag a tag to remove
 * @returns the input node with all tags removed
 */
export function deleteTagFromRichTextAST(
  node: RichTextASTNode | undefined,
  tag: string,
): RichTextASTNode | undefined {
  if (!node) return undefined;
  const newChildren = node.children?.map(child => {
    if (child.type === tag) {
      child.type = 'fragment';
    }
    return deleteTagFromRichTextAST(child, tag);
  });
  return simplifyRichTextAST({
    ...node,
    children: newChildren?.filter(isDefined),
  });
}

/**
 * @param nodes Array of children to split
 * @param index Split position
 * @returns an array of the 2 children slitted at index position
 */
export const splitRichTextASTChildren = (
  nodes: RichTextASTNode[],
  index: number,
): [RichTextASTNode[], RichTextASTNode[]] => {
  const result: SplitArrayResult = [[], []];
  nodes.forEach((node: RichTextASTNode) => {
    if (node.start < index && node.end < index) {
      result[0].push(node);
    } else if (node.start > index && node.end > index) {
      result[1].push(node);
    } else {
      const splittedAST = splitRichTextAST(node, index);
      if (splittedAST.first) result[0].push(splittedAST.first);
      if (splittedAST.second) result[1].push(splittedAST.second);
    }
  });
  return result;
};

/**
 * @param root The node to split
 * @param start first point to split
 * @param end second point to split
 * @returns an array of three AST
 * 0: AST before start
 * 1: AST between start and end
 * 2: AST after end
 */
export const splitRichTextASTInThree = (
  root: RichTextASTNode,
  start: number,
  end: number,
) => {
  const firstSplitAST = splitRichTextAST(root, start);
  const first = firstSplitAST.first;
  let second;
  let third;
  if (firstSplitAST.second) {
    const secondSplitAST = splitRichTextAST(firstSplitAST.second, end);
    second = secondSplitAST.first;
    third = secondSplitAST.second;
  }
  return [
    simplifyRichTextAST(first),
    simplifyRichTextAST(second),
    simplifyRichTextAST(third),
  ];
};

/**
 * @param node the node to split
 * @param index index position of where to split
 * @returns an array of 2 AST
 */
export const splitRichTextAST = (
  node: RichTextASTNode,
  index: number,
): SplitResult => {
  if (index < node.start || index > node.end) {
    throw new Error(
      'splitAST: should not be here:' +
        JSON.stringify(node) +
        ' index: ' +
        index,
    );
  }
  if (node.type === 'text') {
    return {
      first:
        node.start !== index
          ? {
              type: 'text',
              start: node.start,
              end: index,
              value: node.value?.substring(0, index - node.start),
            }
          : undefined,
      second:
        index !== node.end
          ? {
              type: 'text',
              start: index,
              end: node.end,
              value: node.value?.substring(
                index - node.start,
                node.value.length,
              ),
            }
          : undefined,
    };
  } else if (
    (isRichTextTag(node.type) ||
      node.type === 'fragment' ||
      node.type === 'root') &&
    node.children
  ) {
    const splitted = splitRichTextASTChildren(node.children, index);
    return {
      first: splitted[0].length
        ? {
            type: node.type,
            start: node.start,
            end: index,
            children: splitted[0],
          }
        : undefined,
      second: splitted[1].length
        ? {
            type: node.type,
            start: index,
            end: node.end,
            children: splitted[1],
          }
        : undefined,
    };
  }
  throw new Error('splitAST: unhandled case' + node);
};

/**
 * @param root node to clean up
 * @returns a new node with all unnecessary tag removed (duplicated text or HTML tag, fragment, ...)
 */
export const simplifyRichTextAST = (
  root: RichTextASTNode | undefined,
): RichTextASTNode | undefined => {
  const traverse = (node: RichTextASTNode): RichTextASTNode => {
    if (node.type === 'text') {
      // No child in text node
      return node;
    }

    let newChildren: RichTextASTNode[] = [];

    // simplify children first step remove fragment and loop in sub node
    if (node.children) {
      let nodeIndex = 0;
      for (nodeIndex = 0; nodeIndex < node.children?.length || 0; nodeIndex++) {
        const currentNode = node.children[nodeIndex];
        if (currentNode.children && node.type === currentNode.type) {
          newChildren = newChildren.concat(
            currentNode.children.map(child => traverse(child)),
          );
        } else if (currentNode.type === 'fragment' && currentNode.children) {
          newChildren = newChildren.concat(
            currentNode.children.map(child => traverse(child)),
          );
        } else if (currentNode.type === 'text' || currentNode.type === 'root') {
          newChildren = newChildren.concat([traverse(currentNode)]);
        } else if (currentNode.children) {
          newChildren.push(traverse(currentNode));
        } else {
          newChildren = newChildren.concat([traverse(currentNode)]);
        }
      }
    }

    // Step 2: simplify splitted nodes:
    // merge side by side texts
    // merge side by side nodes with the same type (b, c, i)
    const newChildren2: RichTextASTNode[] = [];
    for (let nodeIndex = 0; nodeIndex < newChildren.length; nodeIndex++) {
      const currentNode = newChildren[nodeIndex];
      if (
        isRichTextTag(currentNode.type) &&
        currentNode.children?.length === 0
      ) {
        continue;
      }
      if (
        currentNode.type === 'text' &&
        (!currentNode.value || currentNode.value?.length === 0)
      ) {
        continue;
      }

      let nextNode = newChildren[nodeIndex + 1];

      while (currentNode && nextNode && nextNode.type === currentNode.type) {
        if (
          richTextASTTagsArray.includes(nextNode.type as RichTextASTTags) &&
          nextNode.children?.length
        ) {
          currentNode.children = currentNode.children?.concat(
            nextNode.children,
          );
          currentNode.end = nextNode.end;
        } else if (nextNode.type === 'text' && nextNode.value?.length) {
          currentNode.value = currentNode.value + nextNode.value;
          currentNode.end = nextNode.end;
        }
        nodeIndex = nodeIndex + 1;
        nextNode = newChildren[nodeIndex + 1];
      }
      newChildren2.push(currentNode);
    }
    return { ...node, children: newChildren2 };
  };
  if (!root) {
    return undefined;
  }
  return traverse(root);
};

/**
 *
 * @param node input node
 * @returns true in case of correct content. This function check all start & end values coherence
 */
const checkASTCoherenceInner = (node: RichTextASTNode): [boolean, number] => {
  if (node.type === 'text') {
    const textLength = node.value?.length || 0;
    const valid = node.end - node.start === textLength;
    return [valid, textLength];
  } else if (node?.children) {
    let fullLen = 0;
    let validChildren = true;
    node.children?.forEach(child => {
      const [valid, len] = checkASTCoherenceInner(child);
      fullLen += len;
      validChildren = validChildren && valid;
    });
    const subNodeLen =
      node.children && node.children.length
        ? node.children[node.children.length - 1].end - node.children[0].start
        : 0;
    const nodeLen = node.end - node.start;
    return [
      validChildren && fullLen === nodeLen && fullLen === subNodeLen,
      nodeLen,
    ];
  }
  throw new Error('unhandled case');
};

/**
 *
 * @param node input node
 * @returns true in case of correct content. This function check all start & end values coherence
 */

export const checkRichTextASTCoherence = (node: RichTextASTNode): boolean => {
  return checkASTCoherenceInner(node)[0];
};
