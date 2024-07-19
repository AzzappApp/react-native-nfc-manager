import {
  Suspense,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { ActivityIndicator, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useMutation, usePreloadedQuery } from 'react-relay';
import { isAdmin } from '@azzapp/shared/profileHelpers';
import { colors } from '#theme';
import { CancelHeaderButton } from '#components/commonsButtons';
import CoverRenderer from '#components/CoverRenderer';
import {
  useRouter,
  ScreenModal,
  preventModalDismiss,
} from '#components/NativeRouter';
import PremiumIndicator from '#components/PremiumIndicator';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import relayScreen, { RelayScreenErrorBoundary } from '#helpers/relayScreen';
import useHandleProfileActionError from '#hooks/useHandleProfileError';
import { useMultiUserUpdate } from '#hooks/useMultiUserUpdate';
import useToggle from '#hooks/useToggle';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import HeaderButton from '#ui/HeaderButton';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import PressableNative from '#ui/PressableNative';
import SafeAreaView from '#ui/SafeAreaView';
import Switch from '#ui/Switch';
import Text from '#ui/Text';
import MultiUserScreenUserList from './MultiUserScreenUserList';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { MultiUserScreen_transferOwnershipMutation } from '#relayArtifacts/MultiUserScreen_transferOwnershipMutation.graphql';
import type { MultiUserScreenQuery } from '#relayArtifacts/MultiUserScreenQuery.graphql';
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
  query MultiUserScreenQuery($profileId: ID!) {
    node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        id
        profileRole
        webCard {
          id
          isMultiUser
          ...CoverRenderer_webCard
          nbProfiles
          ...MultiUserScreenUserList_webCard
          subscription {
            id
            endAt
            status
          }
          requiresSubscription
          isPremium
        }
      }
    }
  }
`;

const MultiUserScreen = ({
  preloadedQuery,
}: RelayScreenProps<MultiUserRoute, MultiUserScreenQuery>) => {
  const { node } = usePreloadedQuery(multiUserScreenQuery, preloadedQuery);
  const profile = node?.profile;

  const intl = useIntl();
  const router = useRouter();

  const styles = useStyleSheet(styleSheet);

  useEffect(() => {
    // users that loose their admin role should not be able to access this screen
    if (!isAdmin(profile?.profileRole)) {
      router.back();
    }
  }, [profile?.profileRole, router]);

  const [confirmDeleteMultiUser, setConfirmDeleteMultiUser] = useState(false);

  const onCompleted = useCallback(() => {
    setConfirmDeleteMultiUser(false);
  }, []);

  const setAllowMultiUser = useMultiUserUpdate(onCompleted);

  const toggleMultiUser = useCallback(
    (value: boolean) => {
      if (
        !profile?.webCard.isPremium &&
        profile?.webCard.subscription &&
        (profile?.webCard.subscription?.status !== 'active' ||
          profile?.webCard.subscription?.endAt < new Date())
      ) {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage:
              'Please log in to the WebApp to manage your azzapp+ subscription',
            description:
              'Error message when trying to activate multi-user on mobile when it is configured on the WebApp.',
          }),
          props: {
            showClose: true,
          },
        });
        return;
      }
      if (!profile?.webCard.isPremium && value) {
        router.push({
          route: 'USER_PAY_WALL',
          params: {
            activateFeature: 'MULTI_USER',
          },
        });
        return;
      }
      if (value) {
        setAllowMultiUser(value);
      } else {
        setConfirmDeleteMultiUser(true);
      }
    },
    [
      profile?.webCard.isPremium,
      profile?.webCard.subscription,
      intl,
      router,
      setAllowMultiUser,
    ],
  );

  //#region Transfert ownership
  const [transferOwner, savingTransferOwner] =
    useMutation<MultiUserScreen_transferOwnershipMutation>(graphql`
      mutation MultiUserScreen_transferOwnershipMutation(
        $webCardId: ID!
        $input: TransferOwnershipInput!
      ) {
        transferOwnership(webCardId: $webCardId, input: $input) {
          profile {
            id
            promotedAsOwner
            user {
              email
              phoneNumber
            }
          }
        }
      }
    `);

  const [selectedProfileId, setSelectedProfileId] = useState<
    string | undefined
  >(undefined);
  const [transferOwnerMode, toggleTransferOwnerMode] = useToggle(false);

  const transferOwnership = useCallback(() => {
    if (selectedProfileId && profile?.webCard?.id) {
      transferOwner({
        variables: {
          webCardId: profile.webCard.id,
          input: {
            profileId: selectedProfileId,
          },
        },
        onCompleted: () => {
          toggleTransferOwnerMode();
          setSelectedProfileId(undefined);
        },
        updater: store => {
          // Get the new profile from the mutation response
          const pendingProfile = store
            .getRootField('transferOwnership')
            .getLinkedRecord('profile');
          const webCardRecord = store.get(profile.webCard.id);
          if (!webCardRecord) {
            return;
          }
          store
            .get(profile.webCard.id)
            ?.setLinkedRecord(pendingProfile, 'profilePendingOwner');
        },
      });
    }
  }, [
    profile?.webCard.id,
    selectedProfileId,
    toggleTransferOwnerMode,
    transferOwner,
  ]);

  //#endRegion

  const ScrollableHeader = useMemo(() => {
    return (
      <View style={{ alignItems: 'center' }}>
        <Icon style={styles.sharedIcon} icon="multi_user" size={140} />
        <Text variant="xsmall" style={styles.description}>
          {transferOwnerMode ? (
            <FormattedMessage
              defaultMessage="You can choose to transfer ownership to an existing WebCard user. The new owner will have full control over the WebCard, including billing responsibility"
              description="Description for MultiUser transfert ownership"
            />
          ) : (
            <FormattedMessage
              defaultMessage="Enhance teamwork: provide each member with a personalized ContactCard{azzappA}, seamlessly connected to the shared WebCard{azzappA}, fostering individual identity within a cohesive system."
              description="Description for MultiUserScreen"
              values={{
                azzappA: <Text variant="azzapp">a</Text>,
              }}
            />
          )}
        </Text>

        <Text variant="smallbold" style={styles.price}>
          <FormattedMessage
            defaultMessage="$0,99/user, billed monthly "
            description="Price for MultiUserScreen"
          />
          {profile?.webCard.isMultiUser && (
            <FormattedMessage
              defaultMessage="{nbUsers} user"
              description="Title for switch section in MultiUserScreen"
              values={{ nbUsers: profile?.webCard?.nbProfiles }}
            />
          )}
        </Text>
        {profile?.profileRole === 'owner' && !transferOwnerMode && (
          <View style={styles.switchSection}>
            <View style={styles.proContainer}>
              <Text variant="large">
                <FormattedMessage
                  defaultMessage="Multi User"
                  description="Title for switch section in MultiUserScreen"
                />
              </Text>
              <PremiumIndicator isRequired={!profile?.webCard.isPremium} />
            </View>
            <Switch
              variant="large"
              value={profile?.webCard.isMultiUser}
              onValueChange={toggleMultiUser}
            />
          </View>
        )}
      </View>
    );
  }, [
    profile?.profileRole,
    profile?.webCard.isMultiUser,
    profile?.webCard.isPremium,
    profile?.webCard?.nbProfiles,
    styles.description,
    styles.price,
    styles.proContainer,
    styles.sharedIcon,
    styles.switchSection,
    toggleMultiUser,
    transferOwnerMode,
  ]);

  if (!profile) {
    return null;
  }

  return (
    <Container style={{ flex: 1 }}>
      <SafeAreaView
        style={{ flex: 1 }}
        edges={{ bottom: 'off', top: 'additive' }}
      >
        {transferOwnerMode ? (
          <Header
            middleElement={intl.formatMessage({
              defaultMessage: 'Transfer Ownership',
              description:
                'MultiUserScreen - Multi user Transfer Ownership header title',
            })}
            leftElement={
              <CancelHeaderButton
                onPress={toggleTransferOwnerMode}
                disabled={savingTransferOwner}
              />
            }
            rightElement={
              <HeaderButton
                variant="primary"
                disabled={!selectedProfileId || savingTransferOwner}
                label={intl.formatMessage({
                  defaultMessage: 'Transfer',
                  description:
                    'MultiUser Screen - Transfer owner header button label',
                })}
                onPress={transferOwnership}
              />
            }
          />
        ) : (
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
        )}

        <View style={styles.content}>
          {profile.webCard.isMultiUser ? (
            <Suspense
              fallback={
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ActivityIndicator />
                </View>
              }
            >
              <MultiUserTransferOwnerContext.Provider
                value={{
                  selectedProfileId,
                  setSelectedProfileId,
                  transferOwnerMode,
                  toggleTransferOwnerMode,
                }}
              >
                <MultiUserScreenUserList
                  Header={ScrollableHeader}
                  webCard={profile.webCard}
                />
              </MultiUserTransferOwnerContext.Provider>
            </Suspense>
          ) : (
            <>{ScrollableHeader}</>
          )}
        </View>
      </SafeAreaView>

      <ScreenModal
        visible={confirmDeleteMultiUser}
        gestureEnabled={false}
        onRequestDismiss={preventModalDismiss}
      >
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
                  defaultMessage="If you deactivate the Multi-User, other collaborators will no longer be able to access this WebCard{azzappA} or their linked ContactCards{azzappA}. This action is irreversible."
                  description="Description for confirm delete multi user modal"
                  values={{
                    azzappA: <Text variant="azzapp">a</Text>,
                  }}
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

const styleSheet = createStyleSheet(appearance => ({
  sharedIcon: {
    margin: 'auto',
    marginTop: 15,
  },
  content: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 10,
    flex: 1,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 50,
    color: appearance === 'light' ? colors.grey900 : colors.grey300,
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
  proContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

export default relayScreen(
  (props: RelayScreenProps<MultiUserRoute, MultiUserScreenQuery>) => {
    const intl = useIntl();

    const handleProfileActionError = useHandleProfileActionError(
      intl.formatMessage({
        defaultMessage: 'An error occured',
        description:
          'Error toast message when loading MultiUserScreen fails for unknown reason.',
      }) as string,
    );

    return (
      <RelayScreenErrorBoundary
        onError={handleProfileActionError}
        fallback={null}
      >
        <MultiUserScreen {...props} />
      </RelayScreenErrorBoundary>
    );
  },
  {
    query: multiUserScreenQuery,
    getVariables: (_, profileInfos) => ({
      profileId: profileInfos?.profileId ?? '',
    }),
    fetchPolicy: 'store-and-network',
  },
);

type MultiUserTransferOwnerContextProps = {
  selectedProfileId: string | undefined;
  setSelectedProfileId: (id: string) => void;
  transferOwnerMode: boolean;
  toggleTransferOwnerMode: () => void;
};

export const MultiUserTransferOwnerContext =
  createContext<MultiUserTransferOwnerContextProps>({
    selectedProfileId: undefined,
    setSelectedProfileId: () => {},
    transferOwnerMode: false,
    toggleTransferOwnerMode: () => {},
  });
