import { Text } from 'react-native';
import { graphql, readInlineData } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  MODULE_KIND_SIMPLE_TITLE,
  SIMPLE_TEXT_DEFAULT_VALUES,
  SIMPLE_TEXT_STYLE_VALUES,
  SIMPLE_TITLE_DEFAULT_VALUES,
  SIMPLE_TITLE_STYLE_VALUES,
  getModuleDataValues,
  textAlignmentOrDefault,
} from '@azzapp/shared/cardModuleHelpers';
import CardModuleBackground from './CardModuleBackground';
import type {
  SimpleTextRenderer_simpleTextModule$data,
  SimpleTextRenderer_simpleTextModule$key,
} from '@azzapp/relay/artifacts/SimpleTextRenderer_simpleTextModule.graphql';
import type {
  SimpleTextRenderer_simpleTitleModule$data,
  SimpleTextRenderer_simpleTitleModule$key,
} from '@azzapp/relay/artifacts/SimpleTextRenderer_simpleTitleModule.graphql';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { NullableFields } from '@azzapp/shared/objectHelpers';
import type { StyleProp, TextStyle, ViewProps } from 'react-native';

const SimpleTextRendererFragment = graphql`
  fragment SimpleTextRenderer_simpleTextModule on CardModuleSimpleText @inline {
    kind
    text
    fontFamily
    fontSize
    fontColor
    textAlign
    verticalSpacing
    marginHorizontal
    marginVertical
    background {
      uri
      resizeMode
    }
    backgroundStyle {
      backgroundColor
      patternColor
    }
  }
`;

const SimpleTitleRendererFragment = graphql`
  fragment SimpleTextRenderer_simpleTitleModule on CardModuleSimpleTitle
  @inline {
    kind
    text
    fontFamily
    fontSize
    fontColor
    textAlign
    verticalSpacing
    marginHorizontal
    marginVertical
    background {
      uri
      resizeMode
    }
    backgroundStyle {
      backgroundColor
      patternColor
    }
  }
`;

export const readSimpleTextData = (
  module: SimpleTextRenderer_simpleTextModule$key,
) => readInlineData(SimpleTextRendererFragment, module);

export const readSimpleTitleData = (
  module: SimpleTextRenderer_simpleTitleModule$key,
) => readInlineData(SimpleTitleRendererFragment, module);

export type SimpleTextRendererData = NullableFields<
  | Omit<SimpleTextRenderer_simpleTextModule$data, ' $fragmentType'>
  | Omit<SimpleTextRenderer_simpleTitleModule$data, ' $fragmentType'>
>;

export type SimpleTextRendererProps = ViewProps & {
  /**
   * The data for the simple text module
   */
  data: SimpleTextRendererData;
  /**
   * the color palette
   */
  colorPalette: ColorPalette | null | undefined;
  /**
   * the card style
   */
  cardStyle: CardStyle | null | undefined;
  /**
   * The wrapped content style
   */
  contentStyle?: StyleProp<TextStyle>;
};

/**
 *  implementation of the simple text module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
const SimpleTextRenderer = ({
  data,
  colorPalette,
  cardStyle,
  style,
  contentStyle,
  ...props
}: SimpleTextRendererProps) => {
  // the getModuleDataValues typings does not match the data type
  // because of the 2 different types of modules
  const {
    text,
    fontFamily,
    fontSize,
    textAlign,
    fontColor,
    verticalSpacing,
    marginHorizontal,
    marginVertical,
    background,
    backgroundStyle,
  } = getModuleDataValues({
    data,
    styleValuesMap:
      data.kind === MODULE_KIND_SIMPLE_TITLE
        ? SIMPLE_TITLE_STYLE_VALUES
        : SIMPLE_TEXT_STYLE_VALUES,
    cardStyle,
    defaultValues:
      data.kind === MODULE_KIND_SIMPLE_TITLE
        ? SIMPLE_TITLE_DEFAULT_VALUES
        : SIMPLE_TEXT_DEFAULT_VALUES,
  });

  return (
    <CardModuleBackground
      {...props}
      key={background?.uri}
      backgroundUri={background?.uri}
      backgroundColor={swapColor(
        backgroundStyle?.backgroundColor,
        colorPalette,
      )}
      patternColor={swapColor(backgroundStyle?.patternColor, colorPalette)}
      resizeMode={background?.resizeMode}
      style={[
        style,
        {
          paddingHorizontal: marginHorizontal ?? 0,
          paddingVertical: marginVertical ?? 0,
          flexShrink: 0,
        },
      ]}
    >
      <Text
        style={[
          {
            textAlign: textAlignmentOrDefault(textAlign),
            color: swapColor(fontColor, colorPalette),
            fontSize,
            fontFamily,
            lineHeight:
              fontSize && verticalSpacing
                ? fontSize * 1.2 + verticalSpacing
                : undefined,
          },
          contentStyle,
        ]}
      >
        {text}
      </Text>
    </CardModuleBackground>
  );
};

export default SimpleTextRenderer;
