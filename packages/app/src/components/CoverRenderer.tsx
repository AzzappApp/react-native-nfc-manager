import { forwardRef, memo, useMemo } from 'react';
import { Dimensions, Image, Platform, StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  COVER_BASE_WIDTH,
  COVER_CARD_RADIUS,
  COVER_RATIO,
  LINKS_GAP,
  calculateLinksSize,
  convertToBaseCanvasRatio,
} from '@azzapp/shared/coverHelpers';

import { colors, shadow } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import PressableNative from '#ui/PressableNative';
import { DynamicLinkRenderer } from './CoverEditor/CoverPreview/DynamicLinkRenderer';
import { MediaImageRenderer, MediaVideoRenderer } from './medias';
import type { CoverRenderer_webCard$key } from '#relayArtifacts/CoverRenderer_webCard.graphql';
import type {
  MediaImageRendererHandle,
  MediaVideoRendererHandle,
} from './medias';
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
   * if true, the cover will be displayed in large mode
   * @default false
   */
  large?: boolean;
  /**
   * if true, the cover will play the cover animations if any or the video if any
   * @default false
   */
  canPlay?: boolean;
  /**
   * if true, the cover will play the cover animations if any or the video if any
   * @default false
   */
  paused?: boolean;
  /**
   * A ref to the media renderer of the cover
   */
  mediaRef?: ForwardedRef<MediaImageRendererHandle | MediaVideoRendererHandle>;
  /**
   * If true and if there is a snapshot of the cover media, the snapshot will be displayed
   * during the loading of the media
   */
  useAnimationSnapshot?: boolean;
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
    width = COVER_BASE_WIDTH,
    large,
    style,
    canPlay = false,
    paused = false,
    useAnimationSnapshot,
    mediaRef,
    onReadyForDisplay,
    onError,
  }: CoverRendererProps,
  forwardRef: ForwardedRef<View>,
) => {
  const { cardColors, coverMedia, coverBackgroundColor, coverDynamicLinks } =
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
              uri(width: $screenWidth, pixelRatio: $pixelRatio)
              thumbnail(width: $screenWidth, pixelRatio: $pixelRatio)
              smallThumbnail: thumbnail(
                width: 125
                pixelRatio: $cappedPixelRatio
              )
            }
          }
          coverDynamicLinks {
            links {
              link
              position
              socialId
            }
            color
            size
            position {
              x
              y
            }
            rotation
            shadow
          }
        }
      `,
      coverKey ?? null,
    ) ?? {};

  const { __typename, uri, thumbnail, smallURI, smallThumbnail } =
    coverMedia ?? {};
  const isVideoMedia = __typename === 'MediaVideo';

  //#region Styles and media sources
  const borderRadius: number = large ? 0 : COVER_CARD_RADIUS * width;

  const isSmallCover = width <= COVER_BASE_WIDTH;

  const mediaUri = isSmallCover ? smallURI : uri;

  const requestedSize = useMemo(
    () => (isSmallCover ? COVER_BASE_WIDTH : Dimensions.get('window').width),
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

  const showLinks = coverDynamicLinks && coverDynamicLinks.links.length > 0;

  const height = width / COVER_RATIO;
  const linksSize = useMemo(() => {
    if (!coverDynamicLinks)
      return {
        width: 0,
        height: 0,
      };

    const linksSizePercent = calculateLinksSize(
      coverDynamicLinks.links.length,
      coverDynamicLinks.size,
      {
        viewHeight: height,
        viewWidth: width,
      },
    );

    return {
      width: (linksSizePercent.width * width) / 100,
      height: (linksSizePercent.height * height) / 100,
    };
  }, [coverDynamicLinks, width, height]);

  return (
    <View style={large ? undefined : [{ borderRadius }, styles.shadow]}>
      <View
        ref={forwardRef}
        style={[
          styles.root,
          {
            borderRadius,
            width,
            backgroundColor: swapColor(coverBackgroundColor, cardColors) as any,
            height: width / COVER_RATIO,
          },
          style,
        ]}
        testID="cover-renderer"
      >
        {coverSource ? (
          isVideoMedia ? (
            <MediaVideoRenderer
              ref={mediaRef as any}
              testID="CoverRenderer_media"
              source={coverSource}
              thumbnailURI={isSmallCover ? smallThumbnail : thumbnail}
              onReadyForDisplay={onReadyForDisplay}
              videoEnabled={canPlay}
              onError={onError}
              style={styles.layer}
              paused={paused}
              useAnimationSnapshot={useAnimationSnapshot}
            />
          ) : (
            <MediaImageRenderer
              ref={mediaRef as any}
              testID="CoverRenderer_media"
              source={coverSource}
              onReadyForDisplay={onReadyForDisplay}
              onError={onError}
              style={styles.layer}
              useAnimationSnapshot={useAnimationSnapshot}
            />
          )
        ) : (
          <View
            style={[
              styles.coverPlaceHolder,
              {
                width,
                height: width / COVER_RATIO,
              },
            ]}
          >
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
        {showLinks && (
          <View
            style={{
              flexDirection: 'row',
              position: 'absolute',
              transformOrigin: 'center',
              transform: [
                { rotate: `${coverDynamicLinks.rotation}rad` },
                // Fixes https://github.com/AzzappApp/azzapp/issues/4423 (When a parent element has a rotateY with a value of 0, it creates this bug on Android)
                { rotateY: `${Platform.OS === 'android' ? '0.1' : '0'}deg` },
              ],
              top:
                (coverDynamicLinks.position.y * height) / 100 -
                linksSize.height / 2,
              left:
                (coverDynamicLinks.position.x * width) / 100 -
                linksSize.width / 2,
              gap: convertToBaseCanvasRatio(LINKS_GAP, width),
              zIndex: 1,
            }}
          >
            {coverDynamicLinks.links.map(link => (
              <DynamicLinkRenderer
                key={link.socialId}
                as={large ? PressableNative : View}
                cardColors={cardColors}
                color={coverDynamicLinks.color}
                link={link}
                shadow={coverDynamicLinks.shadow}
                size={coverDynamicLinks.size}
                viewWidth={width}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default memo(forwardRef(CoverRenderer));

const stylesheet = createStyleSheet(theme => ({
  root: {
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
  shadow: {
    ...shadow(theme, 'bottom'),
  },
  layer: StyleSheet.absoluteFillObject,
  coverPlaceHolder: {
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
