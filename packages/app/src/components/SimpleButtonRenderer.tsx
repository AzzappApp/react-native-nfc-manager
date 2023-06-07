import chroma from 'chroma-js';
import { useState, useCallback } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { graphql, useFragment } from 'react-relay';
import { SIMPLE_BUTTON_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import { colors } from '#theme';
import PressableOpacity from '#ui/PressableOpacity';
import type { SimpleButtonEditionValue } from '#screens/SimpleButtonEditionScreen/simpleButtonEditionScreenTypes';
import type {
  SimpleButtonRenderer_module$data,
  SimpleButtonRenderer_module$key,
} from '@azzapp/relay/artifacts/SimpleButtonRenderer_module.graphql';
import type {
  ViewProps,
  LayoutChangeEvent,
  LayoutRectangle,
} from 'react-native';

export type SimpleButtonRendererProps = ViewProps & {
  /**
   * A relay fragment reference for a SimpleButton module
   */
  module: SimpleButtonRenderer_module$key;
};

/**
 * Render a SimpleButton module
 */
const SimpleButtonRenderer = ({
  module,
  ...props
}: SimpleButtonRendererProps) => {
  const data = useFragment(
    graphql`
      fragment SimpleButtonRenderer_module on CardModule {
        id
        ... on CardModuleSimpleButton {
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
          }
          backgroundStyle {
            backgroundColor
            patternColor
            opacity
          }
        }
      }
    `,
    module,
  );
  return <SimpleButtonRendererRaw data={data} {...props} />;
};

export default SimpleButtonRenderer;

export type SimpleButtonRawData = Omit<
  SimpleButtonRenderer_module$data,
  ' $fragmentType'
>;

type SimpleButtonRendererRawProps = ViewProps & {
  /**
   * The data for the SimpleButton module
   */
  data: SimpleButtonRawData;
};

/**
 * Raw implementation of the SimpleButton module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
export const SimpleButtonRendererRaw = ({
  data,
  style,
  ...props
}: SimpleButtonRendererRawProps) => {
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
  } = Object.assign(
    {},
    SIMPLE_BUTTON_DEFAULT_VALUES,
    data,
  ) as SimpleButtonEditionValue;

  const [layout, setLayout] = useState<LayoutRectangle | null>(null);
  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      props.onLayout?.(e);
      setLayout(e.nativeEvent.layout);
    },
    [props],
  );
  const backgroundColor = backgroundStyle
    ? chroma(backgroundStyle.backgroundColor)
        .alpha(backgroundStyle.opacity / 100)
        .hex()
    : colors.white;

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
    <View
      {...props}
      style={[style, { backgroundColor, height, alignItems: 'center' }]}
      onLayout={onLayout}
    >
      {background && (
        <View style={styles.background} pointerEvents="none">
          <SvgUri
            uri={background.uri}
            color={backgroundStyle?.patternColor ?? '#000'}
            width={layout?.width ?? 0}
            height={layout?.height ?? 0}
            preserveAspectRatio="xMidYMid slice"
            style={{
              opacity:
                backgroundStyle?.opacity != null
                  ? backgroundStyle?.opacity / 100
                  : 1,
            }}
          />
        </View>
      )}
      <PressableOpacity onPress={onPress}>
        <View
          style={{
            height: height - marginTop - marginBottom,
            width,
            marginBottom,
            marginTop,
            backgroundColor: buttonColor,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius,
            borderWidth,
            borderColor,
            overflow: 'hidden',
          }}
        >
          <Text
            style={{
              fontFamily,
              color: fontColor,
              fontSize,
            }}
          >
            {buttonLabel}
          </Text>
        </View>
      </PressableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
});
