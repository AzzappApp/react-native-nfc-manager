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
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useFragment, graphql } from 'react-relay';
import { colors } from '#theme';
import AccountHeader from '#components/AccountHeader';
import ContactCard from '#components/ContactCard';
import useToggle from '#hooks/useToggle';
import Button from '#ui/Button';
import Container from '#ui/Container';
import PressableNative from '#ui/PressableNative';
import Switch from '#ui/Switch';
import Text from '#ui/Text';
import ContactCardEditModal from './ContactCardEditModal';
import type { ContactCardScreen_viewer$key } from '@azzapp/relay/artifacts/ContactCardScreen_viewer.graphql';

type ContactCardScreenProps = {
  viewer: ContactCardScreen_viewer$key;
};

const defaultTimingParam = {
  duration: 400,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

const ContactCardScreen = ({ viewer }: ContactCardScreenProps) => {
  const { profile } = useFragment(
    graphql`
      fragment ContactCardScreen_viewer on Viewer {
        profile {
          userName
          ...AccountHeader_profile
          ...ContactCard_card
        }
      }
    `,
    viewer,
  );

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
          scale: interpolate(scaleValue.value, [0, 1], [0.73, 1.8]),
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

  return (
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
            <ContactCard userName={profile?.userName ?? ''} profile={profile} />
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
          style={{
            borderRadius: 27,
            height: 29,
          }}
          label={intl.formatMessage({
            defaultMessage: 'Edit card details',
            description: 'Edit card details button label',
          })}
          onPress={toggleContactEditModal}
        />

        <View style={{ width: '100%' }}>
          <View style={styles.publicOptions}>
            <Text variant="large">
              <FormattedMessage
                defaultMessage="Public contact card"
                description="When true the contact card is public"
              />
            </Text>
            <Switch variant="large" />
          </View>
          <Text variant="xsmall">
            <FormattedMessage
              defaultMessage="Anyone can download your contact card from your profile."
              description="Description of the public contact card toggle."
            />
          </Text>
        </View>

        <View style={{ width: '100%' }}>
          <View style={styles.publicOptions}>
            <Text variant="large">
              <FormattedMessage
                defaultMessage="Display on my webcard"
                description="When true the contact card is displayed on the webcard"
              />
            </Text>
            <Switch variant="large" />
          </View>
          <Text variant="xsmall">
            <FormattedMessage
              defaultMessage="Anyone can download your contact card from your profile."
              description="Description of the display on my webcard toggle."
            />
          </Text>
        </View>

        <View style={styles.buttons}>
          <PressableNative style={styles.addToWalletButton}>
            <Image
              source={require('#assets/wallet.png')}
              style={{ position: 'absolute', left: 4, marginVertical: 'auto' }}
            />
            <Text variant="button" style={{ color: colors.white }}>
              <FormattedMessage
                defaultMessage="Add to Apple Wallet"
                description="Add to Apple Wallet button label"
              />
            </Text>
          </PressableNative>
          <Button
            label={intl.formatMessage({
              defaultMessage: 'Share',
              description: 'Share button label',
            })}
          />
        </View>
      </Animated.View>
      <ContactCardEditModal
        visible={contactCardEditModal}
        toggleBottomSheet={toggleContactEditModal}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  header: {
    alignSelf: 'center',
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
});

export default ContactCardScreen;
