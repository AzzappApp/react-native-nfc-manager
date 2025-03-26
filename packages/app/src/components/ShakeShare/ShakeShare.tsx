import EventEmitter from 'events';
import {
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import {
  BlendColor,
  Canvas,
  Group,
  ImageFormat,
  ImageSVG,
  Paint,
  Skia,
  fitbox,
  makeImageFromView,
  rect,
} from '@shopify/react-native-skia';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  useColorScheme,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import {
  SensorType,
  runOnJS,
  useAnimatedReaction,
  useAnimatedSensor,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { graphql, useLazyLoadQuery, useMutation } from 'react-relay';
import ERRORS from '@azzapp/shared/errors';
import { useNetworkAvailableContext } from '#networkAvailableContext';
import { colors, shadow } from '#theme';
import AddToWalletButton from '#components/AddToWalletButton';
import { useRouter } from '#components/NativeRouter';
import ToastUi from '#components/Toast';
import { logEvent } from '#helpers/analytics';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import downloadQrCode from '#helpers/DownloadQrCode';
import { useProfileInfos } from '#hooks/authStateHooks';
import useBoolean from '#hooks/useBoolean';
import useLatestCallback from '#hooks/useLatestCallback';
import { useCurrentLocation } from '#hooks/useLocation';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import { get as qrCodeWidth } from '#relayProviders/qrCodeWidth.relayprovider';
import ActivityIndicator from '#ui/ActivityIndicator';
import BottomSheetModal from '#ui/BottomSheetModal';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import LargeButton from '#ui/LargeButton';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import ContactCardExportVcf from '../ContactCardExportVcf';
import CoverRenderer from '../CoverRenderer';
import IosAddWidgetPopup from './IosAddWidgetPopup';
import SignaturePreview from './SignaturePreview';
import type { ShakeShareScreenQuery } from '#relayArtifacts/ShakeShareScreenQuery.graphql';

const _shakeShareEventHandler = new EventEmitter();

export const openShakeShare = () => {
  _shakeShareEventHandler.emit('open');
};

export const useShakeShareDisplay = () => {
  const [isMounted, setMounted] = useState(false);
  const profileInfos = useProfileInfos();

  const mount = useCallback(() => {
    if (
      profileInfos?.profileId && // no webcard available
      !profileInfos?.invited && // invitation not validated
      !!profileInfos?.webCardUserName // creation not finished
    ) {
      setMounted(true);
    }
  }, [
    profileInfos?.invited,
    profileInfos?.profileId,
    profileInfos?.webCardUserName,
  ]);

  const umount = useCallback(() => {
    setMounted(false);
  }, []);

  useEffect(() => {
    _shakeShareEventHandler.on('open', mount);
    return () => {
      _shakeShareEventHandler.off('open', mount);
    };
  }, [mount]);

  return { isMounted, mount, umount };
};

type ShakeShareProps = {
  isMounted: boolean;
  umount: () => void;
  mount: () => void;
};

const ShakeShare = ({ isMounted, umount, mount }: ShakeShareProps) => {
  const styles = useStyleSheet(styleSheet);
  const isConnected = useNetworkAvailableContext();
  const profileInfos = useProfileInfos();

  const visible = isMounted && isConnected;

  const activateShakeAndShare =
    !profileInfos?.invited && !!profileInfos?.webCardUserName;

  useShakeDetector(mount, activateShakeAndShare);

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
        onDismiss={umount}
        enableContentPanningGesture
        showShadow={false}
        backgroundComponent={visible ? renderBackgroundComponent : undefined}
      >
        <ShakeShareDisplay onClose={umount} visible={visible} />
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
  const intl = useIntl();
  const styles = useStyleSheet(styleSheet);
  const router = useRouter();
  const [popupIosWidgetVisible, showIosWidgetPopup, hideIosWidgetPopup] =
    useBoolean(false);
  const profileInfos = useProfileInfos();
  const { bottom } = useScreenInsets();
  const { height, width } = useScreenDimensions();
  const colorScheme = useColorScheme();
  const ref = useRef<View>(null);

  const [enableShakeBack, setEnableShakeBack] = useState(false);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

  const currentLocation = useCurrentLocation();

  const { location, address } = currentLocation ?? {};

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

  const { node, currentUser } = useLazyLoadQuery<ShakeShareScreenQuery>(
    graphql`
      query ShakeShareScreenQuery(
        $profileId: ID!
        $width: Int!
        $location: LocationInput
        $address: AddressInput
      ) {
        node(id: $profileId) {
          ... on Profile @alias(as: "profile") {
            id
            invited
            webCard {
              id
              userName
              cardIsPublished
              ...AccountHeader_webCard
              ...CoverRenderer_webCard
            }
            createdAt
            contactCardUrl
            contactCardQrCode(
              width: $width
              location: $location
              address: $address
            )
            contactCardQrCodeWithoutLocation: contactCardQrCode(width: $width)
            ...ContactCardExportVcf_card
            ...SignaturePreview_profile
          }
        }
        currentUser {
          email
        }
      }
    `,
    {
      profileId: profileInfos?.profileId ?? '',
      width: qrCodeWidth(),
      location: location
        ? {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }
        : null,
      address: address
        ? {
            country: address.country,
            city: address.city,
            subregion: address.subregion,
            region: address.region,
          }
        : null,
    },
    {
      fetchKey: `${profileInfos?.profileId ?? ''}${location ? `${location.coords.latitude}-${location.coords.longitude}` : ''}`,
    },
  );

  const [commit] = useMutation(graphql`
    mutation ShakeShareGenerateEmailSignatureMutation(
      $profileId: ID!
      $config: GenerateEmailSignatureInput!
    ) {
      generateEmailSignature(config: $config, profileId: $profileId) {
        url
      }
    }
  `);

  const profile = node?.profile;
  const webCard = profile?.webCard;

  useEffect(() => {
    if (!webCard?.cardIsPublished) {
      onClose();
    }
  }, [onClose, webCard?.cardIsPublished]);

  const generateEmail = useCallback(async () => {
    if (!currentUser?.email) {
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage:
            'Please add an email address to your account to receive your email signature',
          description:
            'Toast message  if the user as not mail while generating email signature for the user',
        }),
      });
      return;
    }
    if (profile?.id && webCard?.id && ref.current) {
      setIsGeneratingEmail(true);
      const image = await makeImageFromView(ref);
      const base64 = image?.encodeToBase64(ImageFormat.JPEG, 100);

      logEvent('generate_email_signature');
      commit({
        variables: {
          profileId: profile.id,
          config: {
            preview: base64 ?? '',
          },
        },
        onCompleted: () => {
          setIsGeneratingEmail(false);
          Toast.show({
            type: 'success',
            text1: intl.formatMessage({
              defaultMessage: 'An email has been sent to you',
              description:
                'Toast message while generating email signature for the user',
            }),
          });
        },
        onError: e => {
          setIsGeneratingEmail(false);
          if (e.message === ERRORS.SUBSCRIPTION_REQUIRED) {
            router.push({
              route: 'USER_PAY_WALL',
            });
            return;
          }
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'Unknown error - Please retry',
              description:
                'ContactCardScreen - Error Unknown error - Please retry',
            }),
          });
        },
      });
    }
  }, [commit, currentUser?.email, intl, profile?.id, router, webCard?.id]);

  const onDownloadQrCode = useCallback(() => {
    if (profile) {
      downloadQrCode(profile.id, profile?.contactCardQrCodeWithoutLocation);
    }
  }, [profile]);

  const svg = profile?.contactCardQrCode
    ? Skia.SVG.MakeFromString(profile?.contactCardQrCode)
    : null;

  const src = rect(0, 0, svg?.width() ?? 0, svg?.height() ?? 0);
  const dst = rect(0, 0, QR_CODE_WIDTH, QR_CODE_WIDTH);

  if (!webCard?.cardIsPublished) {
    return null;
  }

  return (
    <BottomSheetScrollView
      contentContainerStyle={[styles.container, { height, width }]}
    >
      <CoverRenderer
        width={width}
        webCard={webCard}
        style={styles.coverStyle}
        canPlay
      />
      <LinearGradient
        colors={['rgba(0, 0, 0,0.6)', 'rgba(0, 0, 0, 1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0.2, 0.55]}
        style={styles.linear}
      />
      <ScrollView style={styles.contentContainer}>
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
              <PressableNative
                ripple={{
                  foreground: true,
                  color:
                    colorScheme === 'dark' ? colors.grey100 : colors.grey900,
                }}
                style={[styles.button, styles.addToWalletButton]}
                onPress={generateEmail}
              >
                {isGeneratingEmail ? (
                  <ActivityIndicator
                    color={colorScheme === 'dark' ? 'black' : 'white'}
                    style={styles.addToWalletIcon}
                  />
                ) : (
                  <Icon
                    icon="signature"
                    style={styles.sharedIcon}
                    size={24}
                    tintColor={
                      colorScheme === 'dark' ? colors.black : colors.white
                    }
                  />
                )}
                <Text variant="button" style={styles.addToWalletButtonText}>
                  <FormattedMessage
                    defaultMessage="Smart email Signature"
                    description="Generate an email Signature button label"
                  />
                </Text>
              </PressableNative>
              <Text
                variant="xsmall"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  color: colors.grey400,
                  paddingVertical: 10,
                }}
              >
                <FormattedMessage
                  defaultMessage="Your smart email signature:"
                  description="ConctactCardScreen - Your smart email signature"
                />
              </Text>
              {profile && (
                <View style={styles.signaturePreview}>
                  <View
                    ref={ref}
                    collapsable={false}
                    style={styles.viewShotBackgroundColor}
                  >
                    <SignaturePreview profile={profile} />
                  </View>
                </View>
              )}
            </View>
            <View style={styles.buttonContainer}>
              {Platform.OS === 'ios' && (
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
              )}
              {Platform.OS === 'ios' && (
                <LargeButton
                  appearance="light"
                  icon="QR_code"
                  title={intl.formatMessage({
                    defaultMessage: 'Add qr-code to lock screen',
                    description: 'Add qr-code to lock screen button label',
                  })}
                  style={styles.button}
                  onPress={() => {}} // missing video
                />
              )}
              <LargeButton
                appearance="light"
                icon="QR_code"
                title={intl.formatMessage({
                  defaultMessage: 'Download qr-code ',
                  description: 'Download qr-code button label',
                })}
                style={styles.button}
                onPress={onDownloadQrCode}
              />
            </View>
          </View>
        )}
      </ScrollView>
      <View style={styles.closeButtonContainer}>
        <LinearGradient
          colors={['rgba(0, 0, 0,0)', 'rgba(0, 0, 0, 1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          locations={[0, 0.7]}
          style={{ width: '100%', height }}
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
    </BottomSheetScrollView>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  iconContainerStyle: {
    position: 'absolute',
    borderColor: 'white',
    width: 24,
  },
  contentContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '100%',
  },
  actionContainer: {
    position: 'relative',
    gap: 10,
    alignItems: 'center',
    width: '100%',
    padding: 10,
    paddingTop: 100,
    marginBottom: 200,
  },
  qrCodeContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 23,
    borderCurve: 'continuous',
    width: QR_CODE_WIDTH + 40,
    height: QR_CODE_WIDTH + 40,
  },
  addToWalletButton: {
    width: '100%',
    height: 47,
    borderRadius: 12,
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToWalletIcon: {
    width: 38,
    height: 37,
    position: 'absolute',
    left: 10,
    marginVertical: 'auto',
  },
  addToWalletButtonText: {
    color: appearance === 'light' ? colors.white : colors.black,
  },
  sharedIcon: {
    position: 'absolute',
    left: 10,
    marginVertical: 'auto',
  },
  signaturePreview: {
    width: '100%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 16,
    transform: [{ scale: 0.85 }, { translateY: -20 }],
    ...shadow({ appearance: 'light', direction: 'bottom' }),
  },
  viewShotBackgroundColor: { backgroundColor: 'white', paddingBottom: 5 },
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
  coverStyle: {
    marginBottom: 0,
    borderRadius: 0,
    position: 'fixed',
    top: 0,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  subtitle: {
    textAlign: 'center',
    width: '100%',
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
}));

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
