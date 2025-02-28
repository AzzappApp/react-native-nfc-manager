import React from 'react';
import {
  parseHTMLToRichText,
  isRichTextTag,
} from '@azzapp/shared/richText/stringToolbox';
import { webCardTextFontsVariantsMap } from '../helpers/fonts';
import type {
  RichTextASTNode,
  RichTextASTTags,
} from '@azzapp/shared/richText/richTextTypes';

const RichTextFromAst = ({
  node,
  fontFamily,
  style = {},
  stackedTags = [],
}: {
  node: RichTextASTNode;
  fontFamily: string;
  style?: React.CSSProperties;
  stackedTags?: RichTextASTTags[];
}): JSX.Element => {
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
    const newStackedTags = [...stackedTags, node.type as RichTextASTTags];
    const result = (
      <>
        {node.children?.map((child, index) => (
          <RichTextFromAst
            key={`child-${index}`}
            fontFamily={fontFamily}
            style={style}
            stackedTags={newStackedTags}
            node={child}
          />
        ))}
      </>
    );
    return result;
  }
  return (
    <>
      {node.children?.map((child, index) => (
        <RichTextFromAst
          key={`child-${index}`}
          fontFamily={fontFamily}
          style={style}
          stackedTags={stackedTags}
          node={child}
        />
      ))}
    </>
  );
};

type RichTextProps = {
  text: string | undefined;
  fontFamily: string;
  style?: React.CSSProperties;
};

const RichText: React.FC<RichTextProps> = ({
  text,
  fontFamily,
  style,
}): JSX.Element => {
  const ast = parseHTMLToRichText(text);
  return <RichTextFromAst fontFamily={fontFamily} style={style} node={ast} />;
};

export default React.memo(RichText);
