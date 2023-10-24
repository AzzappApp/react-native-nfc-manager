import { parsePhoneNumber } from 'libphonenumber-js';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, usePreloadedQuery } from 'react-relay';
import { colors } from '#theme';
import AccountHeader from '#components/AccountHeader';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import relayScreen from '#helpers/relayScreen';
import useToggle from '#hooks/useToggle';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import AccountDetailsEmailForm from './AccountDetailsEmailForm';
import AccountDetailsPasswordForm from './AccountDetailsPasswordForm';
import AccountDetailsPhoneNumberForm from './AccountDetailsPhoneNumberForm';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { AccountDetailsRoute } from '#routes';
import type { AccountDetailsScreenQuery } from '@azzapp/relay/artifacts/AccountDetailsScreenQuery.graphql';
import type { AccountHeader_profile$key } from '@azzapp/relay/artifacts/AccountHeader_profile.graphql';

const accountDetailsScreenQuery = graphql`
  query AccountDetailsScreenQuery {
    currentUser {
      email
      phoneNumber
    }
    viewer {
      profile {
        userName
        ...AccountHeader_profile
      }
    }
  }
`;

const AccountDetailsScreen = ({
  preloadedQuery,
}: RelayScreenProps<AccountDetailsRoute, AccountDetailsScreenQuery>) => {
  const { currentUser, viewer } = usePreloadedQuery(
    accountDetailsScreenQuery,
    preloadedQuery,
  );

  const profile = viewer?.profile;

  const [emailsFormVisible, toggleEmailsFormVisible] = useToggle(false);
  const [phoneNumberFormVisible, togglePhoneNumberFormVisible] =
    useToggle(false);
  const [passwordVisible, togglePasswordVisible] = useToggle(false);

  const styles = useStyleSheet(styleSheet);

  return (
    <Container style={{ flex: 1 }}>
      <SafeAreaView
        style={{
          flex: 1,
          rowGap: 15,
        }}
      >
        <AccountDetailsHeader profile={profile} />
        <Icon icon="information" style={styles.warningIcon} />
        <View style={{ rowGap: 20, paddingHorizontal: 10 }}>
          <Text variant="xsmall" style={styles.warningMessage}>
            <FormattedMessage
              defaultMessage="Your account details are linked to all your webcards{azzappAp}."
              description="Warning label displayed at the top on the screen to indicate that updates go through all profiles"
              values={{
                azzappAp: <Text variant="azzapp">a</Text>,
              }}
            />
          </Text>
          <View style={styles.section}>
            <Text variant="xsmall" style={styles.sectionTitle}>
              <FormattedMessage
                defaultMessage="Webcard{azzappAp} details"
                description="Title of the section where user can view their webcard details"
                values={{
                  azzappAp: (
                    <Text style={styles.icon} variant="azzapp">
                      a
                    </Text>
                  ),
                }}
              />
            </Text>
          </View>
          <View style={styles.sectionField}>
            <Text variant="smallbold">
              <FormattedMessage
                defaultMessage="Webcard{azzappAp} name"
                description="Webcard name field in the account details screen"
                values={{
                  azzappAp: <Text variant="azzapp">a</Text>,
                }}
              />
            </Text>
            <Text variant="medium">{profile?.userName}</Text>
          </View>
          <View style={styles.section}>
            <Text variant="xsmall" style={styles.sectionTitle}>
              <FormattedMessage
                defaultMessage="Account details"
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

const AccountDetailsHeader = ({
  profile,
}: {
  profile: AccountHeader_profile$key | null;
}) => {
  const intl = useIntl();
  return (
    <AccountHeader
      profile={profile}
      title={intl.formatMessage({
        defaultMessage: 'Account details',
        description:
          'Title of the account details screen where user can change their email, phone number ...',
      })}
    />
  );
};

const AccountDetailsScreenFallback = () => (
  <Container style={{ flex: 1 }}>
    <SafeAreaView
      style={{
        flex: 1,
        rowGap: 15,
      }}
    >
      <AccountDetailsHeader profile={null} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    </SafeAreaView>
  </Container>
);

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
  fallback: AccountDetailsScreenFallback,
});
