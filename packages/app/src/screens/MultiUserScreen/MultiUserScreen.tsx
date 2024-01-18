import { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, useMutation, usePreloadedQuery } from 'react-relay';
import { colors, textStyles } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import { useRouter } from '#components/NativeRouter';
import ScreenModal from '#components/ScreenModal';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import useToggle from '#hooks/useToggle';
import { get as CappedPixelRatio } from '#relayProviders/CappedPixelRatio.relayprovider';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import Switch from '#ui/Switch';
import Text from '#ui/Text';
import CommonInformationForm from './CommonInformationForm';
import MultiUserScreenUserList, {
  type MultiUserScreenListProps,
} from './MultiUserScreenUserList';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { MultiUserScreenMutation } from '#relayArtifacts/MultiUserScreenMutation.graphql';
import type {
  MultiUserScreenQuery,
  ProfileRole,
} from '#relayArtifacts/MultiUserScreenQuery.graphql';
import type { MultiUserRoute } from '#routes';
import type { ContactCard } from '@azzapp/shared/contactCardHelpers';

export type UserInformation = {
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

const multiUserScreenQuery = graphql`
  query MultiUserScreenQuery($profileId: ID!, $pixelRatio: Float!) {
    currentUser {
      ...MultiUserScreenUserList_currentUser
    }
    node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        id
        profileRole
        webCard {
          id
          isMultiUser
          ...CoverRenderer_webCard
          commonInformation {
            ...CommonInformationForm_data
          }
          profiles {
            id
            contactCard {
              firstName
              lastName
              title
              company
              emails {
                label
                address
                selected
              }
              phoneNumbers {
                label
                number
                selected
              }
              urls {
                address
                selected
              }
              addresses {
                address
                label
                selected
              }
              birthday {
                birthday
                selected
              }
              socials {
                url
                label
                selected
              }
            }
            user {
              email
              phoneNumber
            }
            profileRole
            avatar {
              id
              uri: uri(width: 56, pixelRatio: $pixelRatio)
            }
            statsSummary {
              day
              contactCardScans
            }
            webCard {
              statsSummary {
                day
                webCardViews
                likes
              }
            }
          }
        }
        ...MultiUserScreenUserList_profile
      }
    }
  }
`;

const MultiUserScreen = ({
  preloadedQuery,
}: RelayScreenProps<MultiUserRoute, MultiUserScreenQuery>) => {
  const { node, currentUser } = usePreloadedQuery(
    multiUserScreenQuery,
    preloadedQuery,
  );
  const profile = node?.profile;

  const intl = useIntl();
  const router = useRouter();

  const nbUsers = profile?.webCard?.profiles?.length ?? 0;

  const userProfilesByRole = useMemo(() => {
    const indexedRoles = roles.reduce(
      (accumulator, currentValue) => {
        return {
          ...accumulator,
          [currentValue]: [],
        };
      },
      {} as MultiUserScreenListProps['usersByRole'],
    );

    if (!profile?.webCard.profiles) return indexedRoles;

    return profile.webCard.profiles.reduce((accumulator, currentValue) => {
      const { user, contactCard, avatar, id } = currentValue!;

      accumulator[currentValue!.profileRole].push({
        email: user.email!,
        firstName: contactCard?.firstName ?? '',
        lastName: contactCard?.lastName ?? '',
        phoneNumber: user?.phoneNumber ?? '',
        contactCard: (contactCard ?? {}) as ContactCard,
        avatar,
        profileId: id,
      });
      return accumulator;
    }, indexedRoles);
  }, [profile?.webCard.profiles]);

  const [commonInfoFormIsOpened, toggleCommonInfoForm] = useToggle(false);

  const [commit] = useMutation<MultiUserScreenMutation>(graphql`
    mutation MultiUserScreenMutation($input: UpdateMultiUserInput!) {
      updateMultiUser(input: $input) {
        webCard {
          id
          isMultiUser
        }
      }
    }
  `);

  const [confirmDeletMultiUser, setConfirmDeleteMultiUser] = useState(false);

  const setAllowMultiUser = useCallback(
    (value: boolean) => {
      if (profile?.webCard) {
        commit({
          variables: {
            input: { isMultiUser: value, webCardId: profile?.webCard?.id },
          },
          optimisticResponse: {
            updateMultiUser: {
              webCard: {
                id: profile?.webCard?.id,
                isMultiUser: value,
              },
            },
          },
          updater: store => {
            if (!value && profile?.webCard?.id) {
              const webCard = store.get(profile?.webCard?.id);
              if (webCard) {
                const profiles = webCard.getLinkedRecords('profiles');
                webCard.setLinkedRecords(
                  profiles?.filter(p => p.getDataID() === profile?.id) ?? [],
                  'profiles',
                );
              }
            }
          },
          onCompleted: () => {
            setConfirmDeleteMultiUser(false);
          },
        });
      }
    },
    [commit, profile?.id, profile?.webCard],
  );

  const toggleMultiUser = useCallback(
    (value: boolean) => {
      if (value) {
        setAllowMultiUser(value);
      } else {
        setConfirmDeleteMultiUser(true);
      }
    },
    [setAllowMultiUser],
  );

  const { bottom } = useScreenInsets();

  return (
    <Container style={{ flex: 1 }}>
      <SafeAreaView
        style={{ flex: 1 }}
        edges={{ bottom: 'off', top: 'additive' }}
      >
        <Header
          middleElement={intl.formatMessage({
            defaultMessage: 'Multi user',
            description: 'MultiUserScreen - Multi user title',
          })}
          rightElement={
            <PressableNative
              onPress={router.back}
              accessibilityRole="link"
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Go back',
                description: 'Go back button in multi user header',
              })}
            >
              <CoverRenderer
                webCard={profile?.webCard}
                width={COVER_WIDTH}
                style={{ marginBottom: -1 }}
              />
            </PressableNative>
          }
          leftElement={
            <IconButton
              icon="arrow_left"
              onPress={router.back}
              iconSize={28}
              variant="icon"
            />
          }
        />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: bottom }}
        >
          <View style={styles.content}>
            <Icon style={styles.sharedIcon} icon="multi_user" />
            <Text style={[textStyles.xsmall, styles.description]}>
              <FormattedMessage
                defaultMessage="Allow your team members to have their own personal Contact Cards, connected to the same company or organisation’s WebCard."
                description="Description for MultiUserScreen"
              />
            </Text>

            <Text style={[textStyles.smallbold, styles.price]}>
              <FormattedMessage
                defaultMessage="$0,99/user, billed monthly "
                description="Price for MultiUserScreen"
              />
              {profile?.webCard.isMultiUser && (
                <FormattedMessage
                  defaultMessage="{nbUsers} user"
                  description="Title for switch section in MultiUserScreen"
                  values={{ nbUsers }}
                />
              )}
            </Text>
            {profile?.profileRole === 'owner' && (
              <View style={styles.switchSection}>
                <Text style={[textStyles.large]}>
                  <FormattedMessage
                    defaultMessage="Multi User"
                    description="Title for switch section in MultiUserScreen"
                  />
                </Text>
                <Switch
                  variant="large"
                  value={profile?.webCard.isMultiUser}
                  onValueChange={toggleMultiUser}
                />
              </View>
            )}
            {profile?.webCard.isMultiUser && currentUser && (
              <MultiUserScreenUserList
                usersByRole={userProfilesByRole}
                currentUser={currentUser}
                toggleCommonInfosForm={toggleCommonInfoForm}
                profile={profile}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {profile ? (
        <CommonInformationForm
          commonInfoFormIsOpened={commonInfoFormIsOpened}
          toggleCommonInfoForm={toggleCommonInfoForm}
          commonInformation={profile.webCard.commonInformation}
          webCardId={profile.webCard.id}
        />
      ) : null}
      <ScreenModal visible={confirmDeletMultiUser}>
        <Container style={styles.confirmModalContainer}>
          <View style={styles.confirmModalContentContainer}>
            <Icon icon="warning" style={styles.confirmModalIcon} />
            <View style={styles.confirmModalSections}>
              <Text variant="large">
                <FormattedMessage
                  defaultMessage="Deactivate multi user ?"
                  description="Title for confirm delete multi user modal"
                />
              </Text>
              <Text variant="medium">
                <FormattedMessage
                  defaultMessage="By deactivating multi user, you will delete the Contact Cards of your team members."
                  description="Description for confirm delete multi user modal"
                />
              </Text>

              <View style={styles.confirmModalButtonsContainer}>
                <Button
                  onPress={() => setAllowMultiUser(false)}
                  variant="primary"
                  label={intl.formatMessage({
                    defaultMessage: 'Deactivate',
                    description: 'Button label for confirm delete multi user',
                  })}
                  style={styles.confirmModalButton}
                />
                <Button
                  onPress={() => setConfirmDeleteMultiUser(false)}
                  variant="secondary"
                  label={intl.formatMessage({
                    defaultMessage: 'Cancel',
                    description: 'Button label for confirm delete multi user',
                  })}
                  style={styles.confirmModalButton}
                />
              </View>
            </View>
          </View>
        </Container>
      </ScreenModal>
    </Container>
  );
};

const COVER_WIDTH = 29;
const roles: ProfileRole[] = ['owner', 'admin', 'editor', 'user'];

const styles = StyleSheet.create({
  sharedIcon: {
    height: 140,
    margin: 'auto',
    marginTop: 15,
  },
  content: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 10,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 50,
    color: colors.grey900,
  },
  price: {
    textAlign: 'center',
    color: colors.grey400,
    paddingHorizontal: 50,
    marginTop: 20,
  },
  switchSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  confirmModalContainer: { flex: 1, justifyContent: 'center' },
  confirmModalIcon: { width: 60, height: 60 },
  confirmModalButtonsContainer: { rowGap: 10 },
  confirmModalButton: { width: 255 },
  confirmModalContentContainer: { alignItems: 'center' },
  confirmModalSections: {
    rowGap: 20,
    maxWidth: 295,
    marginTop: 10,
    alignItems: 'center',
  },
});

export default relayScreen(MultiUserScreen, {
  query: multiUserScreenQuery,
  getVariables: (_, profileInfos) => ({
    profileId: profileInfos?.profileId ?? '',
    pixelRatio: CappedPixelRatio(),
  }),
  fetchPolicy: 'store-and-network',
});
