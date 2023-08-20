import { Text } from 'react-native';
import { graphql, useFragment } from 'react-relay';
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
  SimpleTextRenderer_module$data,
  SimpleTextRenderer_module$key,
} from '@azzapp/relay/artifacts/SimpleTextRenderer_module.graphql';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { NullableFields } from '@azzapp/shared/objectHelpers';
import type { ViewProps } from 'react-native';

export type SimpleTextRendererProps = ViewProps & {
  /**
   * A relay fragment reference for a simple text module
   */
  module: SimpleTextRenderer_module$key;
  /**
   * the color palette
   */
  colorPalette: ColorPalette | null | undefined;
  /**
   * the card style
   */
  cardStyle: CardStyle | null | undefined;
};

/**
 * Render a simple text module
 */
const SimpleTextRenderer = ({ module, ...props }: SimpleTextRendererProps) => {
  const { simpleText, simpleTitle } = useFragment(
    graphql`
      fragment SimpleTextRenderer_module on CardModule {
        ... on CardModuleSimpleText @alias(as: "simpleText") {
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
        ... on CardModuleSimpleTitle @alias(as: "simpleTitle") {
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
      }
    `,
    module,
  );

  const data = simpleText ?? simpleTitle;

  if (!data) {
    return null;
  }

  return <SimpleTextRendererRaw data={data} {...props} />;
};

export default SimpleTextRenderer;

export type SimpleTextRawData = NullableFields<
  NonNullable<
    | SimpleTextRenderer_module$data['simpleText']
    | SimpleTextRenderer_module$data['simpleTitle']
  >
>;

type SimpleTextRendererRawProps = ViewProps & {
  /**
   * The data for the simple text module
   */
  data: SimpleTextRawData;
  /**
   * the color palette
   */
  colorPalette: ColorPalette | null | undefined;
  /**
   * the card style
   */
  cardStyle: CardStyle | null | undefined;
};

/**
 * Raw implementation of the simple text module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
export const SimpleTextRendererRaw = ({
  data,
  colorPalette,
  cardStyle,
  style,
  ...props
}: SimpleTextRendererRawProps) => {
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
        style={{
          textAlign: textAlignmentOrDefault(textAlign),
          color: swapColor(fontColor, colorPalette),
          fontSize,
          fontFamily,
          lineHeight:
            fontSize && verticalSpacing
              ? fontSize * 1.2 + verticalSpacing
              : undefined,
        }}
      >
        {text}
      </Text>
    </CardModuleBackground>
  );
};
