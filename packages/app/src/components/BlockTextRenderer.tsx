import chroma from 'chroma-js';
import { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { graphql, useFragment } from 'react-relay';
import { BLOCK_TEXT_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import { colors } from '#theme';
import Text from '#ui/Text';
import type {
  BlockTextRenderer_module$data,
  BlockTextRenderer_module$key,
} from '@azzapp/relay/artifacts/BlockTextRenderer_module.graphql';
import type {
  ViewProps,
  LayoutChangeEvent,
  LayoutRectangle,
  ColorValue,
} from 'react-native';

export type BlockTextRendererProps = ViewProps & {
  /**
   * A relay fragment reference for a BlockText module
   */
  module: BlockTextRenderer_module$key;
};

/**
 * Render a BlockText module
 */
const BlockTextRenderer = ({ module, ...props }: BlockTextRendererProps) => {
  const data = useFragment(
    graphql`
      fragment BlockTextRenderer_module on CardModule {
        id
        ... on CardModuleBlockText {
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
  return <BlockTextRendererRaw data={data} {...props} />;
};

export default BlockTextRenderer;

export type BlockTextRawData = Omit<
  BlockTextRenderer_module$data,
  ' $fragmentType'
>;

type BlockTextRendererRawProps = ViewProps & {
  /**
   * The data for the BlockText module
   */
  data: BlockTextRawData;
};

/**
 * Raw implementation of the BlockText module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
export const BlockTextRendererRaw = ({
  data,
  style,
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
  } = Object.assign({}, BLOCK_TEXT_DEFAULT_VALUES, data);

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

  const textBackgroundColor = textBackgroundStyle
    ? chroma(textBackgroundStyle.backgroundColor)
        .alpha(textBackgroundStyle.opacity / 100)
        .hex()
    : colors.white;

  return (
    <View {...props} style={[style, { backgroundColor }]} onLayout={onLayout}>
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

      <View
        style={{
          marginVertical: 2 * marginVertical,
          marginHorizontal: 2 * marginHorizontal,
          backgroundColor: textBackgroundColor,
        }}
        pointerEvents="none"
      >
        {textBackground && (
          <View
            style={[styles.background, { flex: 1, overflow: 'hidden' }]}
            pointerEvents="none"
          >
            <SvgUri
              uri={textBackground.uri}
              color={textBackgroundStyle?.patternColor ?? '#000'}
              width={(layout?.width ?? 0) - 2 * marginHorizontal}
              height={layout?.height ?? 0 - 2 * marginVertical}
              preserveAspectRatio="xMidYMid slice"
              style={{
                opacity:
                  textBackgroundStyle?.opacity != null
                    ? textBackgroundStyle?.opacity / 100
                    : 1,
              }}
            />
          </View>
        )}
        <Text
          style={{
            paddingHorizontal: 2 * textMarginHorizontal,
            paddingVertical: 2 * textMarginVertical,
            textAlign,
            color: fontColor as ColorValue,
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
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1,
  },
});
