import { useCallback } from 'react';
import { Linking } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { graphql, readInlineData } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  SIMPLE_BUTTON_DEFAULT_VALUES,
  SIMPLE_BUTTON_STYLE_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import PressableOpacity from '#ui/PressableOpacity';
import CardModuleBackground from './CardModuleBackground';
import type {
  SimpleButtonRenderer_module$data,
  SimpleButtonRenderer_module$key,
} from '#relayArtifacts/SimpleButtonRenderer_module.graphql';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { NullableFields } from '@azzapp/shared/objectHelpers';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

/**
 * Render a SimpleButton module
 */
const SimpleButtonRendererFragment = graphql`
  fragment SimpleButtonRenderer_module on CardModuleSimpleButton @inline {
    buttonLabel
    actionType
    actionLink
    fontFamily
    fontColor
    fontSize
    buttonColor
    borderColor
    borderWidth
    borderRadius
    marginTop
    marginBottom
    width
    height
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

export const readSimpleButtonData = (module: SimpleButtonRenderer_module$key) =>
  readInlineData(SimpleButtonRendererFragment, module);

const animatedProps = [
  'borderRadius',
  'borderWidth',
  'fontSize',
  'height',
  'marginBottom',
  'marginTop',
  'width',
] as const;

type AnimatedProps = (typeof animatedProps)[number];

export type SimpleButtonRendererData = NullableFields<
  Omit<SimpleButtonViewRendererData, AnimatedProps>
>;

type SimpleButtonRendererAnimatedData = {
  [K in AnimatedProps]:
    | SharedValue<SimpleButtonViewRendererData[K]>
    | SimpleButtonViewRendererData[K];
};

export type SimpleButtonRendererProps = ViewProps & {
  /**
   * The data for the SimpleButton module
   */
  data: SimpleButtonRendererData;
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
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
};

export type SimpleButtonViewRendererData = Omit<
  SimpleButtonRenderer_module$data,
  ' $fragmentType'
>;

export type SimpleButtonViewRenderProps = Omit<
  SimpleButtonRendererProps,
  'animatedData' | 'data'
> & {
  data: SimpleButtonViewRendererData;
};

export const SimpleButtonViewRenderer = ({
  data,
  ...rest
}: SimpleButtonViewRenderProps) => {
  const {
    borderRadius,
    borderWidth,
    fontSize,
    height,
    width,
    marginTop,
    marginBottom,
    ...restData
  } = data;

  return (
    <SimpleButtonRenderer
      {...rest}
      data={restData}
      animatedData={{
        borderRadius,
        borderWidth,
        fontSize,
        height,
        width,
        marginTop,
        marginBottom,
      }}
    />
  );
};

/**
 *  implementation of the SimpleButton module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
export const SimpleButtonRenderer = ({
  data,
  animatedData,
  colorPalette,
  cardStyle,
  style,
  contentStyle,
  disabled,
  ...props
}: SimpleButtonRendererProps) => {
  const {
    buttonLabel,
    actionType,
    actionLink,
    fontFamily,
    fontColor,
    buttonColor,
    borderColor,
    background,
    backgroundStyle,
  } = getModuleDataValues({
    data,
    cardStyle,
    styleValuesMap: SIMPLE_BUTTON_STYLE_VALUES,
    defaultValues: SIMPLE_BUTTON_DEFAULT_VALUES,
  });

  const {
    borderRadius,
    borderWidth,
    fontSize,
    height,
    marginBottom,
    marginTop,
    width,
  } = animatedData;

  const onPress = useCallback(async () => {
    if (actionLink) {
      if (actionType === 'link') {
        await Linking.openURL(actionLink);
      } else if (actionType === 'email') {
        await Linking.openURL(`mailto:${actionLink}`);
      } else {
        await Linking.openURL(`tel:${actionLink}`);
      }
    }
  }, [actionLink, actionType]);

  const cardModuleBackgroundStyle = useAnimatedStyle(() => {
    return {
      height:
        (typeof height === 'number'
          ? height
          : height?.value ?? SIMPLE_BUTTON_DEFAULT_VALUES.height) +
        (typeof marginTop === 'number'
          ? marginTop
          : marginTop?.value ?? SIMPLE_BUTTON_DEFAULT_VALUES.marginTop) +
        (typeof marginBottom === 'number'
          ? marginBottom
          : marginBottom?.value ?? SIMPLE_BUTTON_DEFAULT_VALUES.marginBottom),
      alignItems: 'center',
    };
  }, [height, marginBottom, marginTop]);

  const moduleContentStyle = useAnimatedStyle(() => {
    return {
      height:
        typeof height === 'number'
          ? height
          : height?.value ?? SIMPLE_BUTTON_DEFAULT_VALUES.height,
      width:
        typeof width === 'number'
          ? width
          : width?.value ?? SIMPLE_BUTTON_DEFAULT_VALUES.width,
      marginBottom:
        typeof marginBottom === 'number'
          ? marginBottom
          : marginBottom?.value ?? SIMPLE_BUTTON_DEFAULT_VALUES.marginBottom,
      marginTop:
        typeof marginTop === 'number'
          ? marginTop
          : marginTop?.value ?? SIMPLE_BUTTON_DEFAULT_VALUES.marginTop,
      borderRadius:
        typeof borderRadius === 'number'
          ? borderRadius
          : borderRadius?.value ?? undefined,
      borderWidth:
        typeof borderWidth === 'number'
          ? borderWidth
          : borderWidth?.value ?? undefined,
    };
  }, [marginBottom, marginTop, borderRadius, borderWidth, height, width]);

  const moduleTextStyle = useAnimatedStyle(() => {
    return {
      fontSize:
        typeof fontSize === 'number' ? fontSize : fontSize?.value ?? undefined,
    };
  }, [fontSize]);

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
      style={[style, cardModuleBackgroundStyle]}
    >
      <PressableOpacity
        onPress={onPress}
        style={contentStyle}
        disabled={disabled}
        disabledOpacity={1}
      >
        <Animated.View
          style={[
            {
              backgroundColor: swapColor(buttonColor, colorPalette),
              alignItems: 'center',
              justifyContent: 'center',

              borderColor: swapColor(borderColor, colorPalette),
              overflow: 'hidden',
            },
            moduleContentStyle,
          ]}
        >
          <Animated.Text
            style={[
              {
                fontFamily,
                color: swapColor(fontColor, colorPalette),
                flexWrap: 'nowrap',
              },
              moduleTextStyle,
            ]}
            numberOfLines={1}
          >
            {buttonLabel}
          </Animated.Text>
        </Animated.View>
      </PressableOpacity>
    </CardModuleBackground>
  );
};
