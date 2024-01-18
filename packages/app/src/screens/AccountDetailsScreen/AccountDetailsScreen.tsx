import { parsePhoneNumber } from 'libphonenumber-js';
import { FormattedMessage } from 'react-intl';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, usePreloadedQuery } from 'react-relay';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import relayScreen from '#helpers/relayScreen';
import useToggle from '#hooks/useToggle';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import AccountDetailsEmailForm from './AccountDetailsEmailForm';
import AccountDetailsHeader from './AccountDetailsHeader';
import AccountDetailsPasswordForm from './AccountDetailsPasswordForm';
import AccountDetailsPhoneNumberForm from './AccountDetailsPhoneNumberForm';
import AccountDetailsScreenFallback from './AccountDetailsScreenFallback';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { AccountDetailsScreenQuery } from '#relayArtifacts/AccountDetailsScreenQuery.graphql';
import type { AccountDetailsRoute } from '#routes';

const accountDetailsScreenQuery = graphql`
  query AccountDetailsScreenQuery {
    currentUser {
      email
      phoneNumber
    }
  }
`;

const AccountDetailsScreen = ({
  preloadedQuery,
}: RelayScreenProps<AccountDetailsRoute, AccountDetailsScreenQuery>) => {
  const preloaded = usePreloadedQuery(
    accountDetailsScreenQuery,
    preloadedQuery,
  );

  const currentUser = preloaded.currentUser;

  const [emailsFormVisible, toggleEmailsFormVisible] = useToggle(false);
  const [phoneNumberFormVisible, togglePhoneNumberFormVisible] =
    useToggle(false);
  const [passwordVisible, togglePasswordVisible] = useToggle(false);

  const styles = useStyleSheet(styleSheet);

  if (!currentUser) {
    return null;
  }

  return (
    <Container style={{ flex: 1 }}>
      <SafeAreaView
        style={{
          flex: 1,
          rowGap: 15,
        }}
      >
        <AccountDetailsHeader />
        <Icon icon="information" style={styles.warningIcon} />
        <View style={{ rowGap: 20, paddingHorizontal: 10 }}>
          <Text variant="xsmall" style={styles.warningMessage}>
            <FormattedMessage
              defaultMessage="Your account details are linked to all your webcards{azzappA}."
              description="Warning label displayed at the top on the screen to indicate that updates go through all profiles"
              values={{
                azzappA: <Text variant="azzapp">a</Text>,
              }}
            />
          </Text>
          <View style={styles.section}>
            <Text variant="xsmall" style={styles.sectionTitle}>
              <FormattedMessage
                defaultMessage="Details"
                description="Title of the section where user can view their account details"
              />
            </Text>
          </View>
          <PressableNative
            style={styles.sectionField}
            onPress={toggleEmailsFormVisible}
          >
            <Text variant="smallbold">
              <FormattedMessage
                defaultMessage="Email"
                description="Email field in the account details screen"
              />
            </Text>
            <Text
              variant="medium"
              style={
                currentUser.email ? undefined : styles.sectionFieldPlaceholder
              }
            >
              {currentUser?.email ?? (
                <FormattedMessage
                  defaultMessage="Add an email address"
                  description="placeholder in account details screen when no email address is registered"
                />
              )}
            </Text>
          </PressableNative>
          <PressableNative
            onPress={togglePhoneNumberFormVisible}
            style={styles.sectionField}
          >
            <Text variant="smallbold">
              <FormattedMessage
                defaultMessage="Phone"
                description="Phone field in the account details screen"
              />
            </Text>
            <Text
              variant="medium"
              style={
                currentUser.phoneNumber
                  ? undefined
                  : styles.sectionFieldPlaceholder
              }
            >
              {currentUser?.phoneNumber ? (
                parsePhoneNumber(currentUser.phoneNumber).formatNational()
              ) : (
                <FormattedMessage
                  defaultMessage="Add a phone number"
                  description="placeholder in account details screen when no phone number is registered"
                />
              )}
            </Text>
          </PressableNative>
          <PressableNative
            onPress={togglePasswordVisible}
            style={styles.sectionField}
          >
            <Text variant="smallbold">
              <FormattedMessage
                defaultMessage="Password"
                description="Password field in the account details screen"
              />
            </Text>
            <Text variant="medium">••••••••••</Text>
          </PressableNative>
        </View>
        <AccountDetailsEmailForm
          currentUser={currentUser}
          visible={emailsFormVisible}
          toggleBottomSheet={toggleEmailsFormVisible}
        />
        <AccountDetailsPhoneNumberForm
          currentUser={currentUser}
          visible={phoneNumberFormVisible}
          toggleBottomSheet={togglePhoneNumberFormVisible}
        />
        <AccountDetailsPasswordForm
          visible={passwordVisible}
          toggleBottomSheet={togglePasswordVisible}
        />
      </SafeAreaView>
    </Container>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  warningIcon: { width: 50, height: 50, alignSelf: 'center' },
  warningMessage: { width: 255, textAlign: 'center', alignSelf: 'center' },
  section: {
    backgroundColor: appearance === 'light' ? colors.grey100 : colors.grey800,
    height: 28,
    borderRadius: 12,
    justifyContent: 'center',
  },
  sectionTitle: {
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  sectionField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 32,
    alignItems: 'center',
  },
  sectionFieldPlaceholder: {
    color: colors.grey200,
  },
  icon: {
    textTransform: 'lowercase',
  },
}));

export default relayScreen(AccountDetailsScreen, {
  query: accountDetailsScreenQuery,
  profileBound: false,
  fallback: AccountDetailsScreenFallback,
});
