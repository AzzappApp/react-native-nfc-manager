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
  textFontSize,
  style = {},
  stackedTags = [],
}: {
  node: RichTextASTNode;
  fontFamily: string;
  textFontSize: number;
  style?: React.CSSProperties;
  stackedTags?: RichTextASTTags[];
}): JSX.Element => {
  if (node.type === 'text') {
    let className = undefined;
    let newStyle = { ...style };
    if (stackedTags.includes('b')) {
      if (fontFamily && webCardTextFontsVariantsMap[fontFamily]) {
        className = webCardTextFontsVariantsMap[fontFamily].className;
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
    if (stackedTags.includes('+3')) {
      newStyle = { ...newStyle, fontSize: textFontSize + 3 };
    }
    if (stackedTags.includes('-3')) {
      newStyle = { ...newStyle, fontSize: textFontSize - 3 };
    }
    if (stackedTags.includes('+6')) {
      newStyle = { ...newStyle, fontSize: textFontSize + 6 };
    }
    if (stackedTags.includes('-6')) {
      newStyle = { ...newStyle, fontSize: textFontSize - 6 };
    }

    return (
      <span
        key={node.type + '' + node.start + '' + node.end}
        style={newStyle}
        className={className}
      >
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
            textFontSize={textFontSize}
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
          textFontSize={textFontSize}
        />
      ))}
    </>
  );
};

type RichTextProps = {
  text: string | undefined;
  fontFamily: string;
  textFontSize: number;
  style?: React.CSSProperties;
};

const RichText: React.FC<RichTextProps> = ({
  text,
  fontFamily,
  style,
  textFontSize,
}): JSX.Element => {
  const ast = parseHTMLToRichText(text);
  return (
    <RichTextFromAst
      fontFamily={fontFamily}
      style={style}
      node={ast}
      textFontSize={textFontSize}
    />
  );
};

export default React.memo(RichText);
