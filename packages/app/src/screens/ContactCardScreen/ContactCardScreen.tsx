import { addPass, addPassJWT } from '@reeq/react-native-passkit';
import { ImageFormat, makeImageFromView } from '@shopify/react-native-skia';
import { Image } from 'expo-image';
import { fromGlobalId } from 'graphql-relay';
import { useCallback, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  View,
  useWindowDimensions,
  useColorScheme,
  Platform,
  ScrollView,
} from 'react-native';
import { getArrayBufferForBlob } from 'react-native-blob-jsi-helper';
import { fromByteArray } from 'react-native-quick-base64';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { graphql, usePreloadedQuery } from 'react-relay';
import { colors, shadow } from '#theme';
import AccountHeader from '#components/AccountHeader';
import ContactCard, {
  CONTACT_CARD_RATIO,
} from '#components/ContactCard/ContactCard';
import { useRouter } from '#components/NativeRouter';
import { logEvent } from '#helpers/analytics';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import {
  generateEmailSignature,
  getAppleWalletPass,
  getGoogleWalletPass,
} from '#helpers/MobileWebAPI';
import relayScreen from '#helpers/relayScreen';
import useAnimatedState from '#hooks/useAnimatedState';
import useToggle from '#hooks/useToggle';
import ActivityIndicator from '#ui/ActivityIndicator';
import Button from '#ui/Button';
import Container from '#ui/Container';
import FingerHint from '#ui/FingerHint';
import Icon from '#ui/Icon';
import PressableAnimated from '#ui/PressableAnimated';
import PressableNative from '#ui/PressableNative';
import SafeAreaView from '#ui/SafeAreaView';
import Text from '#ui/Text';
import ContactCardExportVcf from './ContactCardExportVcf';
import SignaturePreview from './SignaturePreview';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { AccountHeader_webCard$key } from '#relayArtifacts/AccountHeader_webCard.graphql';
import type { ContactCardScreenQuery } from '#relayArtifacts/ContactCardScreenQuery.graphql';
import type { ContactCardRoute } from '#routes';
import type { LayoutChangeEvent } from 'react-native';

const contactCardMobileScreenQuery = graphql`
  query ContactCardScreenQuery($profileId: ID!) {
    node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        id
        webCard {
          id
          userName
          ...AccountHeader_webCard
          cardColors {
            primary
          }
        }
        lastContactCardUpdate
        createdAt
        ...ContactCard_profile
        ...ContactCardExportVcf_card
        ...SignaturePreview_profile
      }
    }
    currentUser {
      email
    }
  }
`;

const defaultTimingParam = {
  duration: 600,
  easing: Easing.inOut(Easing.ease), //Easing.bezier(0.25, 0.1, 0.25, 1),
};

export const ContactCardScreen = ({
  preloadedQuery,
}: RelayScreenProps<ContactCardRoute, ContactCardScreenQuery>) => {
  const { node, currentUser } = usePreloadedQuery(
    contactCardMobileScreenQuery,
    preloadedQuery,
  );
  const { width, height } = useWindowDimensions();
  const profile = node?.profile;
  const webCard = profile?.webCard;
  const intl = useIntl();
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

  const [fullScreen, setFullscreen] = useToggle(false);

  const sharedRotationState = useAnimatedState(fullScreen, defaultTimingParam);

  const cardWidth = width - 40;
  const cardHeight = cardWidth / CONTACT_CARD_RATIO;
  const fullScreenCardWidth = width - 40;
  const fullScreenCardHeight = fullScreenCardWidth * CONTACT_CARD_RATIO;

  const [topCardY, setTopCardY] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => {
    const middleY = event.nativeEvent.layout.y + cardHeight / 2;
    const topYAfterScale = fullScreenCardHeight / 2 - middleY;
    setTopCardY(topYAfterScale);
  };

  const animatedContactCardStyle = useAnimatedStyle(
    () => ({
      zIndex: 10,
      transform: [
        {
          scale: interpolate(
            sharedRotationState.value,
            [0, 1],
            [1, fullScreenCardWidth / cardHeight],
          ),
        },
        {
          translateY: interpolate(
            sharedRotationState.value,
            [0, 1],
            [0, topCardY / 2 + (height - fullScreenCardHeight) / 4],
          ),
        },
        {
          rotate: `${interpolate(
            sharedRotationState.value,
            [0, 1],
            [0, -90],
          )}deg`,
        },
      ],
    }),
    [sharedRotationState.value, cardWidth, width, topCardY],
  );

  const footerStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateY: interpolate(
            sharedRotationState.value,
            [0, 1],
            [0, height],
          ),
        },
      ],
    }),
    [sharedRotationState.value],
  );

  const headerStyle = useAnimatedStyle(
    () => ({
      opacity: interpolate(sharedRotationState.value, [0, 1], [1, 0]),
    }),
    [sharedRotationState.value],
  );

  const ref = useRef<View>(null);
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
      // const base64card = await ref.current?.capture();
      const image = await makeImageFromView(ref);
      const base64 = image?.encodeToBase64(ImageFormat.JPEG, 100);

      try {
        logEvent('generate_email_signature');
        await generateEmailSignature({
          locale: intl.locale,
          profileId: fromGlobalId(profile.id).id,
          preview: base64 ?? '',
        });
      } catch (e) {
        console.log(e);
      }
      Toast.show({
        type: 'success',
        text1: intl.formatMessage({
          defaultMessage: 'An email has been sent to you',
          description:
            'Toast message while generating email signature for the user',
        }),
      });
      setIsGeneratingEmail(false);
    }
  }, [currentUser?.email, intl, profile?.id, webCard?.id]);

  const styles = useStyleSheet(styleSheet);

  const [loadingPass, setLoadingPass] = useState(false);

  const colorScheme = useColorScheme();

  const router = useRouter();

  const generateLoadingPass = useCallback(async () => {
    try {
      setLoadingPass(true);
      if (webCard?.id) {
        if (Platform.OS === 'ios') {
          const pass = await getAppleWalletPass({
            webCardId: fromGlobalId(webCard.id).id,
            locale: intl.locale,
          });

          const base64Pass = fromByteArray(getArrayBufferForBlob(pass));

          await addPass(base64Pass);
        } else if (Platform.OS === 'android') {
          const pass = await getGoogleWalletPass({
            webCardId: fromGlobalId(webCard.id).id,
            locale: intl.locale,
          });

          await addPassJWT(pass.token);
        }
        logEvent('add_pass_wallet');
      }
    } catch {
      Toast.show({
        text1: intl.formatMessage({
          defaultMessage: 'Error',
          description: 'Error toast title',
        }),
        text2: Platform.select({
          ios: intl.formatMessage(
            {
              defaultMessage:
                'Oops, ContactCard{azzappA} could not add pass to Apple Wallet',
              description: 'Error toast message',
            },
            { azzappA: <Text variant="azzapp">a</Text> },
          ) as string,
          android: intl.formatMessage(
            {
              defaultMessage:
                'Oops, ContactCard{azzappA} could not add pass to Google Wallet',
              description: 'Error toast message',
            },
            { azzappA: <Text variant="azzapp">a</Text> },
          ),
        }) as string,
        type: 'error',
      });
    } finally {
      setLoadingPass(false);
    }
  }, [webCard, intl]);

  if (!webCard) {
    return null;
  }

  return (
    <Container style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Animated.View style={headerStyle}>
          <ContactCardScreenHeader webCard={webCard} />
        </Animated.View>

        <PressableAnimated
          onPress={setFullscreen}
          style={[styles.contactCard, animatedContactCardStyle]}
          onLayout={onLayout}
        >
          <ContactCard profile={profile} height={cardHeight} />
        </PressableAnimated>

        <Animated.View style={[footerStyle, styles.footer]}>
          <Button
            variant="secondary"
            style={styles.editContactCardButton}
            label={
              intl.formatMessage(
                {
                  defaultMessage: 'Edit ContactCard{azzappA} details',
                  description: 'Edit card details button label',
                },
                {
                  azzappA: <Text variant="azzapp">a</Text>,
                },
              ) as string
            }
            onPress={() => {
              router.push({
                route: 'CONTACT_CARD_EDIT',
              });
            }}
          />
          {profile.lastContactCardUpdate <= profile.createdAt && (
            <FingerHint
              color={colorScheme === 'dark' ? 'light' : 'dark'}
              style={styles.fingerHint}
            />
          )}

          <ScrollView
            style={[styles.scrollViewStyle, { height: height - 247 }]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              gap: 20,
            }}
          >
            <Text variant="xsmall" style={styles.contactCardDescriptionText}>
              <FormattedMessage
                defaultMessage="Your Contact Card{azzappA} is a convenient way to share your contact information. It is not publicly visible on your WebCard{azzappA}, and only you can share it with others."
                description="Description of the contact card screen."
                values={{
                  azzappA: <Text variant="azzapp">a</Text>,
                }}
              />
            </Text>
            {Platform.OS === 'ios' && (
              <View style={styles.addToWalletContainer}>
                <PressableNative
                  testID="add-to-wallet-button"
                  disabled={loadingPass}
                  style={styles.addToWalletButton}
                  onPress={generateLoadingPass}
                >
                  {loadingPass ? (
                    <ActivityIndicator
                      color={colorScheme === 'dark' ? 'black' : 'white'}
                      style={styles.addToWalletIcon}
                    />
                  ) : (
                    <Image
                      source={require('#assets/wallet.png')}
                      style={styles.addToWalletIcon}
                    />
                  )}
                  <Text variant="button" style={styles.addToWalletButtonText}>
                    <FormattedMessage
                      defaultMessage="Add to Apple Wallet"
                      description="Add to Apple Wallet button label"
                    />
                  </Text>
                </PressableNative>
              </View>
            )}
            {Platform.OS === 'android' && (
              <View>
                <PressableNative
                  testID="add-to-wallet-button"
                  disabled={loadingPass}
                  onPress={generateLoadingPass}
                  ripple={{
                    foreground: true,
                    borderless: false,
                    color:
                      colorScheme === 'dark' ? colors.grey100 : colors.grey900,
                  }}
                  style={styles.googleWalletButton}
                >
                  <Image
                    source={require('#assets/google-wallet.svg')}
                    style={styles.googleWalletLogo}
                    contentFit="contain"
                  />
                </PressableNative>
                {loadingPass && (
                  <View style={styles.googleWalletLoadingContainer}>
                    <ActivityIndicator
                      color={colorScheme === 'dark' ? 'black' : 'white'}
                    />
                  </View>
                )}
              </View>
            )}
            <View style={styles.buttons}>
              {webCard && <ContactCardExportVcf profile={profile} />}
              <PressableNative
                ripple={{
                  foreground: true,
                  color:
                    colorScheme === 'dark' ? colors.grey100 : colors.grey900,
                }}
                style={styles.addToWalletButton}
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
                  paddingTop: 10,
                }}
              >
                <FormattedMessage
                  defaultMessage="Your smart email signature:"
                  description="ConctactCardScreen - Your smart email signature"
                />
              </Text>
              <View style={styles.signaturePreview}>
                <View
                  ref={ref}
                  collapsable={false}
                  style={styles.viewShotBackgroundColor}
                >
                  <SignaturePreview profile={profile} />
                </View>
              </View>
              <View style={{ height: 90, width: '100%' }} />
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </Container>
  );
};

const ContactCardScreenHeader = ({
  webCard,
}: {
  webCard: AccountHeader_webCard$key | null;
}) => {
  const intl = useIntl();
  return (
    <AccountHeader
      webCard={webCard}
      title={
        intl.formatMessage(
          {
            defaultMessage: 'Contact Card{azzappA}',
            description:
              'Title of the contact card screen where user can edit their contact card.',
          },
          {
            azzappA: <Text variant="azzapp">a</Text>,
          },
        ) as string
      }
    />
  );
};

const ContactCardScreenFallback = () => (
  <Container style={{ flex: 1 }}>
    <SafeAreaView style={{ flex: 1 }}>
      <ContactCardScreenHeader webCard={null} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    </SafeAreaView>
  </Container>
);

export default relayScreen(ContactCardScreen, {
  query: contactCardMobileScreenQuery,
  getVariables: (_, profileInfos) => ({
    profileId: profileInfos?.profileId ?? '',
  }),
  fallback: ContactCardScreenFallback,
});

const styleSheet = createStyleSheet(appearance => ({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 20,
  },
  contactCard: {
    alignSelf: 'center',
  },
  editContactCardButton: {
    borderRadius: 27,
    height: 29,
  },
  contactCardDescriptionText: {
    width: '100%',
    textAlign: 'center',
    color: appearance === 'light' ? colors.black : colors.white,
  },
  footer: {
    marginTop: 15,
    alignItems: 'center',
    rowGap: 20,
    paddingHorizontal: 10,
    maxWidth: 375,
    alignSelf: 'center',
    width: '100%',
  },
  publicOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttons: { rowGap: 10, width: '100%' },
  addToWalletIcon: {
    width: 38,
    height: 37,
    position: 'absolute',
    left: 10,
    marginVertical: 'auto',
  },
  sharedIcon: {
    position: 'absolute',
    left: 10,
    marginVertical: 'auto',
  },
  addToWalletContainer: { overflow: 'hidden', borderRadius: 12 },
  addToWalletButton: {
    width: '100%',
    height: 47,
    borderRadius: 12,
    backgroundColor: appearance === 'light' ? colors.black : colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToWalletButtonText: {
    color: appearance === 'light' ? colors.white : colors.black,
  },
  cardColorPicker: {
    borderColor: colors.black,
    borderWidth: 1,
    borderRadius: 20,
    padding: 6,
  },
  signaturePreview: {
    width: '100%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 16,
    transform: [{ scale: 0.85 }, { translateY: -20 }],
    ...shadow('light', 'bottom'),
  },
  scrollViewStyle: { width: '100%' },
  viewShotBackgroundColor: { backgroundColor: 'white', paddingBottom: 5 },
  googleWalletLogo: {
    height: 47,
    overflow: 'visible',
  },
  googleWalletButton: {
    aspectRatio: 283 / 50, // derived from google wallet logo svg
    height: 47,
    alignSelf: 'center',
  },
  googleWalletLoadingContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fingerHint: { top: -57 },
}));
