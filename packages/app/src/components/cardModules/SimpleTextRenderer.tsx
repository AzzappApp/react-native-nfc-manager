import { useMemo } from 'react';
import { useIntl } from 'react-intl';
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
import Text from '#ui/Text';
import CardModuleBackground from './CardModuleBackground';
import type {
  SimpleTextRenderer_simpleTextModule$data,
  SimpleTextRenderer_simpleTextModule$key,
} from '#relayArtifacts/SimpleTextRenderer_simpleTextModule.graphql';
import type {
  SimpleTextRenderer_simpleTitleModule$data,
  SimpleTextRenderer_simpleTitleModule$key,
} from '#relayArtifacts/SimpleTextRenderer_simpleTitleModule.graphql';
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
  /**
   * The cover background color
   */
  coverBackgroundColor?: string | null | undefined;
  data: SimpleTextRendererData;
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
  coverBackgroundColor,
  ...props
}: SimpleTextRendererProps) => {
  // the getModuleDataValues typings does not match the data type
  // because of the 2 different types of modules
  const {
    text,
    textAlign,
    fontFamily,
    fontColor,
    background,
    backgroundStyle,
    fontSize,
    verticalSpacing,
    marginHorizontal,
    marginVertical,
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

  const cardModuleBackgroundStyle = useMemo(() => {
    return {
      paddingVertical: marginVertical,
      paddingHorizontal: marginHorizontal,
    };
  }, [marginHorizontal, marginVertical]);

  const textStyle = useMemo(() => {
    return {
      lineHeight:
        fontSize && verticalSpacing
          ? fontSize * 1.2 + verticalSpacing
          : undefined,
      fontSize,
    };
  }, [fontSize, verticalSpacing]);

  const intl = useIntl();

  const textColor = swapColor(fontColor, colorPalette);

  const defaultText = useMemo(() => {
    if (data.kind === 'simpleTitle') {
      return intl.formatMessage(
        {
          defaultMessage:
            'Add section contents here. To edit the text, simply open the editor and start typing. You can also change the font style, size, color, and alignment using the editing tools provided. Adjust the margins and the background for this section to match the design and branding of your WebCard{azzappA}.',
          description: 'Default text for the simple title module',
        },
        {
          azzappA: (
            <Text variant="azzapp" style={{ color: textColor }}>
              a
            </Text>
          ),
        },
      );
    } else {
      return intl.formatMessage(
        {
          defaultMessage:
            'Add section contents here. To edit the text, simply open the editor and start typing. You can also change the font style, size, color, and alignment using the editing tools provided. Adjust the margins and the background for this section to match the design and branding of your WebCard{azzappA}.',
          description: 'Default text for the simple text module',
        },
        {
          azzappA: (
            <Text variant="azzapp" style={{ color: textColor }}>
              a
            </Text>
          ),
        },
      );
    }
  }, [data.kind, intl, textColor]);

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
      style={[style, cardModuleBackgroundStyle, { flexShrink: 0 }]}
    >
      {text && (
        <Text
          style={[
            {
              textAlign: textAlignmentOrDefault(textAlign),
              color: textColor,
              fontFamily,
            },
            textStyle,
            contentStyle,
          ]}
        >
          {text}
        </Text>
      )}
      {!text && (
        <Text
          style={[
            {
              textAlign: textAlignmentOrDefault(textAlign),
              color: textColor,
              fontFamily,
            },
            textStyle,
            contentStyle,
          ]}
        >
          {defaultText}
        </Text>
      )}
    </CardModuleBackground>
  );
};

export default SimpleTextRenderer;
