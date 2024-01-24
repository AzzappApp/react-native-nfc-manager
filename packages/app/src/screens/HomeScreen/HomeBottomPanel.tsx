import { fromGlobalId } from 'graphql-relay';
import { useState, memo, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { commitMutation, graphql, useFragment } from 'react-relay';
import { isAdmin } from '@azzapp/shared/profileHelpers';
import { colors } from '#theme';
import Link from '#components/Link';
import { useMainTabBarVisibilityController } from '#components/MainTabBar';
import { getAuthState } from '#helpers/authStore';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import Button from '#ui/Button';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import HomeContactCard from './HomeContactCard';
import HomeInformations from './HomeInformations';
import HomeMenu, { HOME_MENU_HEIGHT } from './HomeMenu';
import HomeStatistics from './HomeStatistics';
import type { HomeBottomPanel_user$key } from '#relayArtifacts/HomeBottomPanel_user.graphql';
import type { HomeBottomPanelAcceptInvitationMutation } from '#relayArtifacts/HomeBottomPanelAcceptInvitationMutation.graphql';
import type { HomeBottomPanelAcceptOwnershipMutation } from '#relayArtifacts/HomeBottomPanelAcceptOwnershipMutation.graphql';
import type {
  HomeBottomPanelDeclineInvitationMutation,
  HomeBottomPanelDeclineInvitationMutation$data,
} from '#relayArtifacts/HomeBottomPanelDeclineInvitationMutation.graphql';
import type { HomeBottomPanelDeclineOwnershipMutation } from '#relayArtifacts/HomeBottomPanelDeclineOwnershipMutation.graphql';
import type { HomeBottomPanelPublishMutation } from '#relayArtifacts/HomeBottomPanelPublishMutation.graphql';
import type { HOME_TAB } from './HomeMenu';
import type { SharedValue } from 'react-native-reanimated';
import type { SelectorStoreUpdater } from 'relay-runtime';

type HomeBottomPanelProps = {
  /**
   * the height unit determined at main screen to have a adaptable layout based on screen size
   *
   * @type {number}
   */
  height: number;
  user: HomeBottomPanel_user$key;
  /**
   * current position of the scrolling profile (based on profile index and not scrollValue )
   *
   * @type {SharedValue<number>}
   */
  currentProfileIndexSharedValue: SharedValue<number>;
  /**
   * the current profile index
   *
   * @type {number}
   */
  currentProfileIndex: number;
};

// TODO the way of we handle the mutations has been made when multi-actor environment was used, we should refactor that

const HomeBottomPanel = ({
  user: userKey,
  currentProfileIndexSharedValue,
  currentProfileIndex,
  height,
}: HomeBottomPanelProps) => {
  //#region data
  const user = useFragment(
    graphql`
      fragment HomeBottomPanel_user on User {
        ...HomeContactCard_user
        ...HomeInformations_user
        profiles {
          id
          webCard {
            id
          }
          invited
          profileRole
          promotedAsOwner
          webCard {
            id
            userName
            cardIsPublished
            cardCover {
              title
            }
            webCardCategory {
              id
            }
            owner {
              email
              phoneNumber
            }
          }
          ...HomeStatistics_profiles
        }
      }
    `,
    userKey,
  );
  const { profiles } = user;
  const intl = useIntl();

  const currentProfile = profiles?.[currentProfileIndex];

  const [selectedPanel, setSelectedPanel] = useState<HOME_TAB>('CONTACT_CARD');
  //#endregion

  //#region card publication
  const onPublish = () => {
    const { profileInfos } = getAuthState();

    if (
      !profileInfos ||
      profileInfos.webCardId !== currentProfile?.webCard?.id
    ) {
      return;
    }
    // using disable state with current profile show a disabled style during maybe one secdon
    // (currentProfile is not animated so need to be updated)
    // avoid adding a new interpolation by using this condition
    if (!isAdmin(currentProfile.profileRole)) {
      return;
    }

    const environment = getRelayEnvironment();
    const publishMutation = graphql`
      mutation HomeBottomPanelPublishMutation(
        $input: ToggleWebCardPublishedInput!
      ) @raw_response_type {
        toggleWebCardPublished(input: $input) {
          webCard {
            id
            cardIsPublished
          }
        }
      }
    `;

    commitMutation<HomeBottomPanelPublishMutation>(environment, {
      mutation: publishMutation,
      variables: {
        input: {
          webCardId: currentProfile.webCard.id,
          published: true,
        },
      },
      optimisticResponse: {
        toggleWebCardPublished: {
          webCard: {
            id: currentProfile.webCard.id,
            cardIsPublished: true,
          },
        },
      },
      onCompleted: (_, error) => {
        if (error) {
          // TODO - handle error
          console.log(error);
          return;
        }
        Toast.show({
          type: 'success',
          text1: intl.formatMessage(
            {
              defaultMessage: 'Your WebCard{azzappA} has been published.',
              description: 'Home Screen - webcard published toast',
            },
            {
              azzappA: <Text variant="azzapp">a</Text>,
            },
          ) as string,
        });
      },
      onError: error => {
        console.error(error);
        Toast.show({
          type: 'error',
          text1: intl.formatMessage(
            {
              defaultMessage:
                'Error, could not publish your WebCard{azzappA}, please try again later',
              description:
                'Error message displayed when the publication of the webcard failed in Home Screen',
            },
            {
              azzappA: <Text variant="azzapp">a</Text>,
            },
          ) as string,
        });
      },
    });
  };
  //#endregion

  const onAcceptInvitation = () => {
    const webCardId = getAuthState().profileInfos?.webCardId;
    if (!webCardId || webCardId !== currentProfile?.webCard?.id) {
      return;
    }
    const environment = getRelayEnvironment();

    const acceptInvitationMutation = graphql`
      mutation HomeBottomPanelAcceptInvitationMutation(
        $input: AcceptInvitationInput!
      ) @raw_response_type {
        acceptInvitation(input: $input) {
          profile {
            id
            invited
          }
        }
      }
    `;

    commitMutation<HomeBottomPanelAcceptInvitationMutation>(environment, {
      mutation: acceptInvitationMutation,
      variables: {
        input: {
          profileId: currentProfile.id,
        },
      },
      optimisticResponse: {
        acceptInvitation: {
          profile: {
            id: currentProfile.id,
            invited: false,
          },
        },
      },
    });
  };

  const onDeclineInvitation = (profileId: string) => {
    const environment = getRelayEnvironment();

    const declineInvitationMutation = graphql`
      mutation HomeBottomPanelDeclineInvitationMutation(
        $input: DeclineInvitationInput!
      ) {
        declineInvitation(input: $input) {
          profileId
        }
      }
    `;

    const { id } = fromGlobalId(profileId);

    const updater: SelectorStoreUpdater<
      HomeBottomPanelDeclineInvitationMutation$data
    > = store => {
      const root = store.getRoot();

      const user = root.getLinkedRecord('currentUser');

      const profiles = user?.getLinkedRecords('profiles');

      user?.setLinkedRecords(
        profiles?.filter(p => p.getDataID() !== profileId) ?? [],
        'profiles',
      );
      root.setLinkedRecord(user, 'currentUser');
    };

    commitMutation<HomeBottomPanelDeclineInvitationMutation>(environment, {
      mutation: declineInvitationMutation,
      variables: { input: { profileId: id } },
      optimisticUpdater: updater,
      updater,
    });
  };

  const onAcceptOwnership = () => {
    const webCardId = getAuthState().profileInfos?.webCardId;

    if (!webCardId || webCardId !== currentProfile?.webCard?.id) {
      return;
    }
    const environment = getRelayEnvironment();

    const acceptOwnershipMutation = graphql`
      mutation HomeBottomPanelAcceptOwnershipMutation(
        $input: AcceptOwnershipInput!
      ) @raw_response_type {
        acceptOwnership(input: $input) {
          profile {
            id
            profileRole
            promotedAsOwner
          }
        }
      }
    `;

    commitMutation<HomeBottomPanelAcceptOwnershipMutation>(environment, {
      mutation: acceptOwnershipMutation,
      variables: {
        input: {
          profileId: currentProfile.id,
        },
      },
      optimisticResponse: {
        acceptOwnership: {
          profile: {
            id: currentProfile.id,
            profileRole: 'owner',
            promotedAsOwner: false,
          },
        },
      },
      onCompleted: (data, error) => {
        if (!error) {
          if (data.acceptOwnership?.profile?.profileRole) {
            void dispatchGlobalEvent({
              type: 'PROFILE_ROLE_CHANGE',
              payload: {
                profileRole: data.acceptOwnership.profile.profileRole,
              },
            });
          }
        }
      },
    });
  };

  const onDeclineOwnership = (profileId: string) => {
    const webCardId = getAuthState().profileInfos?.webCardId;

    if (!webCardId || webCardId !== currentProfile?.webCard?.id) {
      return;
    }

    const environment = getRelayEnvironment();

    const declineInvitationMutation = graphql`
      mutation HomeBottomPanelDeclineOwnershipMutation(
        $input: DeclineOwnershipInput!
      ) @raw_response_type {
        declineOwnership(input: $input) {
          profile {
            id
            promotedAsOwner
          }
        }
      }
    `;

    const { id } = fromGlobalId(profileId);

    commitMutation<HomeBottomPanelDeclineOwnershipMutation>(environment, {
      mutation: declineInvitationMutation,
      variables: { input: { profileId: id } },
      optimisticResponse: {
        declineOwnership: {
          profile: {
            id: profileId,
            promotedAsOwner: false,
          },
        },
      },
    });
  };

  //#region panels visibility
  const profilesHasCover = useMemo(
    () => profiles?.map(profile => (profile?.webCard?.cardCover ? 1 : 0)) ?? [],
    [profiles],
  );

  const profilesWebCardPublished = useMemo(
    () =>
      profiles?.map(profile => (profile?.webCard?.cardIsPublished ? 1 : 0)) ??
      [],
    [profiles],
  );

  const profilesIsInvitation = useMemo(
    () => profiles?.map(profile => (profile?.invited ? 1 : 0)) ?? [],
    [profiles],
  );

  const profilesIsAdmin = useMemo(
    () =>
      profiles?.map(profile =>
        profile?.profileRole === 'owner' || profile?.profileRole === 'admin'
          ? 1
          : 0,
      ) ?? [],
    [profiles],
  );

  const profilesIsPromotedAsOwner = useMemo(
    () => profiles?.map(profile => (profile?.promotedAsOwner ? 1 : 0)) ?? [],
    [profiles],
  );

  const webCardOwnerName = useMemo(
    () =>
      profiles?.map(profile => ({
        email: profile?.webCard?.owner?.email ?? '',
        company: profile?.webCard?.userName ?? '',
      })) ?? [],
    [profiles],
  );

  const [invitationLabel, setInvitationLabel] = useState<{
    company: string;
    email: string;
  }>({ company: '', email: '' });

  //Formatted message does not handle well using SharedValue for dynamic content
  useAnimatedReaction(
    () => currentProfileIndexSharedValue.value,
    actual => {
      const index = Math.round(actual);
      runOnJS(setInvitationLabel)(webCardOwnerName[index]);
    },
    [],
  );

  const panelVisibilities = useDerivedValue(() => {
    const currentProfileIndex = currentProfileIndexSharedValue.value;
    const prev = Math.floor(currentProfileIndex);
    const next = Math.ceil(currentProfileIndex);

    const prevHasWebCover = !!profilesHasCover[prev];
    const nextHasWebCover = !!profilesHasCover[next];
    const prevWebCardPublished = !!profilesWebCardPublished[prev];
    const nextWebCardPublished = !!profilesWebCardPublished[next];
    const prevIsInvitation = !!profilesIsInvitation[prev];
    const nextIsInvitation = !!profilesIsInvitation[next];
    const prevIsPromotedAsOwner = !!profilesIsPromotedAsOwner[prev];
    const nextIsPromotedAsOwner = !!profilesIsPromotedAsOwner[next];
    const prevIsAdmin = !!profilesIsAdmin[prev];
    const nextIsAdmin = !!profilesIsAdmin[next];

    const prevIsNewProfile = prev === -1;

    let missingCoverPanelVisible = 0;
    if (prev > -1) {
      missingCoverPanelVisible = interpolate(
        currentProfileIndexSharedValue.value,
        [prev, prev + 0.2, next - 0.2, next],
        [
          prevIsNewProfile || prevHasWebCover ? 0 : 1,
          0,
          0,
          nextHasWebCover ? 0 : 1,
        ],
      );
    }

    const webCardPublishPanelVisible = interpolate(
      currentProfileIndexSharedValue.value,
      [prev, next],
      [
        prevIsNewProfile ||
        prevWebCardPublished ||
        !prevHasWebCover ||
        prevIsInvitation ||
        prevIsPromotedAsOwner
          ? 0
          : 1,
        nextWebCardPublished ||
        !nextHasWebCover ||
        nextIsInvitation ||
        nextIsPromotedAsOwner
          ? 0
          : 1,
      ],
    );

    const webCardPublishButtonVisible = interpolate(
      currentProfileIndexSharedValue.value,
      [prev, prev + 0.2, next - 0.2, next],
      [prevIsAdmin ? 1 : 0, 0, 0, nextIsAdmin ? 1 : 0],
    );

    const invitationPanelVisible = interpolate(
      currentProfileIndexSharedValue.value,
      [prev, next],
      [prevIsInvitation ? 1 : 0, nextIsInvitation ? 1 : 0],
    );

    const promotionPanelVisible = interpolate(
      currentProfileIndexSharedValue.value,
      [prev, next],
      [prevIsPromotedAsOwner ? 1 : 0, nextIsPromotedAsOwner ? 1 : 0],
    );

    let bottomPanelVisible = interpolate(
      currentProfileIndexSharedValue.value,
      [prev, next],
      [
        prevIsNewProfile ||
        !prevWebCardPublished ||
        prevIsInvitation ||
        prevIsPromotedAsOwner
          ? 0
          : 1,
        nextWebCardPublished && !nextIsInvitation && !nextIsPromotedAsOwner
          ? 1
          : 0,
      ],
    );

    // on the last profile, sometimes the value doesn't reach 1
    if (bottomPanelVisible > 0.99) {
      bottomPanelVisible = 1;
    }

    return {
      missingCoverPanelVisible,
      webCardPublishPanelVisible,
      bottomPanelVisible,
      invitationPanelVisible,
      promotionPanelVisible,
      webCardPublishButtonVisible,
    };
  });

  const newCardPanelStyle = useAnimatedStyle(() => {
    if (currentProfileIndexSharedValue.value > 1) {
      return {
        opacity: 0,
        zIndex: 0,
      };
    }
    const newProfilePanelVisible = interpolate(
      currentProfileIndexSharedValue.value,
      [-1, 0],
      [1, 0],
    );
    return {
      opacity: newProfilePanelVisible,
      zIndex: newProfilePanelVisible,
    };
  }, [currentProfileIndexSharedValue]);

  const missingCoverPanelStyle = useAnimatedStyle(() => ({
    opacity: panelVisibilities.value.missingCoverPanelVisible,
    zIndex: panelVisibilities.value.missingCoverPanelVisible,
  }));

  const webCardPublishPanelStyle = useAnimatedStyle(() => ({
    opacity: panelVisibilities.value.webCardPublishPanelVisible,
    zIndex: panelVisibilities.value.webCardPublishPanelVisible,
  }));

  const invitationPanelStyle = useAnimatedStyle(() => ({
    opacity: panelVisibilities.value.invitationPanelVisible,
    zIndex: panelVisibilities.value.invitationPanelVisible,
  }));

  const promotionPanelStyle = useAnimatedStyle(() => ({
    opacity: panelVisibilities.value.promotionPanelVisible,
    zIndex: panelVisibilities.value.promotionPanelVisible,
  }));

  const webCardPublishButtonStyle = useAnimatedStyle(() => ({
    opacity: panelVisibilities.value.webCardPublishButtonVisible,
    zIndex: panelVisibilities.value.webCardPublishButtonVisible,
  }));

  const bottomPanelStyle = useAnimatedStyle(() => ({
    opacity: panelVisibilities.value.bottomPanelVisible,
  }));

  const mainTabBarVisible = useDerivedValue(
    () => panelVisibilities.value.bottomPanelVisible,
  );
  useMainTabBarVisibilityController(mainTabBarVisible);
  //#endregion

  const panelHeight = height - HOME_MENU_HEIGHT;

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={[styles.informationPanel, newCardPanelStyle]}>
        <Text variant="large" style={{ color: colors.white }}>
          <FormattedMessage
            defaultMessage="Create a new WebCard{azzappA}"
            description="Home Screen - Create a new WebCard"
            values={{
              azzappA: (
                <Text variant="azzapp" style={styles.icon}>
                  a
                </Text>
              ),
            }}
          />
        </Text>
        <Text variant="medium" style={styles.informationText}>
          <FormattedMessage
            defaultMessage="Introduce yourself in a new way by creating your own WebCard{azzappA}."
            description="Home Screen - Create a new webcard description"
            values={{
              azzappA: (
                <Text variant="azzapp" style={styles.icon}>
                  a
                </Text>
              ),
            }}
          />
        </Text>
      </Animated.View>

      <Animated.View style={[styles.informationPanel, missingCoverPanelStyle]}>
        <Icon icon="warning" style={styles.warningIcon} />
        <Text variant="large" style={{ color: colors.white }}>
          <FormattedMessage
            defaultMessage="This WebCard{azzappA} needs a cover"
            description="Home Screen - Missing cover title"
            values={{
              azzappA: (
                <Text style={styles.icon} variant="azzapp">
                  a
                </Text>
              ),
            }}
          />
        </Text>
        <Text variant="medium" style={styles.informationText}>
          <FormattedMessage
            defaultMessage="This WebCard{azzappA} has no cover and can’t be published."
            description="Home Screen - Missing cover text"
            values={{
              azzappA: (
                <Text style={styles.icon} variant="azzapp">
                  a
                </Text>
              ),
            }}
          />
        </Text>
        <Link
          route="NEW_WEBCARD"
          params={
            currentProfile?.webCard?.id
              ? { webCardId: currentProfile.webCard.id }
              : undefined
          }
        >
          <Button
            variant="secondary"
            appearance="dark"
            label={
              <FormattedMessage
                defaultMessage="Create your WebCard{azzappA} cover"
                description="Home Screen - Missing cover button"
                values={{
                  azzappA: (
                    <Text style={styles.icon} variant="azzapp">
                      a
                    </Text>
                  ),
                }}
              />
            }
            style={styles.informationPanelButton}
          />
        </Link>
      </Animated.View>

      <Animated.View
        style={[styles.informationPanel, webCardPublishPanelStyle]}
      >
        <Icon icon="warning" style={styles.warningIcon} />
        <Text variant="large" style={{ color: colors.white }}>
          <FormattedMessage
            defaultMessage="This WebCard{azzappA} is not published"
            description="Home Screen - webcard not published title"
            values={{
              azzappA: (
                <Text style={styles.icon} variant="azzapp">
                  a
                </Text>
              ),
            }}
          />
        </Text>
        <Text variant="medium" style={styles.informationText}>
          <FormattedMessage
            defaultMessage="This WebCard{azzappA} has not been published, nobody can see it for the moment."
            description="Home Screen - webcard not published text"
            values={{
              azzappA: (
                <Text style={styles.icon} variant="azzapp">
                  a
                </Text>
              ),
            }}
          />
        </Text>

        <Animated.View style={webCardPublishButtonStyle}>
          <Button
            variant="secondary"
            appearance="dark"
            label={
              <FormattedMessage
                defaultMessage="Publish this WebCard{azzappA}"
                description="Home Screen - webcard not published button"
                values={{
                  azzappA: (
                    <Text style={styles.icon} variant="azzapp">
                      a
                    </Text>
                  ),
                }}
              />
            }
            style={styles.informationPanelButton}
            onPress={onPublish}
          />
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.informationPanel, invitationPanelStyle]}>
        <Text variant="large" style={{ color: colors.white }}>
          <FormattedMessage
            defaultMessage="Invitation"
            description="Home Screen - invitation title"
          />
        </Text>
        <Text variant="medium" style={styles.informationText}>
          <FormattedMessage
            defaultMessage={`{email} invited you to the WebCard{azzappA} {company}`}
            description="Home bottom panel invitation"
            values={{
              ...invitationLabel,
              azzappA: (
                <Text style={styles.icon} variant="azzapp">
                  a
                </Text>
              ),
            }}
          />
        </Text>
        <View style={styles.invitationButtons}>
          <Button
            variant="primary"
            appearance="dark"
            label={
              <FormattedMessage
                defaultMessage="Accept invitation"
                description="Home Screen - Accept invitation button"
              />
            }
            style={styles.invitationPanelButton}
            onPress={onAcceptInvitation}
          />
          <Button
            variant="secondary"
            appearance="dark"
            label={
              <FormattedMessage
                defaultMessage="Decline invitation"
                description="Home Screen - decline invitation button"
              />
            }
            style={styles.invitationPanelButton}
            onPress={() =>
              currentProfile?.id && onDeclineInvitation(currentProfile.id)
            }
          />
        </View>
      </Animated.View>
      <Animated.View style={[styles.informationPanel, promotionPanelStyle]}>
        <Text variant="large" style={{ color: colors.white }}>
          <FormattedMessage
            defaultMessage="Ownership transfer request"
            description="Home Screen - ownership transfer request title"
          />
        </Text>
        <Text variant="medium" style={styles.informationText}>
          <FormattedMessage
            defaultMessage={`{email} wants to transfer the ownership of this WebCard{azzappA} to your`}
            description="Home bottom panel transfer ownership request"
            values={{
              email: currentProfile?.webCard?.owner?.email ?? '',
              azzappA: (
                <Text style={styles.icon} variant="azzapp">
                  a
                </Text>
              ),
            }}
          />
        </Text>
        <View style={styles.invitationButtons}>
          <Button
            variant="primary"
            appearance="dark"
            label={
              <FormattedMessage
                defaultMessage="Accept ownership"
                description="Home Screen - Accept ownership button"
              />
            }
            style={styles.invitationPanelButton}
            onPress={onAcceptOwnership}
          />
          <Button
            variant="secondary"
            appearance="dark"
            label={
              <FormattedMessage
                defaultMessage="Decline"
                description="Home Screen - decline ownership button"
              />
            }
            style={styles.invitationPanelButton}
            onPress={() =>
              currentProfile?.id && onDeclineOwnership(currentProfile.id)
            }
          />
        </View>
      </Animated.View>
      <Animated.View
        style={[styles.bottomPanel, bottomPanelStyle]}
        pointerEvents={
          profilesWebCardPublished[currentProfileIndex] === 1 ? 'auto' : 'none'
        }
      >
        <HomeMenu selected={selectedPanel} setSelected={setSelectedPanel} />

        {selectedPanel === 'CONTACT_CARD' && (
          <HomeContactCard
            user={user}
            height={panelHeight}
            currentProfileIndexSharedValue={currentProfileIndexSharedValue}
          />
        )}
        {selectedPanel === 'STATS' && (
          <HomeStatistics
            user={profiles!}
            height={panelHeight}
            currentProfileIndexSharedValue={currentProfileIndexSharedValue}
            currentUserIndex={currentProfileIndex}
          />
        )}
        {selectedPanel === 'INFORMATION' && (
          <HomeInformations
            user={user}
            height={panelHeight}
            currentProfileIndexSharedValue={currentProfileIndexSharedValue}
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  informationPanel: {
    overflow: 'visible',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  informationText: {
    textAlign: 'center',
    color: colors.white,
    marginHorizontal: 50,
    marginTop: 10,
  },
  warningIcon: {
    tintColor: colors.white,
    marginBottom: 20,
    width: 20,
    height: 20,
  },
  bottomPanel: {
    overflow: 'visible',
    flex: 1,
  },
  informationPanelButton: {
    marginTop: 30,
  },
  invitationButtons: { rowGap: 15, marginTop: 35 },
  invitationPanelButton: {
    minWidth: 250,
  },
  icon: {
    color: colors.white,
  },
});

export default memo(HomeBottomPanel);
