import { forwardRef, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import {
  COVER_BASE_WIDTH,
  COVER_CARD_RADIUS,
  COVER_RATIO,
} from '@azzapp/shared/cardHelpers';
import { colors } from '#theme';
import PressableNative from '#ui/PressableNative';
import { MediaImageRenderer } from '../medias';
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
  width?: number | `${number}vw`;
  /**
   * if true, the cover will not have rounded corners
   * @default false
   */
  hideBorderRadius?: boolean;
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
        isNative: {
          type: "Boolean!"
          provider: "../providers/isNative.relayprovider"
        }
      ) {
        # On the cover medias, we fetch both the large and small version
        # of the image to avoid a flickering effect when the profile screen is opened
        media {
          id
          largeURI: uri(width: $screenWidth, pixelRatio: $pixelRatio)
            @include(if: $isNative)
          smallURI: uri(width: 125, pixelRatio: $cappedPixelRatio)
            @include(if: $isNative)
        }
        textPreviewMedia {
          id
          largeURI: uri(width: $screenWidth, pixelRatio: $pixelRatio)
            @include(if: $isNative)
          smallURI: uri(width: 125, pixelRatio: $cappedPixelRatio)
            @include(if: $isNative)
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
  const readyStates = useRef({ text: false, media: false });

  const sources = useRef({
    media: cover?.media?.id,
    text: cover?.textPreviewMedia?.id,
  });

  if (sources.current.media !== cover?.media?.id) {
    readyStates.current.media = false;
    sources.current.media = cover?.media?.id;
  }

  if (sources.current.text !== cover?.textPreviewMedia?.id) {
    readyStates.current.text = false;
    sources.current.text = cover?.textPreviewMedia?.id;
  }

  const onMediaReadyForDisplay = () => {
    readyStates.current.media = true;
    if (readyStates.current.text) {
      onReadyForDisplay?.();
    }
  };

  const onTextReadyForDisplay = () => {
    readyStates.current.text = true;
    if (readyStates.current.media) {
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
  const borderRadius: number = hideBorderRadius
    ? 0
    : Platform.select({
        web: '12.8%' as any,
        default: COVER_CARD_RADIUS * (width as number),
      });

  const { media, textPreviewMedia, title, subTitle } = cover ?? {};

  const intl = useIntl();
  //#endregion

  return (
    <View
      ref={forwardRef}
      style={[styles.root, { borderRadius, width }, style]}
      testID="cover-renderer"
    >
      {media ? (
        <>
          <MediaImageRenderer
            testID="cover-renderer-media"
            width={width}
            aspectRatio={COVER_RATIO}
            alt={intl.formatMessage(
              {
                defaultMessage: '{title} - background image',
                description: 'CoverRenderer - Accessibility cover image',
              },
              { title: `${title} - ${subTitle}` },
            )}
            source={media.id}
            uri={width === COVER_BASE_WIDTH ? media.smallURI : media.largeURI}
            onReadyForDisplay={onMediaReadyForDisplay}
            style={styles.layer}
          />
          {textPreviewMedia && (
            <MediaImageRenderer
              testID="cover-renderer-text"
              width={width}
              aspectRatio={COVER_RATIO}
              alt={`${title} - ${subTitle}`}
              source={textPreviewMedia.id}
              uri={
                width === COVER_BASE_WIDTH
                  ? textPreviewMedia.smallURI
                  : textPreviewMedia.largeURI
              }
              onReadyForDisplay={onTextReadyForDisplay}
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
          testID="cover-renderer-qr-code"
          accessibilityRole="image"
          source={require('./assets/qr-code.png')}
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
