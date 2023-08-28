import { addPass, addPassJWT } from '@reeq/react-native-passkit';
import { fromGlobalId } from 'graphql-relay';

import { useEffect, useState } from 'react';
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
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { graphql, useMutation, usePreloadedQuery } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { colors } from '#theme';
import ContactCard, { CONTACT_CARD_RATIO } from '#components/ContactCard';
import ProfileColorPicker from '#components/ProfileColorPicker';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { getAppleWalletPass, getGoogleWalletPass } from '#helpers/MobileWebAPI';
import relayScreen from '#helpers/relayScreen';
import useAnimatedState from '#hooks/useAnimatedState';
import useToggle from '#hooks/useToggle';
import ActivityIndicator from '#ui/ActivityIndicator';
import Button from '#ui/Button';
import ColorPreview from '#ui/ColorPreview';
import Container from '#ui/Container';
import PressableAnimated from '#ui/PressableAnimated';
import PressableNative from '#ui/PressableNative';
import Switch from '#ui/Switch';
import Text from '#ui/Text';
import ContactCardEditModal from './ContactCardEditModal';
import ContactCardExportVcf from './ContactCardExportVcf';
import ContactCardHeader from './ContactCardHeader';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ContactCardRoute } from '#routes';
import type { ContactCardScreenQuery } from '@azzapp/relay/artifacts/ContactCardScreenQuery.graphql';
import type { LayoutChangeEvent } from 'react-native';

const contactCardMobileScreenQuery = graphql`
  query ContactCardScreenQuery {
    viewer {
      profile {
        id
        userName
        ...ContactCardHeader_profile
        ...AccountHeader_profile
        ...ProfileColorPicker_profile
        ...ContactCard_profile
        contactCard {
          isPrivate
          displayedOnWebCard
          ...ContactCardEditModal_card
          ...ContactCardExportVcf_card
        }
        cardColors {
          primary
        }
      }
    }
  }
`;

const defaultTimingParam = {
  duration: 600,
  easing: Easing.inOut(Easing.ease), //Easing.bezier(0.25, 0.1, 0.25, 1),
};

const ContactCardScreen = ({
  preloadedQuery,
}: RelayScreenProps<ContactCardRoute, ContactCardScreenQuery>) => {
  const { viewer } = usePreloadedQuery(
    contactCardMobileScreenQuery,
    preloadedQuery,
  );
  const { width, height } = useWindowDimensions();
  const profile = viewer?.profile;
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

  const animatedContactCardStyle = useAnimatedStyle(() => {
    //calcul the center for Y translation and X translation

    const transform = [
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
    ];

    return {
      zIndex: 10,
      // height: interpolate(
      //   sharedRotationState.value,
      //   [0, 1],
      //   [cardHeight, fullScreenCardWidth],
      // ),

      transform,
    };
  }, [sharedRotationState.value, cardWidth, width, topCardY]);

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

  const [contactCardEditModal, toggleContactEditModal] = useToggle(false);

  const [commit] = useMutation(graphql`
    mutation ContactCardScreenMutation($input: SaveContactCardInput!) {
      saveContactCard(input: $input) {
        profile {
          contactCard {
            isPrivate
            displayedOnWebCard
            ...ContactCardEditModal_card
          }
        }
      }
    }
  `);

  const [isPublicCard, setIsPublicCard] = useToggle(false);
  const [isDisplayedOnWebCard, setIsDisplayedOnWebCard] = useToggle(
    viewer.profile?.contactCard?.displayedOnWebCard ?? false,
  );

  const [colorPickerVisible, toggleColorPickerVisible] = useToggle(false);

  const [debouncedPublic] = useDebounce(isPublicCard, 500);
  const [debouncedDisplayedOnWebCard] = useDebounce(isDisplayedOnWebCard, 500);

  //TODO: find another way, we are saving the contact card when displaying the page(initial render)
  useEffect(() => {
    commit({
      variables: {
        input: {
          isPrivate: !debouncedPublic,
          displayedOnWebCard: debouncedPublic && debouncedDisplayedOnWebCard,
        },
      },
      onError: err => {
        console.log(err);
      },
    });
  }, [debouncedPublic, debouncedDisplayedOnWebCard, commit]);

  const styles = useStyleSheet(styleSheet);

  const [loadingPass, setLoadingPass] = useState(false);

  const colorScheme = useColorScheme();
  if (!profile) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Container style={styles.container}>
        <Animated.View style={headerStyle}>
          <ContactCardHeader profileKey={profile} />
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

          <PressableNative
            accessibilityRole="button"
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Background color',
              description: 'Label of the contact card background color button',
            })}
            accessibilityHint={intl.formatMessage({
              defaultMessage: 'Tap to select a background color',
              description: 'Hint of the color picker button',
            })}
            style={styles.cardColorPicker}
            onPress={toggleColorPickerVisible}
          >
            <ColorPreview
              color={viewer?.profile?.cardColors?.primary ?? colors.black}
              colorSize={16}
            />
          </PressableNative>
          {viewer.profile && (
            <ProfileColorPicker
              visible={colorPickerVisible}
              height={400}
              profile={viewer.profile}
              title={intl.formatMessage({
                defaultMessage: ' color',
                description: ' color title in BlockText edition',
              })}
              selectedColor={
                viewer?.profile?.cardColors?.primary ?? colors.black
              }
              onColorChange={color => {
                commit({
                  variables: {
                    input: {
                      backgroundStyle: {
                        backgroundColor: color,
                      },
                    },
                  },
                  onError: err => {
                    console.log(err);
                  },
                });
              }}
              onRequestClose={toggleColorPickerVisible}
            />
          )}

          <View style={{ width: '100%' }}>
            <View style={styles.publicOptions}>
              <Text variant="large">
                <FormattedMessage
                  defaultMessage="Public contact card"
                  description="When true the contact card is public"
                />
              </Text>
              <Switch
                variant="large"
                value={isPublicCard}
                onValueChange={setIsPublicCard}
              />
            </View>
            <Text variant="xsmall">
              {isPublicCard ? (
                <FormattedMessage
                  defaultMessage="Anyone can download your contact card from your profile."
                  description="Description message when contact card is public."
                />
              ) : (
                <FormattedMessage
                  defaultMessage="Your contact card is not visible on your Webcard. Only you can share your contact card with other users."
                  description="Description message when contact card is private."
                />
              )}
            </Text>
          </View>

          {isPublicCard && (
            <Animated.View
              style={{ width: '100%' }}
              entering={FadeIn}
              exiting={FadeOut}
            >
              <View style={styles.publicOptions}>
                <Text variant="large">
                  <FormattedMessage
                    defaultMessage="Display on my webcard"
                    description="When true the contact card is displayed on the webcard"
                  />
                </Text>
                <Switch
                  variant="large"
                  value={isDisplayedOnWebCard}
                  onValueChange={setIsDisplayedOnWebCard}
                />
              </View>
              <Text variant="xsmall">
                <FormattedMessage
                  defaultMessage="When users visite your Webcard, they are prompted to download your contact card."
                  description="Description of the display on my webcard toggle."
                />
              </Text>
            </Animated.View>
          )}

          <View style={styles.buttons}>
            <PressableNative
              disabled={loadingPass}
              style={styles.addToWalletButton}
              onPress={async () => {
                try {
                  setLoadingPass(true);
                  if (Platform.OS === 'ios') {
                    const pass = await getAppleWalletPass({
                      profileId: fromGlobalId(profile.id).id,
                      locale: intl.locale,
                    });

                    const base64Pass = fromByteArray(
                      getArrayBufferForBlob(pass),
                    );

                    await addPass(base64Pass);
                  } else if (Platform.OS === 'android') {
                    const pass = await getGoogleWalletPass({
                      profileId: fromGlobalId(profile.id).id,
                      locale: intl.locale,
                    });

                    await addPassJWT(pass.token);
                  }
                } catch (e) {
                  console.log({ e });
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

            {profile?.contactCard && (
              <ContactCardExportVcf
                userName={profile.userName}
                contactCard={profile.contactCard}
              />
            )}
          </View>
        </Animated.View>
        {viewer.profile.contactCard && (
          <ContactCardEditModal
            key={viewer.profile.id}
            contactCard={viewer.profile.contactCard}
            visible={contactCardEditModal}
            toggleBottomSheet={toggleContactEditModal}
          />
        )}
      </Container>
    </SafeAreaView>
  );
};

export default relayScreen(ContactCardScreen, {
  query: contactCardMobileScreenQuery,
});

const styleSheet = createStyleSheet(appearance => ({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
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
