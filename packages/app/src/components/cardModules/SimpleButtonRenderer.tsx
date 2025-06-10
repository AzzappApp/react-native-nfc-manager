import { useCallback, useMemo } from 'react';
import { Linking, Text, View } from 'react-native';
import { graphql, readInlineData } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  SIMPLE_BUTTON_DEFAULT_VALUES,
  SIMPLE_BUTTON_STYLE_VALUES,
  getModuleDataValues,
} from '@azzapp/shared/cardModuleHelpers';
import { formatPhoneNumberUri } from '@azzapp/shared/stringHelpers';
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

export type SimpleButtonRendererData = NullableFields<
  Omit<SimpleButtonRenderer_module$data, ' $fragmentType'>
>;

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
  /**
   * The cover background color
   */
  coverBackgroundColor?: string | null | undefined;
  /**
   * The data for the SimpleButton module
   */
  data: SimpleButtonRendererData;
};

/**
 *  implementation of the SimpleButton module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
export const SimpleButtonRenderer = ({
  data,
  colorPalette,
  cardStyle,
  style,
  contentStyle,
  disabled,
  coverBackgroundColor,
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
    borderRadius,
    borderWidth,
    fontSize,
    height,
    marginBottom,
    marginTop,
    width,
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
          formatPhoneNumberUri(actionLink, actionType as CountryCode),
        );
      }
    }
  }, [actionLink, actionType]);

  const moduleContentStyle = useMemo(() => {
    return {
      height: height ?? SIMPLE_BUTTON_DEFAULT_VALUES.height,
      width: width ?? SIMPLE_BUTTON_DEFAULT_VALUES.width,
      marginBottom: marginBottom ?? SIMPLE_BUTTON_DEFAULT_VALUES.marginBottom,
      marginTop: marginTop ?? SIMPLE_BUTTON_DEFAULT_VALUES.marginTop,
      borderRadius: borderRadius ?? 0,
      borderWidth: borderWidth ?? 0,
    };
  }, [height, width, marginBottom, marginTop, borderRadius, borderWidth]);

  const textStyle = useMemo(() => {
    return { fontSize, lineHeight: fontSize * 1.5 };
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
      style={[style, { alignItems: 'center' }]}
    >
      <PressableOpacity
        onPress={onPress}
        style={contentStyle}
        disabled={disabled}
        disabledOpacity={1}
      >
        <View
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
          <Text
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
          </Text>
        </View>
      </PressableOpacity>
    </CardModuleBackground>
  );
};

export default SimpleButtonRenderer;
