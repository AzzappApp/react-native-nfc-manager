import { useIntl } from 'react-intl';
import {
  type ViewProps,
  type StyleProp,
  type ViewStyle,
  View,
} from 'react-native';
import { graphql, readInlineData } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  BLOCK_TEXT_STYLE_VALUES,
  getBlockTextDefaultValues,
  getModuleDataValues,
  textAlignmentOrDefault,
} from '@azzapp/shared/cardModuleHelpers';
import Text from '#ui/Text';
import CardModuleBackground from './CardModuleBackground';
import type {
  BlockTextRenderer_module$data,
  BlockTextRenderer_module$key,
} from '#relayArtifacts/BlockTextRenderer_module.graphql';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { NullableFields } from '@azzapp/shared/objectHelpers';

const BlockTextRendererFragment = graphql`
  fragment BlockTextRenderer_module on CardModuleBlockText @inline {
    text
    fontFamily
    fontColor
    textAlign
    fontSize
    verticalSpacing
    textMarginVertical
    textMarginHorizontal
    marginHorizontal
    marginVertical
    textBackground {
      id
      uri
      resizeMode
    }
    textBackgroundStyle {
      backgroundColor
      patternColor
      opacity
    }
    background {
      id
      uri
      resizeMode
    }
    backgroundStyle {
      backgroundColor
      patternColor
    }
  }
`;

export const readBlockTextData = (module: BlockTextRenderer_module$key) =>
  readInlineData(BlockTextRendererFragment, module);

export type BlockTextRendererData = NullableFields<
  Omit<BlockTextRenderer_module$data, ' $fragmentType'>
>;

export type BlockTextRendererProps = ViewProps & {
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
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * The cover background color
   */
  coverBackgroundColor?: string | null | undefined;
  /**
   * The data for the BlockText module
   */
  data: BlockTextRendererData;
};
/**
 * Render a BlockText module
 */
const BlockTextRenderer = ({
  data,
  colorPalette,
  cardStyle,
  contentStyle,
  coverBackgroundColor,
  ...props
}: BlockTextRendererProps) => {
  const {
    text,
    fontFamily,
    fontColor,
    textAlign,
    textBackground,
    textBackgroundStyle,
    background,
    backgroundStyle,
    fontSize,
    marginHorizontal,
    marginVertical,
    textMarginHorizontal,
    textMarginVertical,
    verticalSpacing,
  } = getModuleDataValues({
    data,
    cardStyle,
    defaultValues: getBlockTextDefaultValues(coverBackgroundColor),
    styleValuesMap: BLOCK_TEXT_STYLE_VALUES,
  });

  const intl = useIntl();

  const textColor = swapColor(fontColor, colorPalette);

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
    >
      <View style={[{ marginVertical, marginHorizontal }, contentStyle]}>
        <CardModuleBackground
          backgroundUri={textBackground?.uri}
          backgroundOpacity={textBackgroundStyle?.opacity}
          backgroundColor={swapColor(
            textBackgroundStyle?.backgroundColor,
            colorPalette,
          )}
          patternColor={swapColor(
            textBackgroundStyle?.patternColor,
            colorPalette,
          )}
          resizeMode={textBackground?.resizeMode}
        >
          <Text
            style={{
              textAlign: textAlignmentOrDefault(textAlign),
              color: textColor,
              fontFamily,
              paddingVertical: textMarginVertical ?? 0,
              paddingHorizontal: textMarginHorizontal ?? 0,
              fontSize,
              lineHeight:
                fontSize != null && verticalSpacing != null
                  ? fontSize * 1.2 + verticalSpacing
                  : undefined,
            }}
          >
            {text ||
              intl.formatMessage(
                {
                  defaultMessage:
                    'Add section contents here. To edit the text, simply open the editor and start typing. You can also change the font style, size, color, and alignment using the editing tools provided. Adjust the margins and the background for this section to match the design and branding of your WebCard{azzappA}.',
                  description: 'Default text for the BlockText module',
                },
                {
                  azzappA: (
                    <Text variant="azzapp" style={{ color: textColor }}>
                      a
                    </Text>
                  ),
                },
              )}
          </Text>
        </CardModuleBackground>
      </View>
    </CardModuleBackground>
  );
};

export default BlockTextRenderer;
