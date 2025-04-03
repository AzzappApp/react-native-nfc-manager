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
  fontSize: number;
  // Force resizing value. In case of edit we don't want to decrease font size by 6
  // This props allow to force small resizing
  forceFontResizeValue?: number;
};

export const defaultFontSize = 16;
export const defaultTextFontSize = 16;
export const defaultTitleFontSize = 34;

export const RichTextFromAST = ({
  node,
  fontSize,
  style = {},
  stackedTags = [],
  forceFontResizeValue,
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
            fontSize={fontSize}
            forceFontResizeValue={forceFontResizeValue}
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
    if (stackedTags.includes('+3')) {
      const newFontSize = fontSize + (forceFontResizeValue ?? 3);
      fontStyle = {
        ...fontStyle,
        fontSize: newFontSize,
        lineHeight: Math.floor(newFontSize * 1.9),
      };
    }
    if (stackedTags.includes('-3')) {
      const newFontSize = fontSize - (forceFontResizeValue ?? 3);
      fontStyle = {
        ...fontStyle,
        fontSize: fontSize - (forceFontResizeValue ?? 3),
        lineHeight: Math.floor(newFontSize * 1.9),
      };
    }
    if (stackedTags.includes('+6')) {
      const newFontSize = fontSize + (forceFontResizeValue ?? 6);
      fontStyle = {
        ...fontStyle,
        fontSize: newFontSize,
        lineHeight: Math.floor(newFontSize * 1.6),
      };
    }
    if (stackedTags.includes('-6')) {
      const newFontSize = fontSize - (forceFontResizeValue ?? 6);
      fontStyle = {
        ...fontStyle,
        fontSize: newFontSize,
        lineHeight: Math.floor(newFontSize * 1.6),
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
  fontSize: number;
  forceFontResizeValue?: number;
};

export const RichText = ({
  text,
  style = {},
  fontSize,
  forceFontResizeValue,
}: RichTextProps): JSX.Element => {
  const ast = parseHTMLToRichText(text);
  return (
    <Text style={style}>
      <RichTextFromAST
        node={ast}
        style={style}
        fontSize={fontSize}
        forceFontResizeValue={forceFontResizeValue}
      />
    </Text>
  );
};
