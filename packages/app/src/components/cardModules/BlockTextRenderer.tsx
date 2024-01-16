import {
  type ViewProps,
  type ColorValue,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { graphql, readInlineData } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  BLOCK_TEXT_DEFAULT_VALUES,
  BLOCK_TEXT_STYLE_VALUES,
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
   * The data for the BlockText module
   */
  data: BlockTextRendererData;
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
};

/**
 * Render a BlockText module
 */
const BlockTextRenderer = ({
  data,
  colorPalette,
  cardStyle,
  contentStyle,
  ...props
}: BlockTextRendererProps) => {
  const {
    text,
    fontFamily,
    fontColor,
    textAlign,
    fontSize,
    verticalSpacing,
    textMarginVertical,
    textMarginHorizontal,
    marginHorizontal,
    marginVertical,
    textBackground,
    textBackgroundStyle,
    background,
    backgroundStyle,
  } = getModuleDataValues({
    data,
    cardStyle,
    defaultValues: BLOCK_TEXT_DEFAULT_VALUES,
    styleValuesMap: BLOCK_TEXT_STYLE_VALUES,
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
    >
      <View
        style={[
          {
            marginVertical,
            marginHorizontal,
          },
          contentStyle,
        ]}
      >
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
              paddingHorizontal: textMarginHorizontal,
              paddingVertical: textMarginVertical,
              textAlign: textAlignmentOrDefault(textAlign),
              color: swapColor(fontColor, colorPalette) as ColorValue,
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
      </View>
    </CardModuleBackground>
  );
};

export default BlockTextRenderer;
