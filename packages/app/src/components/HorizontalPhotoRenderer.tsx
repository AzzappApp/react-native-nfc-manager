import chroma from 'chroma-js';
import { useState, useCallback } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { graphql, useFragment } from 'react-relay';
import { HORIZONTAL_PHOTO_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import { colors } from '#theme';
import type {
  HorizontalPhotoRenderer_module$data,
  HorizontalPhotoRenderer_module$key,
} from '@azzapp/relay/artifacts/HorizontalPhotoRenderer_module.graphql';
import type {
  ViewProps,
  LayoutChangeEvent,
  LayoutRectangle,
} from 'react-native';

export type HorizontalPhotoRendererProps = ViewProps & {
  /**
   * A relay fragment reference for a HorizontalPhoto module
   */
  module: HorizontalPhotoRenderer_module$key;
};

/**
 * Render a HorizontalPhoto module
 */
const HorizontalPhotoRenderer = ({
  module,
  ...props
}: HorizontalPhotoRendererProps) => {
  const data = useFragment(
    graphql`
      fragment HorizontalPhotoRenderer_module on CardModule
      @argumentDefinitions(
        screenWidth: {
          type: "Float!"
          provider: "../providers/ScreenWidth.relayprovider"
        }
        pixelRatio: {
          type: "Float!"
          provider: "../providers/PixelRatio.relayprovider"
        }
      ) {
        id
        ... on CardModuleHorizontalPhoto {
          borderWidth
          borderRadius
          borderColor
          marginHorizontal
          marginVertical
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
          image {
            id
            uri(width: $screenWidth, pixelRatio: $pixelRatio)
          }
        }
      }
    `,
    module,
  );

  return <HorizontalPhotoRendererRaw data={data} {...props} />;
};

export default HorizontalPhotoRenderer;

export type HorizontalPhotoRawData = Omit<
  HorizontalPhotoRenderer_module$data,
  ' $fragmentType'
>;

type HorizontalPhotoRendererRawProps = ViewProps & {
  /**
   * The data for the HorizontalPhoto module
   */
  data: HorizontalPhotoRawData;
};

/**
 * Raw implementation of the HorizontalPhoto module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
export const HorizontalPhotoRendererRaw = ({
  data,
  style,
  ...props
}: HorizontalPhotoRendererRawProps) => {
  const {
    borderWidth,
    borderRadius,
    borderColor,
    marginHorizontal,
    marginVertical,
    height,
    background,
    backgroundStyle,
    image,
  } = Object.assign({}, HORIZONTAL_PHOTO_DEFAULT_VALUES, data);

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
      style={[style, { backgroundColor, height: height + 2 * marginVertical }]}
      onLayout={onLayout}
    >
      {background && (
        <View style={styles.background} pointerEvents="none">
          <SvgUri
            uri={background.uri}
            color={backgroundStyle?.patternColor ?? '#000'}
            width={layout?.width ?? 0}
            height={height + 2 * marginVertical}
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
      {image?.uri && (
        <View
          style={{
            height,
            borderWidth,
            borderRadius,
            marginHorizontal,
            marginVertical,
            borderColor,
            width: (layout?.width ?? 0) - 2 * marginHorizontal,
            overflow: 'hidden',
          }}
        >
          <Image
            source={{ uri: image.uri }}
            style={{ flex: 1 }}
            resizeMode="cover"
          />
        </View>
      )}
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
