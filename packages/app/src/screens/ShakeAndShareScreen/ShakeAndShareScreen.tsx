import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import {
  BlendColor,
  Canvas,
  fitbox,
  Group,
  ImageSVG,
  Paint,
  rect,
  Skia,
} from '@shopify/react-native-skia';
import * as Brightness from 'expo-brightness';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { toString } from 'qrcode';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, usePreloadedQuery } from 'react-relay';
import { buildUserUrlWithKey } from '@azzapp/shared/urlHelpers';
import { colors, shadow } from '#theme';
import AddToWalletButton from '#components/AddToWalletButton';
import ContactCardExportVcf from '#components/ContactCardExportVcf';
import CoverRenderer from '#components/CoverRenderer';
import { useRouter } from '#components/NativeRouter';
import Skeleton from '#components/Skeleton';
import ToastUi from '#components/Toast';
import downloadQrCode from '#helpers/DownloadQrCode';
import relayScreen from '#helpers/relayScreen';
import useBoolean from '#hooks/useBoolean';
import { useGenerateEmailSignature } from '#hooks/useGenerateEmailSignature';
import { useCurrentLocation } from '#hooks/useLocation';
import useQRCodeKey from '#hooks/useQRCodeKey';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import IosAddWidgetPopup from '#screens/ShakeAndShareScreen/IosAddWidgetPopup';
import SignaturePreview from '#screens/ShakeAndShareScreen/SignaturePreview';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import LargeButton from '#ui/LargeButton';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import IosAddLockScreenWidgetPopup from './IosAddLockScreenWidgetPopup';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ShakeAndShareScreenQuery } from '#relayArtifacts/ShakeAndShareScreenQuery.graphql';
import type { ShakeAndShareRoute } from '#routes';

const ShakeAndShareScreen = ({
  preloadedQuery,
}: RelayScreenProps<ShakeAndShareRoute, ShakeAndShareScreenQuery>) => {
  const { node, currentUser } = usePreloadedQuery(
    shakeAndShareQuery,
    preloadedQuery,
  );

  const profile = node?.profile;
  const webCard = node?.profile?.webCard;

  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'android') {
      return;
    }

    let canceled = false;
    let brightness: number | null = null;
    (async () => {
      try {
        const { status } = await Brightness.requestPermissionsAsync();
        if (canceled) {
          return;
        }
        if (status === 'granted') {
          brightness = await Brightness.getBrightnessAsync();
          if (canceled) {
            return;
          }
          Brightness.setBrightnessAsync(1);
        }
      } catch {
        // Ignore errors
      }
    })();
    return () => {
      canceled = true;
      (async () => {
        try {
          if (brightness !== null) {
            Brightness.setBrightnessAsync(brightness);
          }
          Brightness.restoreSystemBrightnessAsync();
        } catch {
          // Ignore errors
        }
      })();
    };
  }, []);

  useEffect(() => {
    if (
      !profile ||
      profile.invited ||
      !webCard?.cardIsPublished ||
      !webCard.userName
    ) {
      router.back();
    }
  }, [profile, router, webCard?.cardIsPublished, webCard?.userName]);

  const { publicKey, contactCardAccessId } = useQRCodeKey(profile);

  const [popupIosWidgetVisible, showIosWidgetPopup, hideIosWidgetPopup] =
    useBoolean(false);
  const [
    popupIosLockScreenWidgetVisible,
    showIosLockScreenWidgetPopup,
    hideIosLockScreenWidgetPopup,
  ] = useBoolean(false);

  const contactCardUrl =
    webCard?.userName && contactCardAccessId && publicKey
      ? buildUserUrlWithKey({
          userName: webCard?.userName,
          contactCardAccessId,
          key: publicKey,
        })
      : null;

  const onDownloadQrCode = useCallback(() => {
    if (contactCardUrl) {
      toString(contactCardUrl, {
        errorCorrectionLevel: 'L',
        width: 80,
        type: 'svg',
        color: {
          dark: '#FFFFFF',
          light: '#000000',
        },
        margin: 0,
      }).then(svg => {
        downloadQrCode(webCard?.userName || '', svg);
      });
    }
  }, [contactCardUrl, webCard?.userName]);

  const intl = useIntl();

  const [generateEmailSignature, isGeneratingEmail] = useGenerateEmailSignature(
    profile?.id,
    publicKey,
    currentUser?.email,
  );

  const { width } = useScreenDimensions();

  return (
    <BottomSheetModalProvider>
      <Container style={{ flex: 1 }} collapsable={false}>
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
          <View style={styles.actionContainer}>
            <View style={styles.qrCodeContainer}>
              <Suspense fallback={<Skeleton style={styles.canvas} />}>
                {webCard?.userName && publicKey && contactCardAccessId && (
                  <QRCode
                    contactCardAccessId={contactCardAccessId}
                    publicKey={publicKey}
                    userName={webCard?.userName}
                  />
                )}
              </Suspense>
            </View>
            <Text style={styles.subtitle} appearance="dark" variant="button">
              <FormattedMessage
                defaultMessage="Point your camera at the QR Code to save the ContactCard"
                description="Shake and share subtitle"
              />
            </Text>
            <View style={styles.buttonContainer}>
              {publicKey && contactCardAccessId && (
                <ContactCardExportVcf
                  profile={profile}
                  appearance="dark"
                  style={styles.button}
                  publicKey={publicKey}
                  contactCardAccessId={contactCardAccessId}
                />
              )}
              {contactCardAccessId && publicKey && (
                <AddToWalletButton
                  contactCardAccessId={contactCardAccessId}
                  publicKey={publicKey}
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
                  Clipboard.setStringAsync(contactCardUrl ?? '').then(() => {
                    Toast.show({
                      type: 'info',
                      text1: intl.formatMessage({
                        defaultMessage: 'Copied to clipboard',
                        description:
                          'Toast info message that appears when the user copies the contact card url to the clipboard',
                      }),
                    });
                  });
                }}
              />
              <View style={[styles.button, styles.smartEmailButtonContainer]}>
                <PressableNative
                  android_ripple={{
                    foreground: true,
                    color: colors.grey900,
                  }}
                  style={styles.smartEmailButton}
                  onPress={generateEmailSignature}
                >
                  {isGeneratingEmail ? (
                    <ActivityIndicator
                      color="white"
                      style={styles.smartEmailIcon}
                    />
                  ) : (
                    <Icon
                      icon="signature"
                      style={styles.sharedIcon}
                      size={24}
                      tintColor={colors.white}
                    />
                  )}
                  <Text variant="button" style={styles.smartEmailButtonText}>
                    <FormattedMessage
                      defaultMessage="Smart email Signature"
                      description="Generate an email Signature button label"
                    />
                  </Text>
                </PressableNative>
              </View>
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
                  <View style={styles.viewShotBackgroundColor}>
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
                  onPress={showIosLockScreenWidgetPopup} // missing video
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
        </ScrollView>
        <CloseButton />

        <IosAddWidgetPopup
          visible={popupIosWidgetVisible}
          onHide={hideIosWidgetPopup}
        />
        <IosAddLockScreenWidgetPopup
          visible={popupIosLockScreenWidgetVisible}
          onHide={hideIosLockScreenWidgetPopup}
        />
      </Container>
      <ToastUi />
    </BottomSheetModalProvider>
  );
};

const QRCode = ({
  userName,
  publicKey,
  contactCardAccessId,
}: {
  userName: string;
  contactCardAccessId: string;
  publicKey: string;
}) => {
  const currentLocation = useCurrentLocation();

  const { location, address } = currentLocation?.value ?? {};

  const [contactCardSvg, setContactCardSvg] = useState<string | null>(null);

  useEffect(() => {
    if (userName && contactCardAccessId && publicKey) {
      toString(
        buildUserUrlWithKey({
          userName,
          contactCardAccessId,
          key: publicKey,
          geolocation: {
            location: location?.coords
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
        }),
        {
          errorCorrectionLevel: 'L',
          width: QR_CODE_WIDTH,
          type: 'svg',
          color: {
            dark: '#000',
            light: '#0000',
          },
          margin: 0,
        },
      ).then(svg => {
        setContactCardSvg(svg);
      });
    }
  }, [publicKey, location?.coords, address, userName, contactCardAccessId]);

  const svg = contactCardSvg ? Skia.SVG.MakeFromString(contactCardSvg) : null;

  const src = rect(0, 0, svg?.width() ?? 0, svg?.height() ?? 0);
  const dst = rect(0, 0, QR_CODE_WIDTH, QR_CODE_WIDTH);

  return svg && currentLocation.locationSearched ? (
    <Canvas style={styles.canvas}>
      <Group
        layer={
          <Paint>
            <BlendColor color="black" mode="srcATop" />
          </Paint>
        }
        transform={fitbox('contain', src, dst)}
      >
        <ImageSVG svg={svg} />
      </Group>
    </Canvas>
  ) : null;
};

const shakeAndShareQuery = graphql`
  query ShakeAndShareScreenQuery($profileId: ID!) {
    node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        id
        invited
        webCard {
          id
          cardIsPublished
          userName
          ...CoverRenderer_webCard
        }
        ...SignaturePreview_profile
        ...useQRCodeKey_profile
        ...ContactCardExportVcf_card
      }
    }
    currentUser {
      email
    }
  }
`;

const ShakeAndShareScreenFallback = () => {
  return (
    <Container style={{ flex: 1 }} collapsable={false}>
      <LinearGradient
        colors={['rgba(0, 0, 0,0.6)', 'rgba(0, 0, 0, 1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0.2, 0.55]}
        style={styles.linear}
      />
      <CloseButton />
    </Container>
  );
};

const CloseButton = () => {
  const router = useRouter();
  const { bottom } = useScreenInsets();
  const { height } = useScreenDimensions();
  return (
    <View style={[styles.closeButtonContainer, { bottom }]}>
      <LinearGradient
        colors={['rgba(0, 0, 0,0)', 'rgba(0, 0, 0, 1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.7]}
        style={{ width: '100%', height }}
        pointerEvents="none"
      />
      <View
        style={[
          styles.iconContainerStyle,
          { bottom: Platform.OS === 'ios' ? bottom + 20 : 0 },
        ]}
      >
        <IconButton
          icon="close"
          onPress={router.back}
          iconSize={24}
          appearance="dark"
        />
      </View>
    </View>
  );
};

export default relayScreen(ShakeAndShareScreen, {
  query: shakeAndShareQuery,
  fallback: ShakeAndShareScreenFallback,
  getVariables: (_, profileInfos) => ({
    profileId: profileInfos?.profileId,
  }),
  getScreenOptions: () => ({
    stackPresentation: Platform.OS === 'ios' ? 'formSheet' : 'transparentModal',
    stackAnimation: 'slide_from_bottom',
  }),
  fetchPolicy: 'store-or-network',
});

const { width } = Dimensions.get('window');

const QR_CODE_WIDTH = Math.round(width * 0.57);

const styles = StyleSheet.create({
  iconContainerStyle: {
    position: 'absolute',
    borderColor: colors.white,
    borderWidth: 1,
    borderRadius: 50,
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
    backgroundColor: '#FFF',
    borderRadius: 23,
    borderCurve: 'continuous',
    width: QR_CODE_WIDTH + 40,
    height: QR_CODE_WIDTH + 40,
  },
  smartEmailButtonContainer: {
    width: '100%',
    height: 47,
    borderRadius: 12,
    backgroundColor: colors.black,
    overflow: 'hidden',
  },
  smartEmailButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  smartEmailIcon: {
    width: 38,
    height: 37,
    position: 'absolute',
    left: 10,
    marginVertical: 'auto',
  },
  smartEmailButtonText: {
    color: colors.white,
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
  coverStyle: {
    marginBottom: 0,
    borderRadius: 0,
    position: 'absolute',
    top: 0,
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
});
