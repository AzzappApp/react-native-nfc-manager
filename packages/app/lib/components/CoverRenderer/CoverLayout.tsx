import {
  COVER_BASE_WIDTH,
  COVER_CARD_RADIUS,
  COVER_RATIO,
} from '@azzapp/shared/lib/cardHelpers';
import { useState } from 'react';
import {
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
import CoverOverlayEffects from './CoverOverlayEffects';
import QRCodeModal from './QRCodeModal';
import type { CoverLayout_cover$key } from '@azzapp/relay/artifacts/CoverLayout_cover.graphql';
import type { EventEmitter } from 'events';
import type { ReactNode } from 'react';
import type {
  StyleProp,
  ViewStyle,
  TextStyle,
  TransformsStyle,
  LayoutChangeEvent,
} from 'react-native';

export type CoverLayoutProps = {
  cover: CoverLayout_cover$key | null | undefined;
  userName: string;
  width?: number | `${number}vw`;
  isEditing?: boolean;
  isEditedBlock?: boolean;
  hideBorderRadius?: boolean;
  eventEmitter?: EventEmitter;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const CoverLayout = ({
  cover: coverKey,
  userName,
  width = 125,
  isEditing,
  isEditedBlock,
  eventEmitter,
  children,
  hideBorderRadius = false,
  style,
}: CoverLayoutProps) => {
  /**
   * Data
   */
  const cover = useFragment(
    graphql`
      fragment CoverLayout_cover on UserCardCover {
        backgroundColor
        overlayEffect
        title
        titlePosition
        titleFont
        titleFontSize
        titleColor
        titleRotation
        qrCodePosition
      }
    `,
    coverKey ?? null,
  );
  /**
   * QR Code position edition
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

  /**
   * Layout calculation
   */
  const borderRadius: number = hideBorderRadius
    ? 0
    : Platform.select({
        web: '12.8%' as any,
        default: COVER_CARD_RADIUS * (width as number),
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
  if (!cover) {
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
        // @ts-expect-error transformOrigin is only supported on web
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
    width: getScaledStyle(16, width),
    height: getScaledStyle(16, width),
    borderRadius: getScaledStyle(2, width),
  };

  return (
    <>
      <View style={[styles.container, { borderRadius }, style]}>
        {children}
        <View style={[styles.containers, styles.overlayContainer]}>
          <CoverOverlayEffects
            overlayEffect={overlayEffect}
            color={backgroundColor}
            width="100%"
            height="100%"
          />
        </View>
        <View style={[styles.containers, titleStyles.position]}>
          <Text
            style={[
              { zIndex: 1 },
              titleStyles.alignment,
              titleTransform,
              {
                fontSize: getScaledStyle(titleFontSize, width),
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

export default CoverLayout;

export const QR_CODE_POSITION_CHANGE_EVENT = 'QR_CODE_POSITION_CHANGE_EVENT';

const styles = StyleSheet.create({
  container: { aspectRatio: COVER_RATIO, overflow: 'hidden' },
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

const getScaledStyle = (
  value: number,
  componentWidth: number | string,
): any => {
  if (componentWidth === COVER_BASE_WIDTH) {
    return value;
  }
  if (typeof componentWidth === 'string') {
    return `calc(${componentWidth} * ${value} / ${COVER_BASE_WIDTH})`;
  }
  return (componentWidth / COVER_BASE_WIDTH) * value;
};

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
