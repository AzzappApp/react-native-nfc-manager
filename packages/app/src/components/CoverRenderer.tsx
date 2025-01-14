import { forwardRef, memo, useMemo } from 'react';
import { Dimensions, Image, Platform, View, Text } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  COVER_BASE_WIDTH,
  COVER_CARD_RADIUS,
  COVER_RATIO,
  DEFAULT_COVER_HEIGHT,
  DEFAULT_COVER_WIDTH,
  LINKS_GAP,
  calculateLinksSize,
  convertToBaseCanvasRatio,
} from '@azzapp/shared/coverHelpers';

import { colors, fontFamilies, shadow } from '#theme';
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

// define the minimum cover width to allow displaying test on predefined covers
const MIN_WIDTH_TO_DISPLAY_COVER_TEXT = 50;

/**
 * Renders a card cover
 */
const CoverRenderer = (
  {
    webCard: coverKey,
    width = 125,
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
  const {
    cardColors,
    coverMedia,
    coverBackgroundColor,
    coverDynamicLinks,
    coverIsPredefined,
    firstName,
    lastName,
    companyName,
    companyActivityLabel,
    webCardKind,
  } =
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
          coverIsPredefined
          firstName
          lastName
          companyName
          companyActivityLabel
          webCardKind
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
  const containerStyle = useMemo(
    () => [
      styles.root,
      {
        borderRadius,
        width,
        backgroundColor: swapColor(coverBackgroundColor, cardColors) as any,
      },
      style,
    ],
    [styles.root, borderRadius, width, coverBackgroundColor, cardColors, style],
  );

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

  const shadowStyle = useMemo(
    () => [{ borderRadius }, styles.shadow],
    [borderRadius, styles.shadow],
  );

  // To have correct font scalling we need to render on a 375x600 surface and resize it to match cover displayed
  // No need to render it on small thumbnails
  const validSizeForText = width > MIN_WIDTH_TO_DISPLAY_COVER_TEXT;
  const overlayTitle =
    coverIsPredefined && validSizeForText
      ? webCardKind === 'business'
        ? companyName
        : firstName
      : undefined;

  const overlaySubTitle =
    coverIsPredefined && validSizeForText
      ? webCardKind === 'business'
        ? companyActivityLabel
        : lastName
      : undefined;

  const textScale = width / DEFAULT_COVER_WIDTH;
  const textTranslateX = -(DEFAULT_COVER_WIDTH - width) / 2;
  const textTranslateY = -(DEFAULT_COVER_HEIGHT - width / COVER_RATIO) / 2;

  return (
    <View style={large ? undefined : shadowStyle}>
      <View ref={forwardRef} style={containerStyle} testID="cover-renderer">
        {coverSource ? (
          <>
            {isVideoMedia ? (
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
            )}
            {(overlayTitle || overlaySubTitle) && (
              <View
                style={[
                  styles.coverOverlay,
                  {
                    transform: [
                      { translateX: textTranslateX },
                      { translateY: textTranslateY },
                      { scale: textScale },
                    ],
                  },
                ]}
              >
                {overlayTitle && (
                  <Text
                    style={styles.overlayTitle}
                    numberOfLines={1}
                    allowFontScaling
                  >
                    {overlayTitle}
                  </Text>
                )}
                {overlaySubTitle && (
                  <Text
                    style={styles.overlaySubTitle}
                    numberOfLines={1}
                    allowFontScaling
                  >
                    {overlaySubTitle}
                  </Text>
                )}
              </View>
            )}
          </>
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
                key={`${link.socialId}${link.position}`}
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
    aspectRatio: COVER_RATIO,
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
  shadow: {
    ...shadow(theme, 'bottom'),
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
  coverOverlay: {
    position: 'absolute',
    width: DEFAULT_COVER_WIDTH,
    height: DEFAULT_COVER_HEIGHT,
  },
  overlayTitle: {
    ...fontFamilies.regular,
    color: colors.white,
    top: '44.8%',
    left: '22%',
    width: '70%',
    fontSize: 19,
  },
  overlaySubTitle: {
    ...fontFamilies.extrabold,
    color: colors.white,
    top: '45%',
    width: '70%',
    left: '22%',
    fontSize: 27,
  },
}));
