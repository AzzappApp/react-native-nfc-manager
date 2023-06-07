import { parsePhoneNumber } from 'libphonenumber-js';
import { FormattedMessage } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { useRouter } from '#PlatformEnvironment';
import { colors } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import useToggle from '#hooks/useToggle';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import AccountDetailsEmailForm from './AccountDetailsEmailForm';
import AccountDetailsPasswordForm from './AccountDetailsPasswordForm';
import AccountDetailsPhoneNumberForm from './AccountDetailsPhoneNumberForm';
import type { AccountDetailsScreen_query$key } from '@azzapp/relay/artifacts/AccountDetailsScreen_query.graphql';

const COVER_WIDTH = 29;

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
            card {
              backgroundColor
              cover {
                ...CoverRenderer_cover
              }
            }
          }
        }
      }
    `,
    data,
  );

  const router = useRouter();

  const profile = viewer?.profile;

  const [emailsFormVisible, toggleEmailsFormVisible] = useToggle(false);
  const [phoneNumberFormVisible, togglePhoneNumberFormVisible] =
    useToggle(false);
  const [passwordVisible, togglePasswordVisible] = useToggle(false);

  return (
    <View
      style={{
        flex: 1,
        rowGap: 15,
      }}
    >
      <Header
        leftElement={
          <IconButton
            icon="arrow_left"
            onPress={router.back}
            iconSize={28}
            variant="icon"
          />
        }
        middleElement={
          <Text variant="large">
            <FormattedMessage
              defaultMessage="Account details"
              description="Title of the account details screen where user can change their email, phone number ..."
            />
          </Text>
        }
        rightElement={
          profile && (
            <CoverRenderer
              width={COVER_WIDTH}
              userName={profile.userName}
              cover={profile.card?.cover}
              style={
                profile.card?.backgroundColor != null && {
                  backgroundColor: profile.card?.backgroundColor,
                }
              }
            />
          )
        }
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
