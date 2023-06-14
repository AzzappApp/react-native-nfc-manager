import chroma from 'chroma-js';
import { useState, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { graphql, useFragment } from 'react-relay';
import { PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES } from '@azzapp/shared/cardModuleHelpers';
import { colors } from '#theme';
import type {
  PhotoWithTextAndTitleRenderer_module$data,
  PhotoWithTextAndTitleRenderer_module$key,
} from '@azzapp/relay/artifacts/PhotoWithTextAndTitleRenderer_module.graphql';
import type {
  ViewProps,
  LayoutChangeEvent,
  LayoutRectangle,
  ColorValue,
  TextStyle,
} from 'react-native';

export type PhotoWithTextAndTitleRendererProps = ViewProps & {
  /**
   * A relay fragment reference for a PhotoWithTextAndTitle module
   */
  module: PhotoWithTextAndTitleRenderer_module$key;
};

/**
 * Render a PhotoWithTextAndTitle module
 */
const PhotoWithTextAndTitleRenderer = ({
  module,
  ...props
}: PhotoWithTextAndTitleRendererProps) => {
  const data = useFragment(
    graphql`
      fragment PhotoWithTextAndTitleRenderer_module on CardModule
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
        ... on CardModulePhotoWithTextAndTitle {
          image {
            id
            uri(width: $screenWidth, pixelRatio: $pixelRatio)
          }
          aspectRatio
          fontFamily
          fontColor
          textAlign
          imageMargin
          verticalArrangement
          horizontalArrangement
          gap
          fontSize
          textSize
          text
          title
          borderRadius
          marginHorizontal
          marginVertical
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
  return <PhotoWithTextAndTitleRendererRaw data={data} {...props} />;
};

export default PhotoWithTextAndTitleRenderer;

export type PhotoWithTextAndTitleRawData = Omit<
  PhotoWithTextAndTitleRenderer_module$data,
  ' $fragmentType'
>;

type PhotoWithTextAndTitleRendererRawProps = ViewProps & {
  /**
   * The data for the PhotoWithTextAndTitle module
   */
  data: PhotoWithTextAndTitleRawData;
  /**
   * The view mode for the module
   */
  viewMode?: 'desktop' | 'mobile';
};

/**
 * Raw implementation of the PhotoWithTextAndTitle module
 * This component takes the data directly instead of a relay fragment reference
 * Useful for edition preview
 */
export const PhotoWithTextAndTitleRendererRaw = ({
  data,
  style,
  viewMode,
  ...props
}: PhotoWithTextAndTitleRendererRawProps) => {
  const {
    image,
    fontFamily,
    fontColor,
    textAlign,
    text,
    title,
    imageMargin,
    verticalArrangement,
    horizontalArrangement,
    gap,
    fontSize,
    textSize,
    borderRadius,
    marginHorizontal,
    marginVertical,
    verticalSpacing,
    aspectRatio,
    background,
    backgroundStyle,
  } = Object.assign({}, PHOTO_WITH_TEXT_AND_TITLE_DEFAULT_VALUES, data);

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

  const os =
    viewMode === 'desktop'
      ? 'web'
      : viewMode === 'mobile'
      ? 'ios'
      : Platform.OS;

  const widthMargin = (layout?.width ?? 0) - 2 * marginHorizontal;
  const imageWidth =
    os === 'web'
      ? widthMargin / 2
      : imageMargin === 'width_full'
      ? layout?.width ?? 0
      : widthMargin;

  const flexDirection =
    os === 'web'
      ? horizontalArrangement === 'left'
        ? 'row'
        : 'row-reverse'
      : verticalArrangement === 'top'
      ? 'column'
      : 'column-reverse';

  const intl = useIntl();

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
          marginVertical,
          flexDirection,
          rowGap: gap,
          columnGap: gap,
          width: os === 'web' ? widthMargin : layout?.width ?? 0,
          marginHorizontal: os === 'web' ? marginHorizontal : 0,
        }}
      >
        <View
          style={{
            marginHorizontal:
              os === 'web'
                ? 0
                : imageMargin === 'width_full'
                ? 0
                : marginHorizontal,
            width: imageWidth,
            aspectRatio,
            borderRadius,
            overflow: 'hidden',
          }}
        >
          {image && (
            <Image
              source={{ uri: image.uri }}
              style={{
                aspectRatio,
                width: imageWidth,
              }}
              resizeMode="cover"
            />
          )}
        </View>

        <View
          style={{
            width: os === 'web' ? widthMargin / 2 - gap : undefined,
            marginHorizontal: os === 'web' ? 0 : marginHorizontal,
          }}
        >
          <Text
            style={{
              textAlign: textAlign as TextStyle['textAlign'],
              fontSize,
              fontFamily,
              color: fontColor as ColorValue,
            }}
          >
            {title ||
              intl.formatMessage({
                defaultMessage: 'Add section Title here',
                description: 'PhotoWithTextAndTitle default module title',
              })}
          </Text>
          <Text
            style={{
              textAlign: textAlign as TextStyle['textAlign'],
              fontSize: textSize,
              fontFamily,
              marginTop: 7,
              color: fontColor as ColorValue,
              lineHeight:
                fontSize && verticalSpacing
                  ? fontSize * 1.2 + verticalSpacing
                  : undefined,
            }}
          >
            {text ||
              intl.formatMessage({
                defaultMessage:
                  "Add section Text here. To edit this section, simply open the editor and start typing. You can change the font style, size, color, and alignment using the editing tools provided. Adjust the margins and the background for this section to match your webcard's design and branding.",
                description: 'PhotoWithTextAndTitle default module text',
              })}
          </Text>
        </View>
      </View>
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
