import { useCallback } from 'react';
import { Linking, Text, View } from 'react-native';
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
} from '@azzapp/relay/artifacts/SimpleButtonRenderer_module.graphql';
import type { CardStyle, ColorPalette } from '@azzapp/shared/cardHelpers';
import type { NullableFields } from '@azzapp/shared/objectHelpers';
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

export type SimpleButtonRendererData = NullableFields<
  Omit<SimpleButtonRenderer_module$data, ' $fragmentType'>
>;

export type SimpleButtonRendererProps = ViewProps & {
  /**
   * The data for the SimpleButton module
   */
  data: SimpleButtonRendererData;
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

/**
 *  implementation of the SimpleButton module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
const SimpleButtonRenderer = ({
  data,
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
    fontSize,
    buttonColor,
    borderColor,
    borderWidth,
    borderRadius,
    marginTop,
    marginBottom,
    width,
    height,
    background,
    backgroundStyle,
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
      } else {
        await Linking.openURL(`tel:${actionLink}`);
      }
    }
  }, [actionLink, actionType]);

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
          height: height + marginTop + marginBottom,
          alignItems: 'center',
        },
      ]}
    >
      <PressableOpacity
        onPress={onPress}
        style={[contentStyle]}
        disabled={disabled}
        disabledOpacity={1}
      >
        <View
          style={{
            height,
            width,
            marginBottom,
            marginTop,
            backgroundColor: swapColor(buttonColor, colorPalette),
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius,
            borderWidth,
            borderColor: swapColor(borderColor, colorPalette),
            overflow: 'hidden',
          }}
        >
          <Text
            style={{
              fontFamily,
              color: swapColor(fontColor, colorPalette),
              fontSize,
              flexWrap: 'nowrap',
            }}
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
