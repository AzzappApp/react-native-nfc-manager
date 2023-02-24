import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View, Text } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { isNotFalsyString } from '@azzapp/shared/lib/stringHelpers';
import useViewportSize, {
  insetBottom,
  insetTop,
} from '../../hooks/useViewportSize';
import { colors, fontFamilies } from '../../theme';
import Button from '../../ui/Button';
import Form, { Submit } from '../../ui/Form/Form';
import IconButton from '../../ui/IconButton';
import TextInput from '../../ui/TextInput';
import OnBoardingPager from './OnBoardingPager';

type OnBoardingNameProps = {
  next: () => void;
  prev: () => void;
  firstName: string;
  lastName: string;
  setFirstName: (firstName: string) => void;
  setLastName: (lastName: string) => void;
};

export const storage = new MMKV();

const OnBoardingName = ({
  next,
  prev,
  firstName,
  lastName,
  setFirstName,
  setLastName,
}: OnBoardingNameProps) => {
  const vp = useViewportSize();
  const intl = useIntl();

  return (
    <Form
      style={[
        styles.inner,
        {
          paddingTop: vp`${insetTop} + ${90}`,
          marginBottom: vp`${insetBottom} + ${10}`,
          flex: 1,
          justifyContent: 'flex-end',
        },
      ]}
      onSubmit={next}
    >
      <View style={styles.containerIcon}>
        <IconButton icon="back" onPress={prev} style={styles.backIcon} />
        <Text style={styles.titleText}>
          <FormattedMessage
            defaultMessage="What's your name?"
            description="OnBoarding Name Screen - Title"
          />
        </Text>
      </View>
      <OnBoardingPager activeIndex={1} />
      <Text style={styles.subtitleText}>
        <FormattedMessage
          defaultMessage="We need your full name so that we know how to call you"
          description="OnBoarding Name Screen - Subtitle"
        />
      </Text>
      <TextInput
        placeholder={intl.formatMessage({
          defaultMessage: 'Enter your first name',
          description:
            'OnBoarding Name Screen - Enter your first name placeholder',
        })}
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="none"
        autoComplete="name"
        autoCorrect={false}
        containerStyle={styles.textinputContainer}
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Enter your first name',
          description:
            'OnBoarding Name Screen - Accessibility TextInput first name',
        })}
        label={intl.formatMessage({
          defaultMessage: 'First name',
          description:
            'OnBoarding Name Screen - Enter your first name label textinput',
        })}
      />
      <TextInput
        placeholder={intl.formatMessage({
          defaultMessage: 'Enter your last name',
          description:
            'OnBoarding Name Screen - Enter your last name placeholder',
        })}
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="none"
        autoComplete="name-family"
        autoCorrect={false}
        containerStyle={[styles.textinputContainer, { marginBottom: 10 }]}
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Enter your last name',
          description:
            'OnBoarding Name Screen - Accessibility TextInput last name',
        })}
        label={intl.formatMessage({
          defaultMessage: 'Last name',
          description:
            'OnBoarding Name Screen - Enter your last name label textinput',
        })}
      />
      <View style={{ flex: 1 }} />
      <Submit>
        <Button
          label={intl.formatMessage({
            defaultMessage: 'Continue',
            description: 'OnboardingScreen - Continue Button',
          })}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Continue',
            description:
              'OnBoarding Name Screen - AccessibilityLabel Button Continue',
          })}
          style={styles.button}
          disabled={!isNotFalsyString(firstName) || !isNotFalsyString(lastName)}
        />
      </Submit>
    </Form>
  );
};

export default OnBoardingName;

const styles = StyleSheet.create({
  containerIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    marginRight: 50,
  },
  backIcon: { height: 17, width: 10 },
  backContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitleText: {
    ...fontFamilies.fontMedium,
    fontSize: 14,
    marginLeft: 33,
    marginRight: 33,
    textAlign: 'center',
    paddingBottom: 25,
    paddingTop: 20,
    color: colors.grey400,
  },
  titleText: {
    ...fontFamilies.semiBold,
    fontSize: 20,
    flex: 1,
    textAlign: 'center',
    paddingTop: 0,
    color: colors.black,
    textAlignVertical: 'center',
  },
  mainContent: { flex: 1, justifyContent: 'flex-start' },
  inner: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  textinputContainer: {
    padding: 0,
    margin: 0,
    marginBottom: 0,
  },
  button: {
    height: 45,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  back: { color: colors.grey200, marginTop: 23 },
});
