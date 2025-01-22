import EventEmitter from 'events';
import {
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import {
  BlendColor,
  Canvas,
  Group,
  ImageSVG,
  Paint,
  Skia,
  fitbox,
  rect,
} from '@shopify/react-native-skia';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import {
  SensorType,
  runOnJS,
  useAnimatedReaction,
  useAnimatedSensor,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { graphql, useLazyLoadQuery } from 'react-relay';
import { useNetworkAvailableContext } from '#networkAvailableContext';
import { colors } from '#theme';
import AddToWalletButton from '#components/AddToWalletButton';
import ToastUi from '#components/Toast';
import { useProfileInfos } from '#hooks/authStateHooks';
import useBoolean from '#hooks/useBoolean';
import useLatestCallback from '#hooks/useLatestCallback';
import useScreenInsets from '#hooks/useScreenInsets';
import { get as qrCodeWidth } from '#relayProviders/qrCodeWidth.relayprovider';
import BottomSheetModal from '#ui/BottomSheetModal';
import IconButton from '#ui/IconButton';
import LargeButton from '#ui/LargeButton';
import Text from '#ui/Text';
import ContactCardExportVcf from '../ContactCardExportVcf';
import CoverRenderer from '../CoverRenderer';
import IosAddWidgetPopup from './IosAddWidgetPopup';
import type { ShakeShareScreenQuery } from '#relayArtifacts/ShakeShareScreenQuery.graphql';

const _shakeShareEventHandler = new EventEmitter();

export const openShakeShare = () => {
  _shakeShareEventHandler.emit('open');
};

const ShakeShare = () => {
  const [mountScreen, setMountScreen] = useState(false);
  const isConnected = useNetworkAvailableContext();
  const profileInfos = useProfileInfos();

  const visible = mountScreen && isConnected;
  const dismount = useCallback(() => {
    setMountScreen(false);
  }, []);

  const activateShakeAndShare =
    !profileInfos?.invited && !!profileInfos?.webCardUserName;

  const activateDetector = useCallback(() => {
    setMountScreen(true);
  }, []);

  useShakeDetector(activateDetector, activateShakeAndShare);

  useEffect(() => {
    _shakeShareEventHandler.on('open', activateDetector);
    return () => {
      _shakeShareEventHandler.off('open', activateDetector);
    };
  }, [activateDetector]);

  // this background is displayed under the scrollView.
  // When we reach the limits of scroll we see this background for a very short period
  const renderBackgroundComponent = () => {
    return (
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.backgroundTopTransparent} />
        <View style={styles.backgroundBottomBlack} />
      </View>
    );
  };

  return (
    <BottomSheetModalProvider>
      <BottomSheetModal
        closeOnBackdropTouch={false}
        automaticBottomPadding={false}
        automaticTopPadding={false}
        visible={visible}
        showHandleIndicator={false}
        onDismiss={dismount}
        enableContentPanningGesture
        showShadow={false}
        backgroundComponent={visible ? renderBackgroundComponent : undefined}
      >
        <ShakeShareDisplay onClose={dismount} visible={visible} />
      </BottomSheetModal>
    </BottomSheetModalProvider>
  );
};

export default ShakeShare;

const { width } = Dimensions.get('window');

const QR_CODE_WIDTH = Math.round(width * 0.5);

const ShakeShareDisplay = ({
  onClose,
  visible,
}: {
  onClose: () => void;
  visible: boolean;
}) => {
  const [popupIosWidgetVisible, showIosWidgetPopup, hideIosWidgetPopup] =
    useBoolean(false);
  const profileInfos = useProfileInfos();
  const { bottom } = useScreenInsets();

  const [enableShakeBack, setEnableShakeBack] = useState(false);

  useEffect(() => {
    if (visible) {
      const tout = setTimeout(() => {
        setEnableShakeBack(true);
      }, 1000);
      return () => clearTimeout(tout);
    } else {
      setEnableShakeBack(false);
    }
  }, [visible]);

  useShakeDetector(onClose, enableShakeBack);

  const { node } = useLazyLoadQuery<ShakeShareScreenQuery>(
    graphql`
      query ShakeShareScreenQuery($profileId: ID!, $width: Int!) {
        node(id: $profileId) {
          ... on Profile @alias(as: "profile") {
            webCard {
              id
              cardIsPublished
              userName
              ...CoverRenderer_webCard
            }
            contactCardUrl
            contactCardQrCode(width: $width)
            ...ContactCardExportVcf_card
          }
        }
      }
    `,
    {
      profileId: profileInfos?.profileId ?? '',
      width: qrCodeWidth(),
    },
  );

  const profile = node?.profile;
  const webCard = profile?.webCard;

  useEffect(() => {
    if (!webCard?.cardIsPublished) {
      onClose();
    }
  }, [onClose, webCard?.cardIsPublished]);

  const svg = profile?.contactCardQrCode
    ? Skia.SVG.MakeFromString(profile?.contactCardQrCode)
    : null;

  const src = rect(0, 0, svg?.width() ?? 0, svg?.height() ?? 0);
  const dst = rect(0, 0, QR_CODE_WIDTH, QR_CODE_WIDTH);
  const intl = useIntl();

  if (!webCard?.cardIsPublished) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BottomSheetScrollView>
        <CoverRenderer
          width={width}
          webCard={webCard}
          style={styles.coverStyle}
          canPlay
        />
        <LinearGradient
          colors={['rgba(14, 18, 22,0)', 'rgba(0, 0, 0, 1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          locations={[0.2, 0.55]}
          style={styles.linear}
        />
        {svg && (
          <View style={styles.actionContainer}>
            <View style={styles.qrCodeContainer}>
              <Canvas style={styles.canvas}>
                <Group
                  layer={
                    <Paint>
                      <BlendColor color="white" mode="srcATop" />
                    </Paint>
                  }
                  transform={fitbox('contain', src, dst)}
                >
                  <ImageSVG svg={svg} />
                </Group>
              </Canvas>
            </View>
            <Text style={styles.subtitle} appearance="dark" variant="button">
              <FormattedMessage
                defaultMessage="Point your camera at the QR Code to save the ContactCard"
                description="Shake and share subtitle"
              />
            </Text>
            <View style={styles.buttonContainer}>
              {profile && (
                <ContactCardExportVcf
                  profile={profile}
                  appearance="dark"
                  style={styles.button}
                />
              )}
              {webCard && (
                <AddToWalletButton
                  webCardId={webCard.id}
                  style={styles.button}
                  appearance="light"
                />
              )}
              <LargeButton
                appearance="light"
                icon="link"
                title={intl.formatMessage({
                  defaultMessage: 'Copy card link',
                  description: 'Copy card link button label',
                })}
                style={styles.button}
                onPress={() => {
                  Clipboard.setStringAsync(profile?.contactCardUrl ?? '').then(
                    () => {
                      Toast.show({
                        type: 'info',
                        text1: intl.formatMessage({
                          defaultMessage: 'Copied to clipboard',
                          description:
                            'Toast info message that appears when the user copies the contact card url to the clipboard',
                        }),
                      });
                    },
                  );
                }}
              />
            </View>
            {Platform.OS === 'ios' && (
              <View style={styles.buttonContainer}>
                <LargeButton
                  appearance="light"
                  icon="QR_code"
                  title={intl.formatMessage({
                    defaultMessage: 'Add qr-code to home screen',
                    description: 'Add qr-code to home screen button label',
                  })}
                  style={styles.button}
                  onPress={showIosWidgetPopup}
                />
              </View>
            )}
          </View>
        )}
      </BottomSheetScrollView>
      <View style={styles.closeButtonContainer}>
        <LinearGradient
          colors={['rgba(0, 0, 0,0)', 'rgba(0, 0, 0, 1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          locations={[0, 0.7]}
          style={{ width: '100%', height: '100%' }}
          pointerEvents="none"
        />
        <IconButton
          icon="close"
          onPress={onClose}
          iconStyle={styles.iconStyle}
          style={[styles.iconContainerStyle, { bottom }]}
        />
      </View>
      <ToastUi />
      <IosAddWidgetPopup
        visible={popupIosWidgetVisible}
        onHide={hideIosWidgetPopup}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainerStyle: {
    position: 'absolute',
    borderColor: 'white',
    width: 24,
  },
  actionContainer: {
    position: 'relative',
    gap: 10,
    alignItems: 'center',
    width: '100%',
    padding: 10,
    marginBottom: 200,
  },
  qrCodeContainer: {
    position: 'absolute',
    top: -250,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 23,
    borderCurve: 'continuous',
    width: QR_CODE_WIDTH + 40,
    height: QR_CODE_WIDTH + 40,
  },
  canvas: { width: QR_CODE_WIDTH, height: QR_CODE_WIDTH, margin: 20 },
  linear: {
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
  },
  iconStyle: {
    tintColor: colors.white,
  },
  coverStyle: { marginBottom: 0, borderRadius: 0 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  subtitle: {
    textAlign: 'center',
    width: '100%',
    position: 'absolute',
    top: -30, // we want to be inside qrcode container
    padding: 5,
    margin: 'auto',
    alignSelf: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
    marginTop: 20,
  },
  closeButtonContainer: {
    position: 'absolute',
    bottom: 0,
    paddingTop: 10,
    width: '100%',
    height: 200,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  button: {
    borderWidth: 1,
    borderColor: colors.white,
  },
  backgroundTopTransparent: {
    height: 300,
    backgroundColor: 'transparent',
  },
  backgroundBottomBlack: {
    flex: 1,
    backgroundColor: 'black',
  },
});

// This code is transposed from https://github.com/facebook/react-native/blob/184b295a019e2af6712d34276c741e0dae78f798/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/common/ShakeDetector.java#L45
const GRAVITY_EARTH = 9.80665;
const REQUIRED_FORCE = GRAVITY_EARTH * 1.8;

const atLeastRequiredForce = (a: number) => {
  'worklet';
  return Math.abs(a) > REQUIRED_FORCE;
};

const useShakeDetector = (callback: () => void, activated: boolean) => {
  const lastShakeTimestamp = useSharedValue(0);
  const numShakes = useSharedValue(0);
  const accelX = useSharedValue(0);
  const accelY = useSharedValue(0);
  const accelZ = useSharedValue(0);

  const reset = useCallback(() => {
    'worklet';
    lastShakeTimestamp.value = 0;
    numShakes.value = 0;
    accelX.value = 0;
    accelY.value = 0;
    accelZ.value = 0;
  }, [accelX, accelY, accelZ, lastShakeTimestamp, numShakes]);

  const gyroscope = useAnimatedSensor(SensorType.ACCELEROMETER);

  const recordShake = useCallback(
    (timestamp: number) => {
      'worklet';
      lastShakeTimestamp.value = timestamp;
      numShakes.value++;
    },
    [lastShakeTimestamp, numShakes],
  );

  const callbackRef = useLatestCallback(callback);
  const maybeDispatchShake = useCallback(
    (timeStamp: number) => {
      'worklet';
      if (numShakes.value >= 8) {
        reset();
        runOnJS(callbackRef)();
      }

      if (timeStamp - lastShakeTimestamp.value > 3000) {
        reset();
      }
    },
    [callbackRef, lastShakeTimestamp, numShakes, reset],
  );

  const sensorValue = useDerivedValue(() => {
    const { x, y, z } = gyroscope.sensor.value;
    return {
      ax: x,
      ay: y,
      az: z,
    };
  });

  useAnimatedReaction(
    () => sensorValue.value,
    ({ ax, ay, az }) => {
      if (activated) {
        const timeStamp = Date.now();

        if (atLeastRequiredForce(ax) && ax * accelX.value <= 0) {
          recordShake(timeStamp);
          accelX.value = ax;
        } else if (atLeastRequiredForce(ay) && ay * accelY.value <= 0) {
          recordShake(timeStamp);
          accelX.value = ay;
        } else if (atLeastRequiredForce(az) && az * accelZ.value <= 0) {
          recordShake(timeStamp);
          accelX.value = az;
        }

        maybeDispatchShake(timeStamp);
      }
    },
    [activated],
  );
};
