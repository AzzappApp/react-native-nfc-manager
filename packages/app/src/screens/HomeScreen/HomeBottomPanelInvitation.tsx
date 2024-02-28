import { fromGlobalId } from 'graphql-relay';
import { memo, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { graphql, commitMutation } from 'react-relay';
import { colors } from '#theme';
import { getAuthState } from '#helpers/authStore';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import Button from '#ui/Button';
import Text from '#ui/Text';
import type { HomeBottomPanelInvitationAcceptMutation } from '#relayArtifacts/HomeBottomPanelInvitationAcceptMutation.graphql';
import type {
  HomeBottomPanelInvitationDeclineMutation,
  HomeBottomPanelInvitationDeclineMutation$data,
} from '#relayArtifacts/HomeBottomPanelInvitationDeclineMutation.graphql';
import type { HomeBottomPanelMessage_profiles$data } from '#relayArtifacts/HomeBottomPanelMessage_profiles.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { SelectorStoreUpdater } from 'relay-runtime';

type HomeBottomPanelInvitationProps = {
  profile: ArrayItemType<HomeBottomPanelMessage_profiles$data>;
};

const HomeBottomPanelInvitation = ({
  profile,
}: HomeBottomPanelInvitationProps) => {
  const onAcceptInvitation = useCallback(() => {
    if (!profile) {
      return;
    }
    const environment = getRelayEnvironment();

    const acceptInvitationMutation = graphql`
      mutation HomeBottomPanelInvitationAcceptMutation($profileId: ID!)
      @raw_response_type {
        acceptInvitation(profileId: $profileId) {
          profile {
            id
            invited
            profileRole
          }
        }
      }
    `;

    commitMutation<HomeBottomPanelInvitationAcceptMutation>(environment, {
      mutation: acceptInvitationMutation,
      variables: {
        profileId: profile.id,
      },
      optimisticResponse: {
        acceptInvitation: {
          profile: {
            id: profile.id,
            invited: false,
            profileRole: profile?.profileRole ?? 'user',
          },
        },
      },
      onCompleted: () => {
        void dispatchGlobalEvent({
          type: 'PROFILE_ROLE_CHANGE',
          payload: {
            profileRole: profile?.profileRole,
          },
        });
      },
    });
  }, [profile]);

  const onDeclineInvitation = useCallback(() => {
    const environment = getRelayEnvironment();

    const declineInvitationMutation = graphql`
      mutation HomeBottomPanelInvitationDeclineMutation($profileId: ID!) {
        declineInvitation(profileId: $profileId) {
          profileId
        }
      }
    `;
    const profileId = getAuthState().profileInfos?.profileId;
    if (profileId) {
      const { id } = fromGlobalId(profileId);

      const updater: SelectorStoreUpdater<
        HomeBottomPanelInvitationDeclineMutation$data
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

      commitMutation<HomeBottomPanelInvitationDeclineMutation>(environment, {
        mutation: declineInvitationMutation,
        variables: { profileId: id },
        optimisticUpdater: updater,
        updater,
      });
    }
  }, []);

  return (
    <>
      <Text variant="large" style={styles.message}>
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
            email: profile?.webCard?.owner?.email ?? '',
            company: profile?.webCard?.userName ?? '',
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
          onPress={onDeclineInvitation}
        />
      </View>
    </>
  );
};

export default memo(HomeBottomPanelInvitation);

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'red',
    borderWidth: 3,
  },
  informationText: {
    textAlign: 'center',
    color: colors.white,
    marginHorizontal: 50,
    marginTop: 10,
  },
  container: { flex: 1 },
  message: {
    color: colors.white,
  },
  icon: {
    color: colors.white,
  },
  warningIcon: {
    tintColor: colors.white,
    marginBottom: 20,
    width: 20,
    height: 20,
  },
  invitationPanelButton: {
    minWidth: 250,
  },
  invitationButtons: { rowGap: 15, marginTop: 35 },
});
