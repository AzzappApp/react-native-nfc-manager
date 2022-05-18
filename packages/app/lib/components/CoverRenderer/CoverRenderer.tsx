import {
  COVER_BASE_WIDTH,
  COVER_RATIO,
} from '@azzapp/shared/lib/imagesFormats';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '../../../theme';
import { withAnchorPoint } from '../../helpers/withAnchorPoints';
import useInterval from '../../hooks/useInterval';
import CoverOverlayEffects from './CoverOverlayEffects';
import CoverRendererImage from './CoverRendererImage';
import QRCodeModal from './QRCodeModal';
import type { CoverRenderer_cover$key } from './__generated__/CoverRenderer_cover.graphql';
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
}: CoverRendererProps) => {
  const cover = useFragment(
    graphql`
      fragment CoverRenderer_cover on UserCardCover {
        backgroundColor
        pictures
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
  const imageFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!play && currentImageIndex !== imageIndex) {
      setCurrentImageIndex(imageIndex);
      imageFade.setValue(1);
    }
  }, [currentImageIndex, imageFade, imageIndex, play]);

  const playInterval = (cover?.pictureTransitionTimer ?? 0) * 1000;
  useInterval(
    () => {
      const nextIndex = (currentImageIndex + 1) % pictures.length;
      setCurrentImageIndex(nextIndex);
      imageFade.setValue(0);
      Animated.spring(imageFade, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    },
    play ? playInterval : 0,
  );

  /**
   * Layout calculation
   */
  const { width: windowWidth } = useWindowDimensions();
  const width = fullScreen ? windowWidth : COVER_BASE_WIDTH;

  const borderRadius: number = Platform.select({
    web: '6%' as any,
    default: 0.06 * width,
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
  if (textSize && titleRotation && Number.isFinite(titleRotation)) {
    const { x, y, rotateDirection } = TITLE_TRANSFORM_SETTINGS[titlePosition];
    titleTransform = withAnchorPoint(
      { transform: [{ rotate: `${rotateDirection * titleRotation}deg` }] },
      { x, y },
      textSize,
    );
  }

  const displayedPictures = play ? pictures : [pictures[currentImageIndex]];

  const scale = width / COVER_BASE_WIDTH;

  return (
    <>
      <View
        style={[styles.container, { borderRadius }, style]}
        nativeID={`cover-${userName}`}
      >
        {displayedPictures.map((picture, index) => {
          const isCurrent = index === currentImageIndex;
          const isPrevious =
            (currentImageIndex === 0 &&
              index === displayedPictures.length - 1) ||
            index === currentImageIndex - 1;

          const opacity = isCurrent
            ? imageFade.interpolate({ inputRange: [0, 1], outputRange: [0, 1] })
            : isPrevious
            ? imageFade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })
            : 0;

          return (
            <CoverRendererImage
              key={picture}
              picture={picture}
              style={[
                styles.coverImage,
                {
                  borderRadius,
                  backgroundColor,
                },
                play && { opacity },
              ]}
              nativeID={`cover-${userName}-image-${index}`}
              testID={`cover-${userName}-image-${index}`}
              useLargeImage={useLargeImage ?? fullScreen}
            />
          );
        })}

        <View style={[styles.container, { justifyContent: 'flex-end' }]}>
          <CoverOverlayEffects
            overlayEffect={overlayEffect}
            color={backgroundColor}
            width="100%"
            height="100%"
            nativeID={`cover-${userName}-overlay`}
          />
        </View>
        <View style={[styles.containers, titleStyles.position]}>
          <Text
            style={[
              { zIndex: 1 },
              titleStyles.position,
              {
                fontSize: scale * titleFontSize,
                color: titleColor,
                fontFamily: titleFont,
                opacity: textSize ? 1 : 0,
              },
              titleTransform,
            ]}
            nativeID={`cover-${userName}-text`}
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
              nativeID={`cover-${userName}-qrCode`}
              source={require('./assets/qr-code.png')}
              style={{
                width: 16 * scale,
                height: 16 * scale,
                borderRadius: 2 * scale,
              }}
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
                  {
                    width: 16 * scale,
                    height: 16 * scale,
                    borderRadius: 2 * scale,
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  },
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
