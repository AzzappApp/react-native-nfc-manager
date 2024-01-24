import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { graphql, useFragment } from 'react-relay';
import { DEFAULT_COLOR_PALETTE, swapColor } from '@azzapp/shared/cardHelpers';
import {
  COVER_ANIMATION_DURATION,
  COVER_BASE_WIDTH,
  COVER_CARD_RADIUS,
  COVER_RATIO,
  textOrientationOrDefault,
  textPositionOrDefault,
} from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import useLatestCallback from '#hooks/useLatestCallback';
import { MediaImageRenderer, MediaVideoRenderer } from '../medias';
import CoverStaticMediaLayer from './CoverStaticMediaLayer';
import CoverTextRenderer from './CoverTextRenderer';
import MediaAnimator from './MediaAnimator';
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
  //#region Data
  const { cardColors, cardCover } =
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
          cardCover {
            media {
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
            foreground {
              id
              kind
              largeURI: uri(width: $screenWidth, pixelRatio: $pixelRatio)
              smallURI: uri(width: 125, pixelRatio: $cappedPixelRatio)
            }
            foregroundColor
            background {
              id
              kind
              largeURI: uri(width: $screenWidth, pixelRatio: $pixelRatio)
              smallURI: uri(width: 125, pixelRatio: $cappedPixelRatio)
            }
            backgroundColor
            backgroundPatternColor
            title
            titleStyle {
              color
              fontFamily
              fontSize
            }
            subTitle
            subTitleStyle {
              color
              fontFamily
              fontSize
            }
            textOrientation
            textPosition
            textAnimation
            mediaAnimation
          }
        }
      `,
      coverKey ?? null,
    ) ?? {};

  const {
    media,
    mediaAnimation,
    title,
    titleStyle,
    subTitle,
    subTitleStyle,
    textOrientation,
    textPosition,
    textAnimation,
    foreground,
    foregroundColor,
    background,
    backgroundColor,
    backgroundPatternColor,
  } = cardCover ?? {};

  const { __typename, uri, thumbnail, smallURI, smallThumbnail } = media ?? {};

  const mediaId = media?.id ?? null;
  const foregroundId = foreground?.id ?? null;
  const backgroundId = background?.id ?? null;
  const isVideoMedia = __typename === 'MediaVideo';

  //#endregion

  //#region States

  const mediaLoadingStates = useRef({
    mediaLoading: mediaId != null,
    foregroundLoading: foregroundId != null,
    backgroundLoading: backgroundId != null,
  });

  const [readyForDisplay, setReadyForDisplay] = useState(
    mediaId == null && foregroundId == null && backgroundId == null,
  );
  const [textAnimationReady, setTextAnimationReady] = useState(
    !title && !subTitle,
  );
  const [videoReady, setVideoReady] = useState(!isVideoMedia);

  const animationSharedValue = useSharedValue(0);

  const prevData = useRef({
    mediaId,
    foregroundId,
    backgroundId,
    title,
    subTitle,
  });

  const {
    current: {
      mediaId: prevMediaId,
      foregroundId: prevForegroundId,
      backgroundId: prevBackgroundId,
      title: prevTitle,
      subTitle: prevSubTitle,
    },
  } = prevData;

  if (prevMediaId !== mediaId) {
    prevData.current.mediaId = mediaId;
    mediaLoadingStates.current.mediaLoading = mediaId != null;
  }

  if (prevForegroundId !== foregroundId) {
    prevData.current.foregroundId = foregroundId;
    mediaLoadingStates.current.foregroundLoading = foregroundId != null;
  }

  if (prevBackgroundId !== backgroundId) {
    prevData.current.backgroundId = backgroundId;
    mediaLoadingStates.current.backgroundLoading = backgroundId != null;
  }

  if (prevTitle !== title || prevSubTitle !== subTitle) {
    prevData.current.title = title;
    prevData.current.subTitle = subTitle;
    setTextAnimationReady(title === null && subTitle === null);
  }

  const onReadyForDisplayLatest = useLatestCallback(onReadyForDisplay);
  const mediasReadyHandler = useCallback(() => {
    const { mediaLoading, foregroundLoading, backgroundLoading } =
      mediaLoadingStates.current;
    if (!mediaLoading && !foregroundLoading && !backgroundLoading) {
      setReadyForDisplay(true);
      onReadyForDisplayLatest?.();
    }
  }, [onReadyForDisplayLatest]);

  useEffect(() => {
    // on the first render of empty cover, we need to dispatch the ready event
    mediasReadyHandler();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMediaReadyForDisplay = useCallback(() => {
    mediaLoadingStates.current.mediaLoading = false;
    mediasReadyHandler();
  }, [mediasReadyHandler]);

  const onForegroundReadyForDisplay = useCallback(() => {
    mediaLoadingStates.current.foregroundLoading = false;
    mediasReadyHandler();
  }, [mediasReadyHandler]);

  const onBackgroundReadyForDisplay = useCallback(() => {
    mediaLoadingStates.current.backgroundLoading = false;
    mediasReadyHandler();
  }, [mediasReadyHandler]);

  const onTextReadyToAnimate = useCallback(() => {
    setTextAnimationReady(true);
  }, []);

  const onVideoReady = useCallback(() => {
    setVideoReady(true);
  }, []);

  const onVideoProgress = useCallback(
    (event: { currentTime: number; duration: number }) => {
      const { currentTime, duration } = event;
      if (animationEnabled) {
        animationSharedValue.value = withTiming(
          currentTime / duration + 0.1 / duration,
          {
            duration: 100,
            easing: Easing.linear,
          },
        );
      }
    },
    [animationEnabled, animationSharedValue],
  );

  const onVideoEnd = useCallback(() => {
    if (animationEnabled) {
      animationSharedValue.value = 0;
    }
  }, [animationEnabled, animationSharedValue]);

  useEffect(() => {
    if (readyForDisplay && textAnimationReady && videoReady) {
      animationSharedValue.value = 0;
      if (animationEnabled) {
        // we setup the animations even for the video cover
        // to avoid flickering of the animation due to the delay
        // of inProgress event on the first frames
        animationSharedValue.value = withRepeat(
          withTiming(1, {
            duration: COVER_ANIMATION_DURATION,
            easing: Easing.linear,
          }),
          -1,
          false,
        );
      }
    }
  }, [
    animationEnabled,
    animationSharedValue,
    readyForDisplay,
    textAnimationReady,
    videoReady,
  ]);
  //#endregion

  //#region Styles and media sources
  const borderRadius: number = hideBorderRadius ? 0 : COVER_CARD_RADIUS * width;

  const isSmallCover = width <= COVER_BASE_WIDTH;

  const mediaUri = isSmallCover ? smallURI : uri;

  const requestedSize = useMemo(
    () => (isSmallCover ? COVER_BASE_WIDTH : Dimensions.get('window').width),
    [isSmallCover],
  );

  const coverSource = useMemo(
    () =>
      mediaUri && media?.id
        ? {
            uri: mediaUri,
            requestedSize,
            mediaId: media?.id,
          }
        : null,
    [mediaUri, requestedSize, media?.id],
  );

  const containerStyle = useMemo(
    () => [
      styles.root,
      {
        borderRadius,
        width,
        backgroundColor: swapColor(backgroundColor, cardColors) as any,
      },
      style,
    ],
    [borderRadius, width, backgroundColor, cardColors, style],
  );
  //#endregion

  return useMemo(
    () => (
      <View ref={forwardRef} style={containerStyle} testID="cover-renderer">
        {coverSource ? (
          <>
            {background && (
              <CoverStaticMediaLayer
                testID="CoverRenderer_background"
                mediaId={background.id}
                requestedSize={requestedSize}
                kind={background.kind}
                uri={isSmallCover ? background.smallURI : background.largeURI}
                tintColor={swapColor(backgroundPatternColor, cardColors)}
                onReady={onBackgroundReadyForDisplay}
                onError={onError}
                animationSharedValue={
                  animationEnabled ? animationSharedValue : null
                }
                style={styles.layer}
              />
            )}
            <MediaAnimator
              animationSharedValue={
                animationEnabled ? animationSharedValue : null
              }
              animation={mediaAnimation}
              width={width}
              height={width / COVER_RATIO}
              style={styles.layer}
            >
              {isVideoMedia ? (
                <MediaVideoRenderer
                  testID="CoverRenderer_media"
                  source={coverSource}
                  thumbnailURI={isSmallCover ? smallThumbnail : thumbnail}
                  onReadyForDisplay={onMediaReadyForDisplay}
                  onVideoReady={onVideoReady}
                  videoEnabled={animationEnabled}
                  onProgress={onVideoProgress}
                  onEnd={onVideoEnd}
                  onError={onError}
                  style={styles.layer}
                  paused={
                    !animationEnabled ||
                    !readyForDisplay ||
                    !textAnimationReady ||
                    !videoReady
                  }
                />
              ) : (
                <MediaImageRenderer
                  testID="CoverRenderer_media"
                  source={coverSource}
                  onReadyForDisplay={onMediaReadyForDisplay}
                  onError={onError}
                  style={styles.layer}
                />
              )}
            </MediaAnimator>
            {foreground && (
              <CoverStaticMediaLayer
                testID="CoverRenderer_foreground"
                mediaId={foreground.id}
                requestedSize={requestedSize}
                kind={foreground.kind}
                uri={isSmallCover ? foreground.smallURI : foreground.largeURI}
                tintColor={swapColor(foregroundColor, cardColors)}
                onReady={onForegroundReadyForDisplay}
                onError={onError}
                animationSharedValue={
                  animationEnabled ? animationSharedValue : null
                }
                style={styles.layer}
              />
            )}
            <CoverTextRenderer
              title={title}
              subTitle={subTitle}
              textOrientation={textOrientationOrDefault(textOrientation)}
              textPosition={textPositionOrDefault(textPosition)}
              textAnimation={textAnimation}
              titleStyle={titleStyle}
              subTitleStyle={subTitleStyle}
              colorPalette={cardColors ?? DEFAULT_COLOR_PALETTE}
              animationSharedValue={
                animationEnabled ? animationSharedValue : null
              }
              onReadyToAnimate={onTextReadyToAnimate}
              height={width / COVER_RATIO}
            />
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
      </View>
    ),
    [
      animationEnabled,
      animationSharedValue,
      background,
      backgroundPatternColor,
      cardColors,
      containerStyle,
      coverSource,
      foreground,
      foregroundColor,
      forwardRef,
      isSmallCover,
      isVideoMedia,
      mediaAnimation,
      onBackgroundReadyForDisplay,
      onError,
      onForegroundReadyForDisplay,
      onMediaReadyForDisplay,
      onTextReadyToAnimate,
      onVideoEnd,
      onVideoProgress,
      onVideoReady,
      readyForDisplay,
      requestedSize,
      smallThumbnail,
      subTitle,
      subTitleStyle,
      textAnimation,
      textAnimationReady,
      textOrientation,
      textPosition,
      thumbnail,
      title,
      titleStyle,
      videoReady,
      width,
    ],
  );
};

export default forwardRef(CoverRenderer);

const styles = StyleSheet.create({
  root: {
    aspectRatio: COVER_RATIO,
    overflow: 'hidden',
    borderCurve: 'continuous',
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
});
