import { parsePhoneNumber } from 'libphonenumber-js';
import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Alert, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useMutation, usePreloadedQuery } from 'react-relay';
import ERRORS from '@azzapp/shared/errors';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import relayScreen from '#helpers/relayScreen';
import { useDeleteNotifications } from '#hooks/useNotifications';
import useScreenInsets from '#hooks/useScreenInsets';
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
      id
      email
      phoneNumber
      isPremium
      userSubscription {
        totalSeats
      }
      ...AccountDetailsPasswordForm_currentUser
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

  const intl = useIntl();

  const [commit, isDeleting] = useMutation(graphql`
    mutation AccountDetailsScreenDeleteUserMutation {
      deleteUser {
        id
      }
    }
  `);

  const deleteFcmToken = useDeleteNotifications();

  const deleteMyAccount = useCallback(() => {
    Alert.alert(
      intl.formatMessage({
        defaultMessage: 'Delete account',
        description: 'Title of the alert to delete the user account',
      }),
      intl.formatMessage({
        defaultMessage:
          'Are you sure you want to delete your account? This action is irreversible.',
        description: 'Message of the alert to delete the user account',
      }),
      [
        {
          text: intl.formatMessage({
            defaultMessage: 'Cancel',
            description:
              'Cancel button in the alert to delete the user account',
          }),
          style: 'cancel',
          isPreferred: true,
        },
        {
          text: intl.formatMessage({
            defaultMessage: 'Delete',
            description:
              'Delete button in the alert to delete the user account',
          }),
          style: 'destructive',
          onPress: () => {
            commit({
              variables: {},
              onCompleted: () => {
                deleteFcmToken().finally(() => {
                  void dispatchGlobalEvent({ type: 'SIGN_OUT' });
                });
              },
              onError: (e: Error) => {
                if (e.message === ERRORS.SUBSCRIPTION_IS_ACTIVE) {
                  Toast.show({
                    type: 'error',
                    text1: intl.formatMessage({
                      defaultMessage:
                        "You have an active subscription on this account. You can't delete it.",
                      description:
                        'Error toast message when deleting an account with an active subscription',
                    }),
                  });
                } else {
                  Toast.show({
                    type: 'error',
                    text1: intl.formatMessage({
                      defaultMessage:
                        "Error, couldn't delete your account. Please try again.",
                      description: 'Error toast message when deleting account',
                    }),
                  });
                }
              },
            });
          },
        },
      ],
    );
  }, [commit, deleteFcmToken, intl]);

  const insets = useScreenInsets();

  if (!currentUser) {
    return null;
  }

  return (
    <Container style={{ flex: 1 }}>
      <AccountDetailsHeader />
      <View style={[styles.content, { paddingBottom: insets.bottom }]}>
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
          <View style={styles.sectionField}>
            <Text variant="smallbold">
              <FormattedMessage
                defaultMessage="Plan"
                description="Plan field in the account details screen"
              />
            </Text>
            <Text variant="medium">
              {currentUser?.isPremium &&
                currentUser?.userSubscription?.totalSeats && (
                  <FormattedMessage
                    defaultMessage="azzapp+ {seats} users"
                    description="Plan value in the account details screen with seats"
                    values={{
                      seats: currentUser?.userSubscription?.totalSeats,
                    }}
                  />
                )}
              {currentUser?.isPremium &&
                !currentUser?.userSubscription?.totalSeats && (
                  <FormattedMessage
                    defaultMessage="azzapp+"
                    description="Plan value in the account details screen with no seats"
                  />
                )}
              {!currentUser?.isPremium && (
                <FormattedMessage
                  defaultMessage="Free"
                  description="Plan value in the account details screen for Free"
                />
              )}
            </Text>
          </View>
        </View>
        <PressableNative
          onPress={deleteMyAccount}
          style={styles.removeAccountButton}
          disabled={isDeleting}
        >
          <Text variant="button" style={styles.removeAccountText}>
            <FormattedMessage
              defaultMessage="Delete my account"
              description="Button to delete the user account"
            />
          </Text>
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
        user={currentUser}
        visible={passwordVisible}
        toggleBottomSheet={togglePasswordVisible}
      />
    </Container>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  content: { flex: 1, rowGap: 15 },
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
  removeAccountText: {
    color: colors.red400,
    textAlign: 'center',
  },
  removeAccountButton: {
    height: 32,
    paddingHorizontal: 20,
    justifyContent: 'center',
    marginTop: 'auto',
  },
}));

export default relayScreen(AccountDetailsScreen, {
  query: accountDetailsScreenQuery,
  profileBound: false,
  fallback: AccountDetailsScreenFallback,
});
