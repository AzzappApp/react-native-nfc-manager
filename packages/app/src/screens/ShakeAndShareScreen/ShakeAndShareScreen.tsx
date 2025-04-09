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
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { startTransition, Suspense, useCallback, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  useColorScheme,
  View,
  ScrollView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {
  graphql,
  useMutation,
  usePreloadedQuery,
  useRefetchableFragment,
} from 'react-relay';
import ERRORS from '@azzapp/shared/errors';
import { PAYMENT_IS_ENABLED } from '#Config';
import { colors, shadow } from '#theme';
import AddToWalletButton from '#components/AddToWalletButton';
import ContactCardExportVcf from '#components/ContactCardExportVcf';
import CoverRenderer from '#components/CoverRenderer';
import { useRouter } from '#components/NativeRouter';
import ToastUi from '#components/Toast';
import { logEvent } from '#helpers/analytics';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import downloadQrCode from '#helpers/DownloadQrCode';
import relayScreen from '#helpers/relayScreen';
import useBoolean from '#hooks/useBoolean';
import { useCurrentLocation } from '#hooks/useLocation';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import { get as qrCodeWidth } from '#relayProviders/qrCodeWidth.relayprovider';
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
import type { ShakeAndShareScreen_profile$key } from '#relayArtifacts/ShakeAndShareScreen_profile.graphql';
import type { ShakeAndShareScreen_profileQuery } from '#relayArtifacts/ShakeAndShareScreen_profileQuery.graphql';
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
  const webCard = profile?.webCard;

  const router = useRouter();

  useEffect(() => {
    if (!profile || profile.invited || !webCard?.cardIsPublished) {
      router.back();
    }
  }, [profile, router, webCard?.cardIsPublished]);

  const [popupIosWidgetVisible, showIosWidgetPopup, hideIosWidgetPopup] =
    useBoolean(false);
  const [
    popupIosLockScreenWidgetVisible,
    showIosLockScreenWidgetPopup,
    hideIosLockScreenWidgetPopup,
  ] = useBoolean(false);

  const onDownloadQrCode = useCallback(() => {
    if (profile?.contactCardQrCodeWithoutLocation) {
      downloadQrCode(
        profile.webCard?.userName || profile.id,
        profile.contactCardQrCodeWithoutLocation,
      );
    }
  }, [
    profile?.contactCardQrCodeWithoutLocation,
    profile?.id,
    profile?.webCard?.userName,
  ]);

  const [commit, isGeneratingEmail] = useMutation(graphql`
    mutation ShakeAndShareScreenGenerateEmailSignatureMutation(
      $profileId: ID!
    ) {
      generateEmailSignature(profileId: $profileId) {
        url
      }
    }
  `);

  const intl = useIntl();

  const generateEmailSignature = useCallback(async () => {
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
    if (profile?.id && webCard?.id) {
      logEvent('generate_email_signature');
      commit({
        variables: {
          profileId: profile.id,
        },
        onCompleted: () => {
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
          if (e.message === ERRORS.SUBSCRIPTION_REQUIRED) {
            if (PAYMENT_IS_ENABLED) {
              router.push({
                route: 'USER_PAY_WALL',
              });
            } else {
              Toast.show({
                type: 'error',
                text1: intl.formatMessage({
                  defaultMessage: 'You can’t generate an email signature',
                  description:
                    'Error toast message when user tries to generate an email signature on android without a subscription',
                }),
              });
            }
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

  const styles = useStyleSheet(styleSheet);

  const colorScheme = useColorScheme();

  const { bottom } = useScreenInsets();
  const { height, width } = useScreenDimensions();

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
              <Suspense>
                <QRCode profile={node?.profile} />
              </Suspense>
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
                onPress={generateEmailSignature}
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
        <View style={[styles.closeButtonContainer, { bottom }]}>
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
            onPress={router.back}
            iconStyle={styles.iconStyle}
            style={[
              styles.iconContainerStyle,
              { bottom: Platform.OS === 'ios' ? bottom + 20 : 0 },
            ]}
          />
        </View>

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
  profile,
}: {
  profile?: ShakeAndShareScreen_profile$key | null;
}) => {
  const [data, refetch] = useRefetchableFragment<
    ShakeAndShareScreen_profileQuery,
    ShakeAndShareScreen_profile$key
  >(
    graphql`
      fragment ShakeAndShareScreen_profile on Profile
      @refetchable(queryName: "ShakeAndShareScreen_profileQuery")
      @argumentDefinitions(
        width: { type: "Int!", provider: "qrCodeWidth.relayprovider" }
        location: { type: "LocationInput" }
        address: { type: "AddressInput" }
      ) {
        contactCardQrCode(width: $width, location: $location, address: $address)
      }
    `,
    profile,
  );

  const currentLocation = useCurrentLocation();

  const { location, address } = currentLocation ?? {};

  useEffect(() => {
    startTransition(() => {
      refetch({
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
      });
    });
  }, [address, location, refetch]);

  const svg = data?.contactCardQrCode
    ? Skia.SVG.MakeFromString(data.contactCardQrCode)
    : null;

  const src = rect(0, 0, svg?.width() ?? 0, svg?.height() ?? 0);
  const dst = rect(0, 0, QR_CODE_WIDTH, QR_CODE_WIDTH);

  const styles = useStyleSheet(styleSheet);

  return svg ? (
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
  ) : null;
};

const { width } = Dimensions.get('window');

const QR_CODE_WIDTH = Math.round(width * 0.5);

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
  signaturePreview: [
    {
      width: '100%',
      backgroundColor: 'white',
      padding: 15,
      borderRadius: 16,
      transform: [{ scale: 0.85 }, { translateY: -20 }],
    },
    shadow({ appearance: 'light', direction: 'bottom' }),
  ],
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

const shakeAndShareQuery = graphql`
  query ShakeAndShareScreenQuery(
    $profileId: ID!
    $width: Int!
    $dark: String
    $light: String
  ) {
    node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        id
        invited
        webCard {
          id
          userName
          cardIsPublished
          ...CoverRenderer_webCard
        }
        contactCardUrl
        contactCardQrCodeWithoutLocation: contactCardQrCode(
          width: $width
          dark: $dark
          light: $light
        )
        ...ContactCardExportVcf_card
        ...SignaturePreview_profile
        ...ShakeAndShareScreen_profile
      }
    }
    currentUser {
      email
    }
  }
`;

//ShakeAndShareScreen.getScreenOptions = () => ({ stackAnimation: 'formSheet' });

export default relayScreen(ShakeAndShareScreen, {
  query: shakeAndShareQuery,
  getVariables: (_, profileInfos) => ({
    profileId: profileInfos?.profileId,
    width: qrCodeWidth(),
    dark: '#FFFFFF',
    light: '#000000',
  }),
  getScreenOptions: () => ({
    stackPresentation: Platform.OS === 'ios' ? 'formSheet' : 'fullScreenModal',
    stackAnimation: 'slide_from_bottom',
  }),
  fetchPolicy: 'store-or-network',
});
