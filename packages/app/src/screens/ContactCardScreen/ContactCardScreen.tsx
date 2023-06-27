import { useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  Pressable,
  View,
  useWindowDimensions,
  StyleSheet,
  Image,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, useMutation, usePreloadedQuery } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { colors } from '#theme';
import AccountHeader from '#components/AccountHeader';
import ContactCard from '#components/ContactCard';
import ProfileColorPicker from '#components/ProfileColorPicker';
import relayScreen from '#helpers/relayScreen';
import useToggle from '#hooks/useToggle';
import Button from '#ui/Button';
import ColorPreview from '#ui/ColorPreview';
import Container from '#ui/Container';
import PressableNative from '#ui/PressableNative';
import Switch from '#ui/Switch';
import Text from '#ui/Text';
import ContactCardEditModal from './ContactCardEditModal';
import ContactCardExportVcf from './ContactCardExportVcf';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ContactCardRoute } from '#routes';
import type { ContactCardScreenQuery } from '@azzapp/relay/artifacts/ContactCardScreenQuery.graphql';

const contactCardMobileScreenQuery = graphql`
  query ContactCardScreenQuery {
    viewer {
      profile {
        id
        userName
        ...AccountHeader_profile
        ...ProfileColorPicker_profile
        contactCard {
          public
          isDisplayedOnWebCard
          backgroundStyle {
            backgroundColor
          }
          ...ContactCard_card
          ...ContactCardEditModal_card
          ...ContactCardExportVcf_card
        }
      }
    }
  }
`;

const defaultTimingParam = {
  duration: 400,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

const ContactCardScreen = ({
  preloadedQuery,
}: RelayScreenProps<ContactCardRoute, ContactCardScreenQuery>) => {
  const contactCardData = usePreloadedQuery(
    contactCardMobileScreenQuery,
    preloadedQuery,
  );

  const profile = contactCardData.viewer?.profile;
  const intl = useIntl();

  const fullScreen = useSharedValue<boolean>(false);

  const { height } = useWindowDimensions();

  const scaleValue = useDerivedValue(() => {
    return withDelay(
      fullScreen.value ? 100 : 0,
      withTiming(fullScreen.value ? 1 : 0, {
        ...defaultTimingParam,
        duration: fullScreen.value ? defaultTimingParam.duration : 170,
      }),
    );
  }, [fullScreen.value]);

  const screenModeValue = useDerivedValue(() => {
    return withTiming(fullScreen.value ? 1 : 0, defaultTimingParam);
  }, [fullScreen.value]);

  const style = useAnimatedStyle(
    () => ({
      width: 335,
      transform: [
        {
          scale: interpolate(
            scaleValue.value,
            [0, 1],
            [0.73, Math.min(1.8, (height - 150) / 335)],
          ),
        },
        {
          rotate: `${interpolate(screenModeValue.value, [0, 1], [0, -90])}deg`,
        },
        {
          translateX: interpolate(screenModeValue.value, [0, 1], [0, -130]),
        },
      ],
    }),
    [screenModeValue.value, scaleValue.value],
  );

  const headerStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateY: interpolate(screenModeValue.value, [0, 1], [0, -100]),
        },
      ],
    }),
    [screenModeValue.value],
  );

  const footerStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateY: interpolate(screenModeValue.value, [0, 1], [0, height]),
        },
      ],
    }),
    [screenModeValue.value],
  );

  const [contactCardEditModal, toggleContactEditModal] = useToggle(false);

  const [commit] = useMutation(
    graphql`
      mutation ContactCardScreenMutation($input: SaveContactCardInput!) {
        saveContactCard(input: $input) {
          contactCard {
            public
            isDisplayedOnWebCard
            backgroundStyle {
              backgroundColor
            }
            ...ContactCardEditModal_card
          }
        }
      }
    `,
  );

  const [isPublicCard, setIsPublicCard] = useToggle(false);
  const [isDisplayedOnWebCard, setIsDisplayedOnWebCard] = useToggle(false);

  const [colorPickerVisible, toggleColorPickerVisible] = useToggle(false);

  const [debouncedPublic] = useDebounce(isPublicCard, 500);
  const [debouncedDisplayedOnWebCard] = useDebounce(isDisplayedOnWebCard, 500);

  useEffect(() => {
    commit({
      variables: {
        input: {
          public: debouncedPublic,
          isDisplayedOnWebCard: debouncedPublic && debouncedDisplayedOnWebCard,
        },
      },
      onError: err => {
        console.log(err);
      },
    });
  }, [debouncedPublic, debouncedDisplayedOnWebCard, commit]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Container style={styles.container}>
        <Animated.View style={headerStyle}>
          <AccountHeader
            userName={profile?.userName}
            profile={profile}
            title={intl.formatMessage({
              defaultMessage: 'Contact Card',
              description:
                'Title of the contact card screen, displayed in the header.',
            })}
          />
        </Animated.View>
        {profile && (
          <Pressable onPress={() => (fullScreen.value = !fullScreen.value)}>
            <Animated.View style={[styles.header, style]}>
              <ContactCard
                userName={profile?.userName ?? ''}
                contactCard={profile.contactCard}
              />
            </Animated.View>
          </Pressable>
        )}

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
              color={
                contactCardData.viewer?.profile?.contactCard?.backgroundStyle
                  .backgroundColor ?? colors.black
              }
              colorSize={16}
            />
          </PressableNative>
          {contactCardData.viewer.profile && (
            <ProfileColorPicker
              visible={colorPickerVisible}
              height={400}
              profile={contactCardData.viewer.profile}
              title={intl.formatMessage({
                defaultMessage: ' color',
                description: ' color title in BlockText edition',
              })}
              selectedColor={
                contactCardData.viewer?.profile?.contactCard?.backgroundStyle
                  .backgroundColor ?? colors.black
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
              <FormattedMessage
                defaultMessage="Anyone can download your contact card from your profile."
                description="Description of the public contact card toggle."
              />
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
                  defaultMessage="Anyone can download your contact card from your profile."
                  description="Description of the display on my webcard toggle."
                />
              </Text>
            </Animated.View>
          )}

          <View style={styles.buttons}>
            <PressableNative style={styles.addToWalletButton}>
              <Image
                source={require('#assets/wallet.png')}
                style={{
                  position: 'absolute',
                  left: 4,
                  marginVertical: 'auto',
                }}
              />
              <Text variant="button" style={{ color: colors.white }}>
                <FormattedMessage
                  defaultMessage="Add to Apple Wallet"
                  description="Add to Apple Wallet button label"
                />
              </Text>
            </PressableNative>
            {profile && (
              <ContactCardExportVcf
                profileId={profile.id}
                contactCard={profile?.contactCard}
              />
            )}
          </View>
        </Animated.View>
        {contactCardData.viewer.profile && (
          <ContactCardEditModal
            key={contactCardData.viewer.profile?.id ?? ''}
            contactCard={contactCardData.viewer.profile.contactCard}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  header: {
    alignSelf: 'center',
  },
  editContactCardButton: {
    borderRadius: 27,
    height: 29,
  },
  contactCardDescriptionText: { maxWidth: 255, textAlign: 'center' },
  footer: {
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
  addToWalletButton: {
    width: '100%',
    height: 47,
    borderRadius: 12,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardColorPicker: {
    borderColor: colors.black,
    borderWidth: 1,
    borderRadius: 20,
    padding: 6,
  },
});
