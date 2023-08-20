import { type ViewProps, type ColorValue, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
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
} from '@azzapp/relay/artifacts/BlockTextRenderer_module.graphql';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { NullableFields } from '@azzapp/shared/objectHelpers';

export type BlockTextRendererProps = ViewProps & {
  /**
   * A relay fragment reference for a BlockText module
   */
  module: BlockTextRenderer_module$key;
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
 * Render a BlockText module
 */
const BlockTextRenderer = ({ module, ...props }: BlockTextRendererProps) => {
  const data = useFragment(
    graphql`
      fragment BlockTextRenderer_module on CardModuleBlockText {
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
    `,
    module,
  );
  return <BlockTextRendererRaw data={data} {...props} />;
};

export default BlockTextRenderer;

export type BlockTextRawData = NullableFields<
  Omit<BlockTextRenderer_module$data, ' $fragmentType'>
>;

type BlockTextRendererRawProps = ViewProps & {
  /**
   * The data for the BlockText module
   */
  data: BlockTextRawData;
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
 * Raw implementation of the BlockText module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
export const BlockTextRendererRaw = ({
  data,
  colorPalette,
  cardStyle,
  ...props
}: BlockTextRendererRawProps) => {
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
    >
      <View
        style={{
          marginVertical: 2 * marginVertical,
          marginHorizontal: 2 * marginHorizontal,
        }}
      >
        <CardModuleBackground
          {...props}
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
        >
          <Text
            style={{
              paddingHorizontal: 2 * textMarginHorizontal,
              paddingVertical: 2 * textMarginVertical,
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
