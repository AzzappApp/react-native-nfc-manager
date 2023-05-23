import chroma from 'chroma-js';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { graphql, useFragment } from 'react-relay';
import { SIMPLE_TEXT_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import { colors } from '#theme';
import type {
  SimpleTextRenderer_module$data,
  SimpleTextRenderer_module$key,
} from '@azzapp/relay/artifacts/SimpleTextRenderer_module.graphql';
import type {
  ViewProps,
  ColorValue,
  LayoutChangeEvent,
  LayoutRectangle,
} from 'react-native';

export type SimpleTextRendererProps = ViewProps & {
  /**
   * A relay fragment reference for a simple text module
   */
  module: SimpleTextRenderer_module$key;
};

/**
 * Render a simple text module
 */
const SimpleTextRenderer = ({ module, ...props }: SimpleTextRendererProps) => {
  const data = useFragment(
    graphql`
      fragment SimpleTextRenderer_module on CardModule {
        ... on CardModuleSimpleText {
          text
          fontFamily
          fontSize
          color
          textAlign
          verticalSpacing
          marginHorizontal
          marginVertical
          background {
            uri
          }
          backgroundStyle {
            backgroundColor
            patternColor
            opacity
          }
        }
        ... on CardModuleSimpleTitle {
          text
          fontFamily
          fontSize
          color
          textAlign
          verticalSpacing
          marginHorizontal
          marginVertical
          background {
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
  return <SimpleTextRendererRaw data={data} {...props} />;
};

export default SimpleTextRenderer;

export type SimpleTextRawData = Omit<
  SimpleTextRenderer_module$data,
  ' $fragmentType'
>;

type SimpleTextRendererRawProps = ViewProps & {
  /**
   * The data for the simple text module
   */
  data: SimpleTextRawData;
};

/**
 * Raw implementation of the simple text module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
export const SimpleTextRendererRaw = ({
  data,
  style,
  ...props
}: SimpleTextRendererRawProps) => {
  const {
    text,
    fontFamily,
    fontSize,
    textAlign,
    color,
    verticalSpacing,
    marginHorizontal,
    marginVertical,
    background,
    backgroundStyle,
  } = Object.assign({}, SIMPLE_TEXT_DEFAULT_VALUES, data);

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

  return (
    <View
      {...props}
      style={[
        {
          paddingHorizontal: marginHorizontal,
          paddingVertical: marginVertical,
          flexShrink: 0,
          opacity: layout ? 1 : 0,
        },
        { backgroundColor },
        style,
      ]}
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
              opacity: backgroundStyle?.opacity
                ? backgroundStyle?.opacity / 100
                : 1,
            }}
          />
        </View>
      )}
      <Text
        style={{
          textAlign,
          color: color as ColorValue,
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
