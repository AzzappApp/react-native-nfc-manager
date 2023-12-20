import { Fragment, useRef } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, useFragment } from 'react-relay';
import { colors, textStyles } from '#theme';
import { useRouter } from '#components/NativeRouter';
import Button from '#ui/Button';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Separation from '#ui/Separation';
import Text from '#ui/Text';
import Avatar from './Avatar';
import MultiUserDetailModal from './MultiUserDetailModal';
import type { MultiUserDetailModalActions } from './MultiUserDetailModal';
import type { ProfileRole } from '@azzapp/relay/artifacts/MultiUserScreenQuery.graphql';
import type { MultiUserScreenUserList_currentUser$key } from '@azzapp/relay/artifacts/MultiUserScreenUserList_currentUser.graphql';
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
  toggleCommonInfosForm: () => void;
  profileId: string;
};

const MultiUserScreenUserList = (props: MultiUserScreenListProps) => {
  const { usersByRole, currentUser: currentUserKey } = props;
  const intl = useIntl();
  const router = useRouter();

  const data = useFragment(
    graphql`
      fragment MultiUserScreenUserList_currentUser on Query {
        currentUser {
          email
          phoneNumber
        }
        viewer {
          profile {
            id
            webCard {
              ...MultiUserDetailModal_webcard
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
        }
      }
    `,
    currentUserKey,
  );

  const {
    currentUser,
    viewer: { profile },
  } = data;

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
        onPress={props.toggleCommonInfosForm}
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

              return (
                <PressableNative
                  onPress={() => {
                    detail.current?.open(
                      {
                        email: user.email,
                        phoneNumber: user.phoneNumber,
                      },
                      user.contactCard,
                      user.profileId,
                      profileRole,
                    );
                  }}
                  key={user.email}
                  style={styles.user}
                >
                  <Avatar firstName={user.firstName} lastName={user.lastName} />
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
          user={profile.webCard}
          ref={detail}
          currentProfileId={data.viewer.profile?.id ?? ''}
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
});

export default MultiUserScreenUserList;
