import {
  type ViewProps,
  type ColorValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { graphql, readInlineData } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  BLOCK_TEXT_DEFAULT_VALUES,
  BLOCK_TEXT_STYLE_VALUES,
  getModuleDataValues,
  textAlignmentOrDefault,
} from '@azzapp/shared/cardModuleHelpers';
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

const animatedProps = [
  'fontSize',
  'verticalSpacing',
  'marginHorizontal',
  'marginVertical',
  'textMarginVertical',
  'textMarginHorizontal',
] as const;

type AnimatedProps = (typeof animatedProps)[number];

export const readBlockTextData = (module: BlockTextRenderer_module$key) =>
  readInlineData(BlockTextRendererFragment, module);

export type BlockTextRendererData = NullableFields<
  Omit<BlockTextRenderer_module$data, ' $fragmentType'>
>;

type BlockTextRendererAnimatedData = {
  [K in AnimatedProps]: SharedValue<BlockTextRendererData[K]>;
};

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
} & (
    | {
        /**
         * The data for the BlockText module
         */
        data: BlockTextRendererData;

        animatedData: null;
      }
    | {
        /**
         * The data for the BlockText module
         */
        data: Omit<BlockTextRendererData, AnimatedProps>;
        /**
         * The animated data for the BlockText module
         */
        animatedData: BlockTextRendererAnimatedData;
      }
  );

/**
 * Render a BlockText module
 */
const BlockTextRenderer = ({
  data,
  animatedData,
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
    textBackground,
    textBackgroundStyle,
    background,
    backgroundStyle,
    ...rest
  } = getModuleDataValues({
    data,
    cardStyle,
    defaultValues: BLOCK_TEXT_DEFAULT_VALUES,
    styleValuesMap: BLOCK_TEXT_STYLE_VALUES,
  });

  const containerStyle = useAnimatedStyle(() =>
    animatedData !== null
      ? {
          marginVertical: animatedData.marginVertical.value,
          marginHorizontal: animatedData.marginHorizontal.value,
        }
      : 'marginVertical' in rest
        ? {
            marginVertical: rest.marginVertical,
            marginHorizontal: rest.marginHorizontal,
          }
        : {},
  );

  const textStyle = useAnimatedStyle(() => {
    if (animatedData === null) {
      if ('fontSize' in rest) {
        return {
          paddingVertical: rest.textMarginVertical,
          paddingHorizontal: rest.textMarginHorizontal,
          fontSize: rest.fontSize ?? undefined,
          lineHeight:
            rest.fontSize && rest.verticalSpacing
              ? rest.fontSize * 1.2 + rest.verticalSpacing
              : undefined,
        };
      }
      return {};
    }

    const {
      fontSize,
      verticalSpacing,
      textMarginVertical,
      textMarginHorizontal,
    } = animatedData;

    const fontSizeValue = fontSize?.value;

    const verticalSpacingValue = verticalSpacing?.value;
    return {
      paddingVertical: textMarginVertical?.value,
      paddingHorizontal: textMarginHorizontal?.value ?? 0,
      fontSize: fontSizeValue ?? undefined,
      lineHeight:
        fontSizeValue && verticalSpacingValue
          ? fontSizeValue * 1.2 + verticalSpacingValue
          : undefined,
    };
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
      <Animated.View style={[containerStyle, contentStyle]}>
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
          <Animated.Text
            style={[
              {
                textAlign: textAlignmentOrDefault(textAlign),
                color: swapColor(fontColor, colorPalette) as ColorValue,
                fontFamily,
              },
              textStyle,
            ]}
          >
            {text}
          </Animated.Text>
        </CardModuleBackground>
      </Animated.View>
    </CardModuleBackground>
  );
};

export default BlockTextRenderer;
