import { useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, commitMutation } from 'react-relay';
import { colors } from '#theme';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { getRelayEnvironment } from '#helpers/relayEnvironment';

import Button from '#ui/Button';
import Text from '#ui/Text';
import type { HomeBottomPanelMessage_profiles$data } from '#relayArtifacts/HomeBottomPanelMessage_profiles.graphql';
import type { HomeBottomPanelTransfertOwnerAceeptMutation } from '#relayArtifacts/HomeBottomPanelTransfertOwnerAceeptMutation.graphql';
import type { HomeBottomPanelTransfertOwnerDeclineMutation } from '#relayArtifacts/HomeBottomPanelTransfertOwnerDeclineMutation.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';

const HomeBottomPanelTransfertOwner = ({
  profile,
}: {
  profile: ArrayItemType<HomeBottomPanelMessage_profiles$data>;
}) => {
  const onAcceptOwnership = useCallback(() => {
    if (!profile) {
      return;
    }
    const environment = getRelayEnvironment();

    const acceptOwnershipMutation = graphql`
      mutation HomeBottomPanelTransfertOwnerAceeptMutation($profileId: ID!)
      @raw_response_type {
        acceptOwnership(profileId: $profileId) {
          profile {
            id
            profileRole
            promotedAsOwner
            invited
          }
        }
      }
    `;

    commitMutation<HomeBottomPanelTransfertOwnerAceeptMutation>(environment, {
      mutation: acceptOwnershipMutation,
      variables: {
        profileId: profile.id,
      },
      optimisticResponse: {
        acceptOwnership: {
          profile: {
            id: profile.id,
            profileRole: 'owner',
            promotedAsOwner: false,
            invited: false,
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
  }, [profile]);

  const onDeclineOwnership = useCallback(() => {
    if (!profile) {
      return;
    }

    const environment = getRelayEnvironment();

    const declineInvitationMutation = graphql`
      mutation HomeBottomPanelTransfertOwnerDeclineMutation($profileId: ID!)
      @raw_response_type {
        declineOwnership(profileId: $profileId) {
          profile {
            id
            promotedAsOwner
          }
        }
      }
    `;

    commitMutation<HomeBottomPanelTransfertOwnerDeclineMutation>(environment, {
      mutation: declineInvitationMutation,
      variables: { profileId: profile.id },
      optimisticResponse: {
        declineOwnership: {
          profile: {
            id: profile.id,
            promotedAsOwner: false,
          },
        },
      },
    });
  }, [profile]);

  return (
    <>
      <Text variant="large" style={styles.title}>
        <FormattedMessage
          defaultMessage="Ownership transfer request"
          description="Home Screen - ownership transfer request title"
        />
      </Text>
      <Text variant="medium" style={styles.text}>
        <FormattedMessage
          defaultMessage="{email} wants to transfer the ownership of this WebCard{azzappA} to your"
          description="Home bottom panel transfer ownership request"
          values={{
            email:
              profile?.webCard?.owner?.email ??
              profile?.webCard?.owner?.phoneNumber ??
              '',
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
          onPress={onDeclineOwnership}
        />
      </View>
    </>
  );
};

export default HomeBottomPanelTransfertOwner;

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
    color: colors.white,
    marginHorizontal: 50,
    marginTop: 10,
  },
  title: {
    color: colors.white,
  },
  icon: {
    color: colors.white,
  },
  invitationPanelButton: {
    minWidth: 250,
  },
  invitationButtons: { rowGap: 15, marginTop: 35 },
});
