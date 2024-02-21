import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
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

const animatedProps = [
  'fontSize',
  'verticalSpacing',
  'marginVertical',
  'marginHorizontal',
] as const;

type AnimatedProps = (typeof animatedProps)[number];

export type SimpleTextRendererData = NullableFields<
  Omit<SimpleTextViewRendererData, AnimatedProps>
>;

type SimpleButtonRendererAnimatedData = {
  [K in AnimatedProps]:
    | SharedValue<SimpleTextViewRendererData[K]>
    | SimpleTextViewRendererData[K];
};

export type SimpleTextRendererProps = ViewProps & {
  /**
   * The data for the simple text module
   */
  data: SimpleTextRendererData;
  /**
   * The animated data for the SimpleButton module
   */
  animatedData: SimpleButtonRendererAnimatedData;
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

export type SimpleTextViewRendererData =
  | Omit<SimpleTextRenderer_simpleTextModule$data, ' $fragmentType'>
  | Omit<SimpleTextRenderer_simpleTitleModule$data, ' $fragmentType'>;

export type SimpleTextViewRendererProps = Omit<
  SimpleTextRendererProps,
  'animatedData' | 'data'
> & {
  data: SimpleTextViewRendererData;
};

export const SimpleTextViewRenderer = ({
  data,
  ...rest
}: SimpleTextViewRendererProps) => {
  const {
    fontSize,
    verticalSpacing,
    marginVertical,
    marginHorizontal,
    ...restData
  } = data;

  return (
    <SimpleTextRenderer
      {...rest}
      data={restData}
      animatedData={{
        fontSize,
        verticalSpacing,
        marginVertical,
        marginHorizontal,
      }}
    />
  );
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
  animatedData,
  contentStyle,
  ...props
}: SimpleTextRendererProps) => {
  // the getModuleDataValues typings does not match the data type
  // because of the 2 different types of modules
  const {
    text,
    fontFamily,
    textAlign,
    fontColor,
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

  const { fontSize, verticalSpacing, marginVertical, marginHorizontal } =
    animatedData;

  const cardModuleBackgroundStyle = useAnimatedStyle(() => {
    return {
      paddingVertical:
        typeof marginVertical === 'number'
          ? marginVertical
          : marginVertical?.value ?? SIMPLE_TEXT_DEFAULT_VALUES.marginVertical,
      paddingHorizontal:
        typeof marginHorizontal === 'number'
          ? marginHorizontal
          : marginHorizontal?.value ??
            SIMPLE_TEXT_DEFAULT_VALUES.marginHorizontal,
      flexShrink: 0,
    };
  }, [marginVertical, marginHorizontal]);

  const textStyle = useAnimatedStyle(() => {
    const fontSizeValue =
      typeof fontSize === 'number' ? fontSize : fontSize?.value;

    const verticalSpacingValue =
      typeof verticalSpacing === 'number'
        ? verticalSpacing
        : verticalSpacing?.value;

    return {
      lineHeight:
        fontSizeValue && verticalSpacingValue
          ? fontSizeValue * 1.2 + verticalSpacingValue
          : undefined,
      fontSize: fontSizeValue ?? undefined,
    };
  }, [fontSize, verticalSpacing]);

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
      style={[style, cardModuleBackgroundStyle]}
    >
      <Animated.Text
        style={[
          {
            textAlign: textAlignmentOrDefault(textAlign),
            color: swapColor(fontColor, colorPalette),
            fontFamily,
          },
          textStyle,
          contentStyle,
        ]}
      >
        {text}
      </Animated.Text>
    </CardModuleBackground>
  );
};

export default SimpleTextRenderer;
