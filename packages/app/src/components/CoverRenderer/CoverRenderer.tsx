import { forwardRef, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Image, StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import {
  COVER_BASE_WIDTH,
  COVER_CARD_RADIUS,
  COVER_RATIO,
} from '@azzapp/shared/coverHelpers';
import { colors } from '#theme';
import PressableNative from '#ui/PressableNative';
import { MediaImageRenderer, MediaVideoRenderer } from '../medias';
import QRCodeModal from './QRCodeModal';
import type { CoverRenderer_cover$key } from '@azzapp/relay/artifacts/CoverRenderer_cover.graphql';
import type { ForwardedRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type CoverRendererProps = {
  /**
   * The relay reference to the cover
   */
  cover: CoverRenderer_cover$key | null | undefined;
  /**
   * The user name of the card owner
   * Used to generate the QR code
   */
  userName: string;
  /**
   * The width of the displayed cover
   * Must be a number on native, vw unit are supported on web
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
    cover: coverKey,
    userName,
    width = 125,
    hideBorderRadius,
    style,
    videoEnabled,
    onReadyForDisplay,
  }: CoverRendererProps,
  forwardRef: ForwardedRef<View>,
) => {
  //#region Data
  const cover = useFragment(
    graphql`
      fragment CoverRenderer_cover on CardCover
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
            smallThumbnail: thumbnail(width: 125, pixelRatio: $cappedPixelRatio)
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
        foregroundStyle {
          color
        }
        title
        subTitle
      }
    `,
    coverKey ?? null,
  );
  //#endregion

  //#region Ready states
  // We need to wait for both the media and the text to be ready for display
  // before calling the onReadyForDisplay callback, however, we need to
  // redispatch it when the cover changes
  const readyStates = useRef({ text: false, media: false, foreground: false });

  const sources = useRef({
    media: cover?.media?.id,
    text: cover?.textPreviewMedia?.id,
    foreground: cover?.foreground?.id,
  });

  if (sources.current.media !== cover?.media?.id) {
    readyStates.current.media = false;
    sources.current.media = cover?.media?.id;
  }

  if (sources.current.text !== cover?.textPreviewMedia?.id) {
    readyStates.current.text = false;
    sources.current.text = cover?.textPreviewMedia?.id;
  }

  if (!sources.current.foreground) {
    readyStates.current.foreground = true;
  } else if (sources.current.foreground !== cover?.foreground?.id) {
    readyStates.current.foreground = false;
    sources.current.foreground = cover?.foreground?.id;
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

  //#region QR Code
  const [qrCodeVisible, setQRCodeVisible] = useState(false);
  const showQRCode = () => {
    setQRCodeVisible(true);
  };
  const hideQRCode = () => {
    setQRCodeVisible(false);
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
    foregroundStyle,
  } = cover ?? {};

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
              tintColor={foregroundStyle?.color}
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
      <PressableNative
        onPress={showQRCode}
        accessibilityRole="button"
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Tap me to show the QR Code fullscreen',
          description: 'CoverRenderer - Accessibility Qr code button',
        })}
        style={styles.qrCode}
      >
        <Image
          testID="cover-renderer-qrcode"
          accessibilityRole="image"
          source={require('#assets/qrcode.png')}
          style={styles.layer}
        />
      </PressableNative>
      {qrCodeVisible && (
        <QRCodeModal onRequestClose={hideQRCode} userName={userName} />
      )}
    </View>
  );
};

export default forwardRef(CoverRenderer);

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
