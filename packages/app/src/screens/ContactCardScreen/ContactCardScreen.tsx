import { addPass, addPassJWT } from '@reeq/react-native-passkit';
import { fromGlobalId } from 'graphql-relay';
import { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  View,
  useWindowDimensions,
  Image,
  useColorScheme,
  Platform,
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
import { colors } from '#theme';
import AccountHeader from '#components/AccountHeader';
import ContactCard, {
  CONTACT_CARD_RATIO,
} from '#components/ContactCard/ContactCard';
import ScreenModal from '#components/ScreenModal';
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
import PressableAnimated from '#ui/PressableAnimated';
import PressableNative from '#ui/PressableNative';
import SafeAreaView from '#ui/SafeAreaView';
import Text from '#ui/Text';
import ContactCardEditModal from './ContactCardEditModal';
import ContactCardExportVcf from './ContactCardExportVcf';
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
        ...ContactCard_profile
        ...ContactCardExportVcf_card
        ...ContactCardEditModal_card
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

  const [fullScreen, setFullscreen] = useToggle(false);

  const sharedRotationState = useAnimatedState(fullScreen, defaultTimingParam);

  const cardWidth = (width * 78) / 100;
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
    if (profile?.id && webCard?.id) {
      await generateEmailSignature({
        locale: intl.locale,
        profileId: fromGlobalId(profile.id).id,
      });
      Toast.show({
        type: 'success',
        text1: intl.formatMessage({
          defaultMessage: 'An email has been sent to you',
          description:
            'Toast message while generating email signature for the user',
        }),
      });
    }
  }, [currentUser?.email, intl, profile?.id, webCard?.id]);

  const [contactCardEditModal, toggleContactEditModal] = useToggle(false);

  const styles = useStyleSheet(styleSheet);

  const [loadingPass, setLoadingPass] = useState(false);

  const colorScheme = useColorScheme();
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
          <Text variant="xsmall" style={styles.contactCardDescriptionText}>
            <FormattedMessage
              defaultMessage="Your Contact Card is a convenient way to share your contact information."
              description="Description of the contact card screen."
            />
          </Text>

          <Button
            variant="secondary"
            style={styles.editContactCardButton}
            label={intl.formatMessage({
              defaultMessage: 'Edit card details',
              description: 'Edit card details button label',
            })}
            onPress={toggleContactEditModal}
          />

          <View style={{ width: '100%' }}>
            <Text variant="xsmall">
              <FormattedMessage
                defaultMessage="Your contact card is not visible on your Webcard. Only you can share your contact card with other users."
                description="Description message when contact card is private."
              />
            </Text>
          </View>

          <View style={styles.buttons}>
            <View style={styles.addToWalletContainer}>
              <PressableNative
                testID="add-to-wallet-button"
                disabled={loadingPass}
                ripple={{
                  borderless: true,
                  foreground: true,
                  color:
                    colorScheme === 'dark' ? colors.grey100 : colors.grey900,
                }}
                style={styles.addToWalletButton}
                onPress={async () => {
                  try {
                    setLoadingPass(true);
                    if (Platform.OS === 'ios') {
                      const pass = await getAppleWalletPass({
                        webCardId: fromGlobalId(webCard.id).id,
                        locale: intl.locale,
                      });

                      const base64Pass = fromByteArray(
                        getArrayBufferForBlob(pass),
                      );

                      await addPass(base64Pass);
                    } else if (Platform.OS === 'android') {
                      const pass = await getGoogleWalletPass({
                        webCardId: fromGlobalId(webCard.id).id,
                        locale: intl.locale,
                      });

                      await addPassJWT(pass.token);
                    }
                  } catch (e) {
                    Toast.show({
                      text1: intl.formatMessage({
                        defaultMessage: 'Error',
                        description: 'Error toast title',
                      }),
                      text2: intl.formatMessage({
                        defaultMessage: 'Could not add pass to Apple Wallet',
                        description: 'Error toast message',
                      }),
                      type: 'error',
                    });
                  } finally {
                    setLoadingPass(false);
                  }
                }}
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
                  {Platform.OS === 'ios' ? (
                    <FormattedMessage
                      defaultMessage="Add to Apple Wallet"
                      description="Add to Apple Wallet button label"
                    />
                  ) : (
                    <FormattedMessage
                      defaultMessage="Add to Google Wallet"
                      description="Add to Google Wallet button label"
                    />
                  )}
                </Text>
              </PressableNative>
            </View>
            {webCard && (
              <ContactCardExportVcf
                userName={webCard.userName}
                profile={profile}
              />
            )}
            <Button
              label={intl.formatMessage({
                defaultMessage: 'Generate an email Signature',
                description: 'Generate an email Signature button label',
              })}
              onPress={generateEmail}
            />
          </View>
        </Animated.View>
        <ScreenModal visible={contactCardEditModal} animationType="slide">
          <ContactCardEditModal
            key={webCard.id}
            profile={profile}
            visible={contactCardEditModal}
            toggleBottomSheet={toggleContactEditModal}
          />
        </ScreenModal>
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
      title={intl.formatMessage({
        defaultMessage: 'Contact Card',
        description:
          'Title of the contact card screen where user can edit their contact card.',
      })}
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
    maxWidth: 255,
    textAlign: 'center',
    color: appearance === 'light' ? colors.black : colors.white,
  },
  footer: {
    marginTop: 20,
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
    position: 'absolute',
    left: 4,
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
}));
