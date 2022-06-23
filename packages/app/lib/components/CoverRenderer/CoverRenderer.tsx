import {
  COVER_BASE_WIDTH,
  COVER_RATIO,
} from '@azzapp/shared/lib/imagesHelpers';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '../../../theme';
import { withAnchorPoint } from '../../helpers/withAnchorPoints';
import useInterval from '../../hooks/useInterval';
import CoverOverlayEffects from './CoverOverlayEffects';
import CoverRendererImage from './CoverRendererImage';
import CoverRendererVideo from './CoverRendererVideo';
import QRCodeModal from './QRCodeModal';
import type { CoverRenderer_cover$key } from '@azzapp/relay/artifacts/CoverRenderer_cover.graphql';
import type { EventEmitter } from 'events';
import type {
  StyleProp,
  ViewStyle,
  TextStyle,
  TransformsStyle,
  LayoutChangeEvent,
} from 'react-native';

type CoverRendererProps = {
  cover: CoverRenderer_cover$key | null | undefined;
  userName: string;
  play?: boolean;
  imageIndex?: number;
  fullScreen?: boolean;
  useLargeImage?: boolean;
  isEditing?: boolean;
  isEditedBlock?: boolean;
  hideBorderRadius?: boolean;
  eventEmitter?: EventEmitter;
  style?: StyleProp<ViewStyle>;
};

const CoverRenderer = ({
  cover: coverKey,
  userName,
  play = false,
  imageIndex = 0,
  fullScreen,
  isEditing,
  isEditedBlock,
  useLargeImage,
  eventEmitter,
  style,
  hideBorderRadius = false,
}: CoverRendererProps) => {
  const cover = useFragment(
    graphql`
      fragment CoverRenderer_cover on UserCardCover
      # For the moment relay is a bit bugy with those providers
      # We have to provide a path relative to the artifact directory
      @argumentDefinitions(
        pixelRatio: {
          type: "Float!"
          provider: "../providers/PixelRatio.relayprovider"
        }
        coverRatio: {
          type: "Float!"
          provider: "../providers/CoverRatio.relayprovider"
        }
        screenWidth: {
          type: "Float!"
          provider: "../providers/ScreenWidth.relayprovider"
        }
        coverWidth: {
          type: "Float!"
          provider: "../providers/CoverBaseWidth.relayprovider"
        }
      ) {
        backgroundColor
        pictures {
          kind
          source
          largeURI: uri(
            width: $screenWidth
            pixelRatio: $pixelRatio
            ratio: $coverRatio
          )
          smallURI: uri(
            width: $coverWidth
            pixelRatio: $pixelRatio
            ratio: $coverRatio
          )
        }
        pictureTransitionTimer
        overlayEffect
        title
        titlePosition
        titleFont
        titleFontSize
        titleColor
        titleRotation
        qrCodePosition
        desktopLayout
        dektopImagePosition
      }
    `,
    coverKey ?? null,
  );

  /**
   * Handle image transition
   */
  const [currentImageIndex, setCurrentImageIndex] = useState(imageIndex);

  useEffect(() => {
    if (!play && currentImageIndex !== imageIndex) {
      setCurrentImageIndex(imageIndex);
    }
  }, [currentImageIndex, imageIndex, play]);

  const playInterval = (cover?.pictureTransitionTimer ?? 0) * 1000;
  useInterval(
    () => {
      if (pictures.length === 1) {
        return;
      }
      const nextIndex = (currentImageIndex + 1) % pictures.length;
      setCurrentImageIndex(nextIndex);
    },
    play ? playInterval : 0,
  );

  /**
   * Layout calculation
   */
  const borderRadius: number = hideBorderRadius
    ? 0
    : Platform.select({
        web: '6%' as any,
        default: getScaledStyle(0.06 * COVER_BASE_WIDTH, fullScreen),
      });

  const [textSize, setTextSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const onTextLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setTextSize({ width, height });
  };

  /**
   * Rendering
   */
  const [qrCodeVisible, setQRCodeVisible] = useState(false);

  const showQRCode = () => {
    setQRCodeVisible(true);
  };
  const hideQRCode = () => {
    setQRCodeVisible(false);
  };

  const onSelectQRCodePosition = (position: string) => {
    eventEmitter?.emit(QR_CODE_POSITION_CHANGE_EVENT, position);
  };

  if (!cover || !cover.pictures.length) {
    return (
      <View
        style={[
          styles.container,
          styles.coverPlaceHolder,
          { borderRadius },
          style,
        ]}
      />
    );
  }

  const {
    backgroundColor,
    pictures,
    overlayEffect,
    title,
    titlePosition,
    titleFont,
    titleFontSize,
    titleColor,
    titleRotation,
    qrCodePosition,
  } = cover;

  const titleStyles = textStylesMap[titlePosition];

  let titleTransform: TransformsStyle | null = null;
  if (titleRotation && Number.isFinite(titleRotation)) {
    const { x, y, rotateDirection } = TITLE_TRANSFORM_SETTINGS[titlePosition];
    if (Platform.OS === 'web') {
      titleTransform = {
        transform: [{ rotate: `${rotateDirection * titleRotation}deg` }],
        //@ts-expect-error transformOrigin is only supported on web
        transformOrigin: `${x * 100}% ${y * 100}%`,
      };
    } else if (textSize) {
      titleTransform = withAnchorPoint(
        { transform: [{ rotate: `${rotateDirection * titleRotation}deg` }] },
        { x, y },
        textSize,
      );
    }
  }

  const qrCodeStyles = {
    width: getScaledStyle(16, fullScreen),
    height: getScaledStyle(16, fullScreen),
    borderRadius: getScaledStyle(2, fullScreen),
  };

  const displayedPictures = (play ? pictures : [pictures[currentImageIndex]])
    // picture could be null in case of invalid image Index
    .filter(picture => !!picture);

  const idPrefix = fullScreen ? 'user-screen-cover-' : 'cover-';

  return (
    <>
      <View
        style={[styles.container, { borderRadius }, style]}
        nativeID={`${idPrefix}${userName}`}
      >
        {displayedPictures.map((picture, index) => {
          const isCurrent = index === currentImageIndex;

          const style = [
            styles.coverImage,
            {
              borderRadius,
              backgroundColor,
            },
          ];

          switch (picture.kind) {
            case 'picture':
              return (
                <CoverRendererImage
                  key={`${picture.source}-${picture.kind}`}
                  source={picture.source}
                  largeURI={picture.largeURI}
                  smallURI={picture.smallURI}
                  style={style}
                  nativeID={`${idPrefix}${userName}-image-${index}`}
                  testID={`${idPrefix}${userName}-image-${index}`}
                  useLargeImage={useLargeImage ?? fullScreen}
                  hidden={!isCurrent && play}
                />
              );
            case 'video':
              return (
                <CoverRendererVideo
                  key={`${picture.source}-${picture.kind}`}
                  source={picture.source}
                  uri={fullScreen ? picture.largeURI : picture.smallURI}
                  style={style}
                  nativeID={`${idPrefix}${userName}-image-${index}`}
                  testID={`${idPrefix}${userName}-image-${index}`}
                  hidden={!isCurrent && play}
                />
              );
            default:
              return null;
          }
        })}

        <View
          style={[styles.containers, styles.overlayContainer, { borderRadius }]}
        >
          <CoverOverlayEffects
            overlayEffect={overlayEffect}
            color={backgroundColor}
            width="100%"
            height="100%"
            nativeID={`${idPrefix}${userName}-overlay`}
          />
        </View>
        <View
          style={[styles.containers, titleStyles.position]}
          nativeID={`${idPrefix}${userName}-text`}
        >
          <Text
            style={[
              { zIndex: 1 },
              titleStyles.alignment,
              titleTransform,
              {
                fontSize: getScaledStyle(titleFontSize, fullScreen),
                fontFamily: titleFont,
                color: titleColor,
                opacity: Platform.select({ default: textSize ? 1 : 0, web: 1 }),
              },
            ]}
            onLayout={onTextLayout}
          >
            {title}
          </Text>
        </View>
        <View
          style={[
            { zIndex: 1 },
            styles.containers,
            QR_CODE_POSITIONS[qrCodePosition],
            { paddingTop: '15%' },
          ]}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={showQRCode}
            style={({ pressed }) => pressed && { opacity: 0.6 }}
            disabled={isEditing}
          >
            <Image
              nativeID={`${idPrefix}${userName}-qrCode`}
              source={require('./assets/qr-code.png')}
              style={qrCodeStyles}
            />
          </Pressable>
        </View>
        {isEditedBlock &&
          Object.keys(QR_CODE_POSITIONS).map(position => (
            <View
              key={position}
              style={[
                styles.containers,
                QR_CODE_POSITIONS[position],
                { paddingTop: '15%' },
              ]}
              pointerEvents="box-none"
            >
              <Pressable
                onPress={() => onSelectQRCodePosition(position)}
                style={({ pressed }) => [
                  { zIndex: 1 },
                  qrCodeStyles,
                  { backgroundColor: 'rgba(255, 255, 255, 0.6)' },
                  pressed && { opacity: 0.6 },
                ]}
              />
            </View>
          ))}
      </View>
      {qrCodeVisible && (
        <QRCodeModal onRequestClose={hideQRCode} userName={userName} />
      )}
    </>
  );
};

export default CoverRenderer;

export const QR_CODE_POSITION_CHANGE_EVENT = 'QR_CODE_POSITION_CHANGE_EVENT';

const styles = StyleSheet.create({
  container: { aspectRatio: COVER_RATIO },
  coverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  coverPlaceHolder: {
    backgroundColor: colors.lightGrey,
  },
  containers: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    padding: '5%',
    overflow: 'hidden',
  },
  overlayContainer: {
    padding: 0,
    // this fix is meant for web wich display a gap otherwise
    height: Platform.select({
      web: '100.5%',
      default: '100%',
    }),
  },
});

const textStylesMap: Record<
  string,
  { alignment: TextStyle; position: ViewStyle }
> = {
  topLeft: {
    alignment: { textAlign: 'left' },
    position: { justifyContent: 'flex-start' },
  },
  topCenter: {
    alignment: { textAlign: 'center' },
    position: { justifyContent: 'flex-start' },
  },
  topRight: {
    alignment: { textAlign: 'right' },
    position: { justifyContent: 'flex-start' },
  },
  middleLeft: {
    alignment: { textAlign: 'left' },
    position: { justifyContent: 'center' },
  },
  middleCenter: {
    alignment: { textAlign: 'center' },
    position: { justifyContent: 'center' },
  },
  middleRight: {
    alignment: { textAlign: 'right' },
    position: { justifyContent: 'center' },
  },
  bottomLeft: {
    alignment: { textAlign: 'left' },
    position: { justifyContent: 'flex-end' },
  },
  bottomCenter: {
    alignment: { textAlign: 'center' },
    position: { justifyContent: 'flex-end' },
  },
  bottomRight: {
    alignment: { textAlign: 'right' },
    position: { justifyContent: 'flex-end' },
  },
};

const TITLE_TRANSFORM_SETTINGS: Record<
  string,
  { x: number; y: number; rotateDirection: -1 | 1 }
> = {
  topLeft: {
    x: 0,
    y: 1,
    rotateDirection: 1,
  },
  topCenter: {
    x: 0.5,
    y: 1,
    rotateDirection: 1,
  },
  topRight: {
    x: 1,
    y: 1,
    rotateDirection: -1,
  },
  middleLeft: {
    x: 0,
    y: 0.5,
    rotateDirection: 1,
  },
  middleCenter: {
    x: 0.5,
    y: 0.5,
    rotateDirection: 1,
  },
  middleRight: {
    x: 1,
    y: 0.5,
    rotateDirection: -1,
  },
  bottomLeft: {
    x: 0,
    y: 0,
    rotateDirection: -1,
  },
  bottomCenter: {
    x: 0.5,
    y: 0,
    rotateDirection: 1,
  },
  bottomRight: {
    x: 1,
    y: 0,
    rotateDirection: 1,
  },
};

const QR_CODE_POSITIONS: Record<string, ViewStyle> = {
  top: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  bottomLeft: {
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  bottomCenter: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bottomRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
};

const getScaledStyle = (value: number, fullScreen = false): any => {
  if (!fullScreen) {
    return value;
  }
  if (Platform.OS === 'web') {
    return `calc(${value} * 100vw / ${COVER_BASE_WIDTH})`;
  }
  return (Dimensions.get('window').width / COVER_BASE_WIDTH) * value;
};
