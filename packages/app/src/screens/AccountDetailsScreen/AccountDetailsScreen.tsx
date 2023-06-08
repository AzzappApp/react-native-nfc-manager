import { parsePhoneNumber } from 'libphonenumber-js';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors } from '#theme';
import AccountHeader from '#components/AccountHeader';
import useToggle from '#hooks/useToggle';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import AccountDetailsEmailForm from './AccountDetailsEmailForm';
import AccountDetailsPasswordForm from './AccountDetailsPasswordForm';
import AccountDetailsPhoneNumberForm from './AccountDetailsPhoneNumberForm';
import type { AccountDetailsScreen_query$key } from '@azzapp/relay/artifacts/AccountDetailsScreen_query.graphql';

const AccountDetailsScreen = ({
  data,
}: {
  data: AccountDetailsScreen_query$key;
}) => {
  const { currentUser, viewer } = useFragment(
    graphql`
      fragment AccountDetailsScreen_query on Query {
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
    `,
    data,
  );

  const profile = viewer?.profile;

  const [emailsFormVisible, toggleEmailsFormVisible] = useToggle(false);
  const [phoneNumberFormVisible, togglePhoneNumberFormVisible] =
    useToggle(false);
  const [passwordVisible, togglePasswordVisible] = useToggle(false);

  const intl = useIntl();

  return (
    <View
      style={{
        flex: 1,
        rowGap: 15,
      }}
    >
      <AccountHeader
        userName={profile?.userName}
        profile={viewer.profile}
        title={intl.formatMessage({
          defaultMessage: 'Account details',
          description:
            'Title of the account details screen where user can change their email, phone number ...',
        })}
      />
      <Icon icon="warning" style={styles.warningIcon} />
      <View style={{ rowGap: 20, paddingHorizontal: 10 }}>
        <Text variant="xsmall" style={styles.warningMessage}>
          <FormattedMessage
            defaultMessage="Your account details are linked to all your webcards."
            description="Warning label displayed at the top on the screen to indicate that updates go through all profiles"
          />
        </Text>
        <View style={styles.section}>
          <Text variant="xsmall" style={styles.sectionTitle}>
            <FormattedMessage
              defaultMessage="Webcard details"
              description="Title of the section where user can view their webcard details"
            />
          </Text>
        </View>
        <View style={styles.sectionField}>
          <Text variant="smallbold">
            <FormattedMessage
              defaultMessage="Username"
              description="Username field in the account details screen"
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
    </View>
  );
};

const styles = StyleSheet.create({
  warningIcon: { width: 50, height: 50, alignSelf: 'center' },
  warningMessage: { width: 255, textAlign: 'center', alignSelf: 'center' },
  section: {
    backgroundColor: colors.grey100,
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
});

export default AccountDetailsScreen;
