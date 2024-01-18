import { parsePhoneNumber } from 'libphonenumber-js';
import { Fragment, useRef } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors, textStyles } from '#theme';
import { MEDIA_WIDTH } from '#components/AuthorCartouche';
import { MediaImageRenderer } from '#components/medias';
import { useRouter } from '#components/NativeRouter';
import Button from '#ui/Button';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Separation from '#ui/Separation';
import Text from '#ui/Text';
import Avatar from './Avatar';
import MultiUserDetailModal from './MultiUserDetailModal';
import type { EmailPhoneInput } from '#components/EmailOrPhoneInput';
import type { ProfileRole } from '#relayArtifacts/MultiUserScreenQuery.graphql';
import type { MultiUserScreenUserList_currentUser$key } from '#relayArtifacts/MultiUserScreenUserList_currentUser.graphql';
import type { MultiUserScreenUserList_profile$key } from '#relayArtifacts/MultiUserScreenUserList_profile.graphql';
import type { MultiUserDetailModalActions } from './MultiUserDetailModal';
import type { ContactCard } from '@azzapp/shared/contactCardHelpers';

type UserInformation = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  avatar: {
    id: string;
    uri: string;
  } | null;
  contactCard: ContactCard;
  profileId: string;
};

export type MultiUserScreenListProps = {
  usersByRole: Record<ProfileRole, UserInformation[]>;
  currentUser: MultiUserScreenUserList_currentUser$key;
  profile: MultiUserScreenUserList_profile$key;
  toggleCommonInfosForm: () => void;
};

const MultiUserScreenUserList = ({
  usersByRole,
  currentUser: currentUserKey,
  profile: profileKey,
  toggleCommonInfosForm,
}: MultiUserScreenListProps) => {
  const intl = useIntl();
  const router = useRouter();

  const currentUser = useFragment(
    graphql`
      fragment MultiUserScreenUserList_currentUser on User {
        email
        phoneNumber
      }
    `,
    currentUserKey,
  );

  const profile = useFragment(
    graphql`
      fragment MultiUserScreenUserList_profile on Profile {
        id
        webCard {
          ...MultiUserDetailModal_webCard
          profiles {
            id
            ...HomeStatistics_profiles
          }
          commonInformation {
            company
            addresses {
              address
            }
            emails {
              address
            }
            phoneNumbers {
              number
            }
            urls {
              address
            }
            socials {
              url
            }
          }
        }
      }
    `,
    profileKey,
  );

  // @TODO
  const nbCommonInformation =
    (profile?.webCard.commonInformation?.company ? 1 : 0) +
    (profile?.webCard.commonInformation?.addresses?.some(a => a.address)
      ? 1
      : 0) +
    (profile?.webCard.commonInformation?.emails?.some(a => a.address) ? 1 : 0) +
    (profile?.webCard.commonInformation?.phoneNumbers?.some(p => p.number)
      ? 1
      : 0) +
    (profile?.webCard.commonInformation?.urls?.some(u => u.address) ? 1 : 0) +
    (profile?.webCard.commonInformation?.socials?.some(s => s.url) ? 1 : 0);

  const onAddUsers = () => {
    router.push({ route: 'MULTI_USER_ADD' });
  };

  const detail = useRef<MultiUserDetailModalActions>(null);

  return (
    <View style={styles.content}>
      <Button
        style={styles.button}
        label={intl.formatMessage({
          defaultMessage: 'Add users',
          description: 'Button to add new users from MultiUserScreen',
        })}
        onPress={onAddUsers}
      />
      <Button
        style={styles.button}
        variant="secondary"
        label={`${intl.formatMessage({
          defaultMessage: 'Set common information',
          description:
            'Button to add common information to the contact card in MultiUserScreen',
        })} (${nbCommonInformation})`}
        onPress={toggleCommonInfosForm}
      />
      {Object.entries(usersByRole).map(([key, users]) => {
        const profileRole = key as ProfileRole; // ts infers the key type as string
        return (
          <Fragment key={profileRole}>
            <Separation style={styles.separation}>{profileRole}</Separation>
            {users.map(user => {
              const isCurrentUser =
                user.email === currentUser.email ||
                user.phoneNumber === currentUser.phoneNumber;
              let selectedContact: EmailPhoneInput | null = null;
              if (currentUser.email) {
                selectedContact = {
                  countryCodeOrEmail: 'email',
                  value: currentUser.email,
                };
              } else if (currentUser.phoneNumber) {
                const phoneNumber = parsePhoneNumber(currentUser.phoneNumber);
                if (phoneNumber.isValid()) {
                  selectedContact = {
                    countryCodeOrEmail: phoneNumber.country!,
                    value: phoneNumber.formatInternational()!,
                  };
                }
              }

              return (
                <PressableNative
                  onPress={() => {
                    detail.current?.open(
                      user.contactCard,
                      user.profileId,
                      profileRole,
                      user.avatar,
                      selectedContact,
                    );
                  }}
                  key={user.email}
                  style={styles.user}
                >
                  {user.avatar ? (
                    <MediaImageRenderer
                      source={{
                        uri: user.avatar.uri,
                        mediaId: user.avatar.id ?? '',
                        requestedSize: MEDIA_WIDTH,
                      }}
                      style={styles.avatar}
                    />
                  ) : (
                    <Avatar
                      firstName={user.firstName}
                      lastName={user.lastName}
                    />
                  )}
                  <View style={styles.userInfos}>
                    <Text style={textStyles.large}>
                      ~{user.firstName} {user.lastName}{' '}
                      {isCurrentUser && '(me)'}
                    </Text>
                    <Text style={[styles.contact]}>{user.email}</Text>
                  </View>
                  <Icon icon="arrow_right" />
                </PressableNative>
              );
            })}
          </Fragment>
        );
      })}
      {profile?.webCard.profiles && (
        <MultiUserDetailModal
          webCard={profile.webCard}
          ref={detail}
          currentProfileId={profile.id}
          usersByRole={usersByRole}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingTop: 10,
    width: '100%',
  },
  button: {
    width: '100%',
    marginTop: 10,
  },
  separation: {
    marginTop: 20,
  },
  user: {
    marginTop: 20,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfos: {
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: 5,
    flex: 1,
  },
  contact: {
    color: colors.grey400,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
});

export default MultiUserScreenUserList;
