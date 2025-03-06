import { Text, StyleSheet } from 'react-native';
import { MODULE_TEXT_FONTS_VARIANTS_OBJECT } from '@azzapp/shared/fontHelpers';
import {
  parseHTMLToRichText,
  isRichTextTag,
} from '@azzapp/shared/richText/stringToolbox';
import type {
  RichTextASTNode,
  RichTextASTTags,
} from '@azzapp/shared/richText/richTextTypes';

import type { TextStyle } from 'react-native';

type RichTextFromASTProps = {
  node: RichTextASTNode;
  style?: TextStyle | TextStyle[];
  stackedTags?: RichTextASTTags[];
};

const defaultFontSize = 15;

export const RichTextFromAST = ({
  node,
  style = {},
  stackedTags = [],
}: RichTextFromASTProps): JSX.Element => {
  const styleInner = Array.isArray(style) ? StyleSheet.flatten(style) : style;
  if (node.children) {
    const result = (
      <>
        {node.children?.map(child => (
          <RichTextFromAST
            key={child.type + '' + child.start + '' + child.end}
            node={child}
            style={styleInner}
            stackedTags={
              isRichTextTag(node.type)
                ? [...stackedTags, node.type as RichTextASTTags]
                : stackedTags
            }
          />
        ))}
      </>
    );
    return result;
  } else if (node.type === 'text') {
    const isBold = stackedTags.includes('b');
    const isItalic = stackedTags.includes('i');
    const hasVariant =
      typeof styleInner.fontFamily === 'string' &&
      MODULE_TEXT_FONTS_VARIANTS_OBJECT[styleInner.fontFamily];
    const isBigger = stackedTags.includes('+3');
    const isSmaller = stackedTags.includes('-3');

    let fontStyle = {};
    let fontFamily = styleInner.fontFamily;
    if (hasVariant && typeof styleInner.fontFamily === 'string') {
      if (isItalic && isBold) {
        fontFamily =
          MODULE_TEXT_FONTS_VARIANTS_OBJECT[styleInner.fontFamily].boldItalic;
      } else if (isItalic) {
        fontFamily =
          MODULE_TEXT_FONTS_VARIANTS_OBJECT[styleInner.fontFamily].italic;
      } else if (isBold) {
        fontFamily =
          MODULE_TEXT_FONTS_VARIANTS_OBJECT[styleInner.fontFamily].bold;
      }
      fontStyle = { fontFamily };
    } else {
      if (isBold) {
        fontStyle = { ...fontStyle, fontWeight: 'bold' };
      }
      if (isItalic) {
        fontStyle = { ...fontStyle, fontStyle: 'italic' };
      }
    }
    if (isBigger) {
      fontStyle = {
        ...fontStyle,
        fontSize: defaultFontSize + 3,
      };
    }
    if (isSmaller) {
      fontStyle = {
        ...fontStyle,
        fontSize: defaultFontSize - 3,
      };
    }

    if (stackedTags.includes('c')) {
      fontStyle = {
        ...fontStyle,
        textDecorationLine: 'underline',
      };
    }
    return (
      <Text
        key={node.value + '' + node.type + '' + node.start + '' + node.end}
        style={[styleInner, fontStyle]}
      >
        {node.value}
      </Text>
    );
  }
  return <></>;
};

type RichTextProps = {
  text: string | undefined;
  style?: TextStyle | TextStyle[];
};

export const RichText = ({ text, style = {} }: RichTextProps): JSX.Element => {
  const ast = parseHTMLToRichText(text);
  return (
    <Text style={style}>
      <RichTextFromAST node={ast} style={style} />
    </Text>
  );
};
