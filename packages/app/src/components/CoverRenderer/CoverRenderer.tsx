import { forwardRef, memo, useRef } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { swapColor } from '@azzapp/shared/cardHelpers';
import {
  COVER_BASE_WIDTH,
  COVER_CARD_RADIUS,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import { MediaImageRenderer, MediaVideoRenderer } from '../medias';
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
              ... on MediaVideo {
                thumbnail(width: $screenWidth, pixelRatio: $pixelRatio)
              }
              ... on MediaImage {
                smallURI: uri(width: 125, pixelRatio: $cappedPixelRatio)
              }
              ... on MediaVideo {
                smallThumbnail: thumbnail(
                  width: 125
                  pixelRatio: $cappedPixelRatio
                )
              }
            }
            textPreviewMedia {
              id
              largeURI: uri(width: $screenWidth, pixelRatio: $pixelRatio)
              smallURI: uri(width: 125, pixelRatio: $cappedPixelRatio)
            }
            foreground {
              id
              largeURI: uri(width: $screenWidth, pixelRatio: $pixelRatio)
              smallURI: uri(width: 125, pixelRatio: $cappedPixelRatio)
            }
            foregroundColor
            # Only here for the animation
            backgroundColor
            title
            subTitle
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
  const readyStates = useRef({ text: false, media: false, foreground: false });

  const sources = useRef({
    media: cardCover?.media?.id,
    text: cardCover?.textPreviewMedia?.id,
    foreground: cardCover?.foreground?.id,
  });

  if (sources.current.media !== cardCover?.media?.id) {
    readyStates.current.media = false;
    sources.current.media = cardCover?.media?.id;
  }

  if (sources.current.text !== cardCover?.textPreviewMedia?.id) {
    readyStates.current.text = false;
    sources.current.text = cardCover?.textPreviewMedia?.id;
  }

  if (!sources.current.foreground) {
    readyStates.current.foreground = true;
  } else if (sources.current.foreground !== cardCover?.foreground?.id) {
    readyStates.current.foreground = false;
    sources.current.foreground = cardCover?.foreground?.id;
  }

  const onMediaReadyForDisplay = () => {
    readyStates.current.media = true;
    if (readyStates.current.text && readyStates.current.foreground) {
      onReadyForDisplay?.();
    }
  };

  const onTextReadyForDisplay = () => {
    readyStates.current.text = true;
    if (readyStates.current.media && readyStates.current.foreground) {
      onReadyForDisplay?.();
    }
  };

  const onForegroundReadyForDisplay = () => {
    readyStates.current.foreground = true;
    if (readyStates.current.media && readyStates.current.text) {
      onReadyForDisplay?.();
    }
  };
  //#endregion

  //#region Styles
  const borderRadius: number = hideBorderRadius ? 0 : COVER_CARD_RADIUS * width;

  const {
    media,
    textPreviewMedia,
    title,
    subTitle,
    foreground,
    foregroundColor,
  } = cardCover ?? {};

  const intl = useIntl();
  //#endregion

  const { __typename, uri, thumbnail, smallURI, smallThumbnail } = media ?? {};
  const isSmallCover = width === COVER_BASE_WIDTH;
  const isVideoMedia = __typename === 'MediaVideo';

  const mediaUri = isSmallCover
    ? !isVideoMedia || videoEnabled
      ? smallURI
      : smallThumbnail
    : !isVideoMedia || videoEnabled
    ? uri
    : thumbnail;

  const MediaRenderer =
    isVideoMedia && videoEnabled ? MediaVideoRenderer : MediaImageRenderer;

  return (
    <View
      ref={forwardRef}
      style={[styles.root, { borderRadius, width }, style]}
      testID="cover-renderer"
    >
      {media ? (
        <>
          <MediaRenderer
            testID="CoverRenderer_media"
            source={{ uri: mediaUri!, requestedSize: width, mediaId: media.id }}
            thumbnailURI={isSmallCover ? smallThumbnail : thumbnail}
            aspectRatio={COVER_RATIO}
            alt={intl.formatMessage(
              {
                defaultMessage: '{title} - background image',
                description: 'CoverRenderer - Accessibility cover image',
              },
              { title: `${title} - ${subTitle}` },
            )}
            onReadyForDisplay={onMediaReadyForDisplay}
            style={styles.layer}
          />
          {textPreviewMedia && (
            <MediaImageRenderer
              testID="CoverRenderer_text"
              source={{
                uri:
                  width === COVER_BASE_WIDTH
                    ? textPreviewMedia.smallURI
                    : textPreviewMedia.largeURI,
                mediaId: textPreviewMedia.id,
                requestedSize: width,
              }}
              aspectRatio={COVER_RATIO}
              alt={`${title} - ${subTitle}`}
              onReadyForDisplay={onTextReadyForDisplay}
              style={styles.layer}
            />
          )}
          {foreground && (
            <MediaImageRenderer
              testID="CoverRenderer_foreground"
              source={{
                uri:
                  width === COVER_BASE_WIDTH
                    ? foreground.smallURI
                    : foreground.largeURI,
                mediaId: foreground.id,
                requestedSize: width,
              }}
              tintColor={swapColor(foregroundColor, cardColors)}
              aspectRatio={COVER_RATIO}
              alt={`${title} - ${subTitle}`}
              onReadyForDisplay={onForegroundReadyForDisplay}
              style={styles.layer}
            />
          )}
        </>
      ) : (
        <View style={styles.coverPlaceHolder} />
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
  },
  coverPlaceHolder: {
    backgroundColor: colors.grey100,
    aspectRatio: COVER_RATIO,
  },
  qrCode: {
    position: 'absolute',
    top: '10%',
    left: '45%',
    width: '10%',
    aspectRatio: 1,
  },
});
