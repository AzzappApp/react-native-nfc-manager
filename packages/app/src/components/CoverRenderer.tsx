import { forwardRef, useMemo } from 'react';
import { Dimensions, Image, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  COVER_BASE_WIDTH,
  COVER_CARD_RADIUS,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { MediaImageRenderer, MediaVideoRenderer } from './medias';
import type { CoverRenderer_webCard$key } from '#relayArtifacts/CoverRenderer_webCard.graphql';
import type { ForwardedRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type CoverRendererProps = {
  /**
   * The relay reference to the cover
   */
  webCard: CoverRenderer_webCard$key | null | undefined;
  /**
   * The width of the displayed cover
   */
  width?: number;
  /**
   * if true, the cover will not have rounded corners
   * @default false
   */
  hideBorderRadius?: boolean;
  /**
   * if true, the cover will play the cover animations if any or the video if any
   * @default false
   */
  animationEnabled?: boolean;
  /**
   * Called when the cover is ready for display,
   * which means both the media and the text are ready for display,
   * even if the size of the downloaded image is different from the size of the cover
   */
  onReadyForDisplay?: () => void;
  /**
   * Error handler for the cover
   */
  onError?: (error: any) => void;
  /**
   * The style of the cover container
   */
  style?: StyleProp<ViewStyle>;
};

/**
 * Renders a card cover
 */
const CoverRenderer = (
  {
    webCard: coverKey,
    width = 125,
    hideBorderRadius,
    style,
    animationEnabled,
    onReadyForDisplay,
    onError,
  }: CoverRendererProps,
  forwardRef: ForwardedRef<View>,
) => {
  const { cardColors, coverMedia, coverBackgroundColor } =
    useFragment(
      graphql`
        fragment CoverRenderer_webCard on WebCard
        @argumentDefinitions(
          screenWidth: { type: "Float!", provider: "ScreenWidth.relayprovider" }
          pixelRatio: { type: "Float!", provider: "PixelRatio.relayprovider" }
          cappedPixelRatio: {
            type: "Float!"
            provider: "CappedPixelRatio.relayprovider"
          }
          isAndroid: { type: "Boolean!", provider: "isAndroid.relayprovider" }
        ) {
          id
          cardColors {
            primary
            dark
            light
          }
          coverBackgroundColor
          coverMedia {
            id
            __typename
            smallURI: uri(width: 125, pixelRatio: $cappedPixelRatio)
            ... on MediaImage {
              uri(width: $screenWidth, pixelRatio: $pixelRatio)
            }
            ... on MediaVideo {
              uri(
                width: $screenWidth
                pixelRatio: $pixelRatio
                streaming: $isAndroid
              )
              thumbnail(width: $screenWidth, pixelRatio: $pixelRatio)
              smallThumbnail: thumbnail(
                width: 125
                pixelRatio: $cappedPixelRatio
              )
            }
          }
        }
      `,
      coverKey ?? null,
    ) ?? {};

  const { __typename, uri, thumbnail, smallURI, smallThumbnail } =
    coverMedia ?? {};
  const isVideoMedia = __typename === 'MediaVideo';

  //#region Styles and media sources
  const borderRadius: number = hideBorderRadius ? 0 : COVER_CARD_RADIUS * width;

  const isSmallCover = width <= COVER_BASE_WIDTH;

  const mediaUri = isSmallCover ? smallURI : uri;

  const requestedSize = useMemo(
    () => (isSmallCover ? COVER_BASE_WIDTH : Dimensions.get('screen').width),
    [isSmallCover],
  );

  const coverSource = useMemo(
    () =>
      mediaUri && coverMedia?.id
        ? {
            uri: mediaUri,
            requestedSize,
            mediaId: coverMedia?.id,
          }
        : null,
    [mediaUri, coverMedia?.id, requestedSize],
  );

  const styles = useStyleSheet(stylesheet);
  const containerStyle = useMemo(
    () => [
      styles.root,
      {
        borderRadius,
        width,
        backgroundColor: swapColor(coverBackgroundColor, cardColors) as any,
      },
      styles.shadow,
      style,
    ],
    [
      styles.root,
      styles.shadow,
      borderRadius,
      width,
      coverBackgroundColor,
      cardColors,
      style,
    ],
  );

  return useMemo(
    () => (
      <View ref={forwardRef} style={containerStyle} testID="cover-renderer">
        {coverSource ? (
          isVideoMedia ? (
            <MediaVideoRenderer
              testID="CoverRenderer_media"
              source={coverSource}
              thumbnailURI={isSmallCover ? smallThumbnail : thumbnail}
              onReadyForDisplay={onReadyForDisplay}
              videoEnabled={animationEnabled}
              onError={onError}
              style={styles.layer}
              paused={!animationEnabled}
            />
          ) : (
            <MediaImageRenderer
              testID="CoverRenderer_media"
              source={coverSource}
              onReadyForDisplay={onReadyForDisplay}
              onError={onError}
              style={styles.layer}
            />
          )
        ) : (
          <View style={styles.coverPlaceHolder}>
            <Image
              source={require('#assets/webcard/logo-substract-full.png')}
              style={{
                width: width / 2,
                height: width / 2,
              }}
              resizeMode="contain"
            />
          </View>
        )}
      </View>
    ),
    [
      animationEnabled,
      containerStyle,
      coverSource,
      forwardRef,
      isSmallCover,
      isVideoMedia,
      onError,
      onReadyForDisplay,
      smallThumbnail,
      styles.coverPlaceHolder,
      styles.layer,
      thumbnail,
      width,
    ],
  );
};

export default forwardRef(CoverRenderer);

const stylesheet = createStyleSheet(theme => ({
  root: {
    aspectRatio: COVER_RATIO,
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
  shadow: {
    ...shadow(theme, 'center'),
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    aspectRatio: COVER_RATIO,
  },
  coverPlaceHolder: {
    backgroundColor: colors.black,
    aspectRatio: COVER_RATIO,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
