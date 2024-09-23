import { parsePhoneNumber } from 'libphonenumber-js';
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
import type { CountryCode } from 'libphonenumber-js';
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

type AnimatedProps =
  | 'borderRadius'
  | 'borderWidth'
  | 'fontSize'
  | 'height'
  | 'marginBottom'
  | 'marginTop'
  | 'width';

export type SimpleButtonRendererData = NullableFields<
  Omit<SimpleButtonRenderer_module$data, ' $fragmentType'>
>;

type SimpleButtonRendererAnimatedData = {
  [K in AnimatedProps]: SharedValue<SimpleButtonRendererData[K]>;
};

export type SimpleButtonRendererProps = ViewProps & {
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
} & (
    | {
        /**
         * The data for the SimpleButton module
         */
        data: Omit<SimpleButtonRendererData, AnimatedProps>;
        /**
         * The animated data for the SimpleButton module
         */
        animatedData: SimpleButtonRendererAnimatedData;
      }
    | {
        /**
         * The data for the SimpleButton module
         */
        data: SimpleButtonRendererData;
        /**
         * The animated data for the SimpleButton module
         */
        animatedData: null;
      }
  );

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
    ...rest
  } = getModuleDataValues({
    data,
    cardStyle,
    styleValuesMap: SIMPLE_BUTTON_STYLE_VALUES,
    defaultValues: SIMPLE_BUTTON_DEFAULT_VALUES,
  });
  const onPress = useCallback(async () => {
    if (actionLink) {
      if (actionType === 'link') {
        await Linking.openURL(actionLink);
      } else if (actionType === 'email') {
        await Linking.openURL(`mailto:${actionLink}`);
      } else if (actionType) {
        await Linking.openURL(
          parsePhoneNumber(actionLink, actionType as CountryCode).getURI(),
        );
      }
    }
  }, [actionLink, actionType]);

  const moduleContentStyle = useAnimatedStyle(() => {
    if (animatedData === null) {
      if ('height' in rest) {
        return {
          height: rest.height ?? SIMPLE_BUTTON_DEFAULT_VALUES.height,
          width: rest.width ?? SIMPLE_BUTTON_DEFAULT_VALUES.width,
          marginBottom:
            rest.marginBottom ?? SIMPLE_BUTTON_DEFAULT_VALUES.marginBottom,
          marginTop: rest.marginTop ?? SIMPLE_BUTTON_DEFAULT_VALUES.marginTop,
          borderRadius: rest.borderRadius ?? 0,
          borderWidth: rest.borderWidth ?? 0,
        };
      }
      return {};
    }

    return {
      height: animatedData.height.value ?? SIMPLE_BUTTON_DEFAULT_VALUES.height,
      width: animatedData.width.value ?? SIMPLE_BUTTON_DEFAULT_VALUES.width,
      marginBottom:
        animatedData.marginBottom.value ??
        SIMPLE_BUTTON_DEFAULT_VALUES.marginBottom,
      marginTop:
        animatedData.marginTop.value ?? SIMPLE_BUTTON_DEFAULT_VALUES.marginTop,
      borderRadius: animatedData.borderRadius.value ?? 0,
      borderWidth: animatedData.borderWidth.value ?? 0,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    return animatedData === null
      ? { fontSize: 'fontSize' in rest ? rest.fontSize : undefined }
      : {
          fontSize: animatedData.fontSize.value ?? undefined,
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
      style={[style, { alignItems: 'center' }]}
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
              textStyle,
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

export default SimpleButtonRenderer;
