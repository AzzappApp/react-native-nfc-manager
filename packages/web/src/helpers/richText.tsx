import React from 'react';
import {
  parseHTMLToRichText,
  isRichTextTag,
} from '@azzapp/shared/richText/stringToolbox';
import { webCardTextFontsVariantsMap } from './fonts';
import type {
  RichTextASTNode,
  RichTextASTTags,
} from '@azzapp/shared/richText/richTextTypes';

export const generateComponentFromRichTextAst = (
  node: RichTextASTNode,
  fontFamily: string,
  style: React.CSSProperties = {},
  stackedTags: RichTextASTTags[] = [],
): JSX.Element => {
  if (node.type === 'text') {
    let newStyle = { ...style };
    if (stackedTags.includes('b')) {
      if (fontFamily && webCardTextFontsVariantsMap[fontFamily]) {
        newStyle = {
          ...newStyle,
          ...webCardTextFontsVariantsMap[fontFamily].bold,
        };
      } else {
        newStyle = { ...newStyle, fontFamily: 'bold' };
      }
    }
    if (stackedTags.includes('c')) {
      newStyle = { ...newStyle, textDecorationLine: 'underline' };
    }
    if (stackedTags.includes('i')) {
      newStyle = { ...newStyle, fontStyle: 'italic' };
    }

    return (
      <span key={node.type + '' + node.start + '' + node.end} style={newStyle}>
        {node.value}
      </span>
    );
  } else if (isRichTextTag(node.type)) {
    stackedTags.push(node.type as RichTextASTTags);
    const result = (
      <>
        {node.children?.map(child =>
          generateComponentFromRichTextAst(
            child,
            fontFamily,
            style,
            stackedTags,
          ),
        )}
      </>
    );
    stackedTags.pop();
    return result;
  }
  return (
    <>
      {node.children?.map(child =>
        generateComponentFromRichTextAst(child, fontFamily, style, stackedTags),
      )}
    </>
  );
};

type RichTextProps = {
  text: string | undefined;
  fontFamily: string;
  style?: React.CSSProperties;
};

export const RichText: React.FC<RichTextProps> = ({
  text,
  fontFamily,
  style,
}): JSX.Element => {
  const ast = parseHTMLToRichText(text);
  return generateComponentFromRichTextAst(ast, fontFamily, style);
};
