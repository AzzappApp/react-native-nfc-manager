import { forwardRef, memo, useCallback, useMemo, useRef } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { DEFAULT_COLOR_PALETTE, swapColor } from '@azzapp/shared/cardHelpers';
import {
  COVER_BASE_WIDTH,
  COVER_CARD_RADIUS,
  COVER_RATIO,
  textOrientationOrDefaut,
  textPositionOrDefaut,
} from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import { MediaImageRenderer, MediaVideoRenderer } from '../medias';
import CoverTextRenderer from './CoverTextRenderer';
import type { CoverRenderer_profile$key } from '@azzapp/relay/artifacts/CoverRenderer_profile.graphql';
import type { ForwardedRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type CoverRendererProps = {
  /**
   * The relay reference to the cover
   */
  profile: CoverRenderer_profile$key | null | undefined;
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
   * if true, the cover will play the cover video (if the cover media is a video)
   * Should be also set on the fragment definition
   * @default false
   */
  videoEnabled?: boolean;
  /**
   * Called when the cover is ready for display,
   * which means both the media and the text are ready for display,
   * even if the size of the downloaded image is different from the size of the cover
   */
  onReadyForDisplay?: () => void;
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
    profile: coverKey,
    width = 125,
    hideBorderRadius,
    style,
    videoEnabled,
    onReadyForDisplay,
  }: CoverRendererProps,
  forwardRef: ForwardedRef<View>,
) => {
  //#region Data
  const { cardColors, cardCover } =
    useFragment(
      graphql`
        fragment CoverRenderer_profile on Profile
        @argumentDefinitions(
          screenWidth: {
            type: "Float!"
            provider: "../providers/ScreenWidth.relayprovider"
          }
          pixelRatio: {
            type: "Float!"
            provider: "../providers/PixelRatio.relayprovider"
          }
          cappedPixelRatio: {
            type: "Float!"
            provider: "../providers/CappedPixelRatio.relayprovider"
          }
        ) {
          cardColors {
            primary
            dark
            light
          }
          cardCover {
            media {
              id
              __typename
              uri(width: $screenWidth, pixelRatio: $pixelRatio)
              smallURI: uri(width: 125, pixelRatio: $cappedPixelRatio)
              ... on MediaVideo {
                thumbnail(width: $screenWidth, pixelRatio: $pixelRatio)
                smallThumbnail: thumbnail(
                  width: 125
                  pixelRatio: $cappedPixelRatio
                )
              }
            }
            foreground {
              id
              largeURI: uri(width: $screenWidth, pixelRatio: $pixelRatio)
              smallURI: uri(width: 125, pixelRatio: $cappedPixelRatio)
            }
            foregroundColor
            background {
              id
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
          }
        }
      `,
      coverKey ?? null,
    ) ?? {};
  //#endregion

  //#region Ready states
  // We need to wait for both the media and the text to be ready for display
  // before calling the onReadyForDisplay callback, however, we need to
  // redispatch it when the cover changes
  const readyStates = useRef({
    media: false,
    foreground: false,
    background: false,
  });

  const sources = useRef({
    media: cardCover?.media?.id,
    foreground: cardCover?.foreground?.id,
    background: cardCover?.background?.id,
  });

  if (sources.current.media !== cardCover?.media?.id) {
    readyStates.current.media = false;
    sources.current.media = cardCover?.media?.id;
  }
  if (!sources.current.background) {
    readyStates.current.background = true;
  } else if (sources.current.background !== cardCover?.background?.id) {
    readyStates.current.background = false;
    sources.current.background = cardCover?.background?.id;
  }

  if (!sources.current.foreground) {
    readyStates.current.foreground = true;
  } else if (sources.current.foreground !== cardCover?.foreground?.id) {
    readyStates.current.foreground = false;
    sources.current.foreground = cardCover?.foreground?.id;
  }

  const onMediaReadyForDisplay = useCallback(() => {
    readyStates.current.media = true;
    if (readyStates.current.foreground && readyStates.current.background) {
      onReadyForDisplay?.();
    }
  }, [onReadyForDisplay]);

  const onForegroundReadyForDisplay = useCallback(() => {
    readyStates.current.foreground = true;
    if (readyStates.current.media && readyStates.current.background) {
      onReadyForDisplay?.();
    }
  }, [onReadyForDisplay]);

  const onBackgroundReadyForDisplay = useCallback(() => {
    readyStates.current.background = true;
    if (readyStates.current.media && readyStates.current.foreground) {
      onReadyForDisplay?.();
    }
  }, [onReadyForDisplay]);
  //#endregion

  //#region Styles
  const borderRadius: number = hideBorderRadius ? 0 : COVER_CARD_RADIUS * width;

  const {
    media,
    title,
    titleStyle,
    subTitle,
    subTitleStyle,
    textOrientation,
    textPosition,
    foreground,
    foregroundColor,
    background,
    backgroundColor,
    backgroundPatternColor,
  } = cardCover ?? {};

  //#endregion

  const { __typename, uri, thumbnail, smallURI, smallThumbnail } = media ?? {};
  const isSmallCover = width <= COVER_BASE_WIDTH;
  const isVideoMedia = __typename === 'MediaVideo';

  const mediaUri = isSmallCover ? smallURI : uri;

  const requestedSize = useMemo(
    () => (isSmallCover ? COVER_BASE_WIDTH : Dimensions.get('window').width),
    [isSmallCover],
  );

  const backgroundSource = useMemo(
    () =>
      background?.id && {
        uri: isSmallCover ? background.smallURI : background.largeURI,
        mediaId: background.id,
        requestedSize,
      },
    [
      isSmallCover,
      background?.smallURI,
      background?.largeURI,
      background?.id,
      requestedSize,
    ],
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

  const foregroundSource = useMemo(
    () =>
      foreground?.id
        ? {
            uri: isSmallCover ? foreground.smallURI : foreground.largeURI,
            mediaId: foreground.id,
            requestedSize,
          }
        : null,
    [
      isSmallCover,
      foreground?.smallURI,
      foreground?.largeURI,
      foreground?.id,
      requestedSize,
    ],
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

  return (
    <View ref={forwardRef} style={containerStyle} testID="cover-renderer">
      {coverSource ? (
        <>
          {backgroundSource && (
            <MediaImageRenderer
              testID="CoverRenderer_background"
              source={backgroundSource}
              tintColor={swapColor(backgroundPatternColor, cardColors)}
              onReadyForDisplay={onBackgroundReadyForDisplay}
              style={styles.layer}
            />
          )}
          {isVideoMedia ? (
            <MediaVideoRenderer
              testID="CoverRenderer_media"
              source={coverSource}
              thumbnailURI={isSmallCover ? smallThumbnail : thumbnail}
              onReadyForDisplay={onMediaReadyForDisplay}
              style={styles.layer}
              videoEnabled={videoEnabled}
            />
          ) : (
            <MediaImageRenderer
              testID="CoverRenderer_media"
              source={coverSource}
              onReadyForDisplay={onMediaReadyForDisplay}
              style={styles.layer}
            />
          )}
          {foregroundSource && (
            <MediaImageRenderer
              testID="CoverRenderer_foreground"
              source={foregroundSource}
              tintColor={swapColor(foregroundColor, cardColors)}
              onReadyForDisplay={onForegroundReadyForDisplay}
              style={styles.layer}
            />
          )}
          <CoverTextRenderer
            title={title}
            subTitle={subTitle}
            textOrientation={textOrientationOrDefaut(textOrientation)}
            textPosition={textPositionOrDefaut(textPosition)}
            titleStyle={titleStyle}
            subTitleStyle={subTitleStyle}
            colorPalette={cardColors ?? DEFAULT_COLOR_PALETTE}
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
  );
};

export default memo(forwardRef(CoverRenderer));

const styles = StyleSheet.create({
  root: {
    aspectRatio: COVER_RATIO,
    overflow: 'hidden',
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
