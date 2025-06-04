import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, commitMutation } from 'react-relay';
import { colors } from '#theme';
import { onChangeWebCard } from '#helpers/authStore';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import useQuitWebCard from '#hooks/useQuitWebCard';
import Button from '#ui/Button';
import Text from '#ui/Text';
import type { HomeBottomPanelInvitationAcceptMutation } from '#relayArtifacts/HomeBottomPanelInvitationAcceptMutation.graphql';
import type { HomeBottomPanelMessage_user$data } from '#relayArtifacts/HomeBottomPanelMessage_user.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';

type HomeBottomPanelInvitationProps = {
  profile: ArrayItemType<HomeBottomPanelMessage_user$data['profiles']>;
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
      onCompleted: ({ acceptInvitation }) => {
        onChangeWebCard({
          profileRole: acceptInvitation?.profile?.profileRole,
          invited: acceptInvitation?.profile?.invited,
        });
      },
    });
  }, [profile]);

  const intl = useIntl();

  const [quitWebCard, isLoadingQuitWebCard] = useQuitWebCard(
    profile.webCard?.id,
    undefined,
    e => {
      console.error(e);
      Toast.show({
        type: 'error',
        text1: intl.formatMessage({
          defaultMessage:
            "Error, couldn't decline invitation. Please try again.",
          description: 'Error toast message when declining invitation',
        }),
      });
    },
  );

  return (
    <View style={styles.viewContainer}>
      <Text variant="large" style={styles.message}>
        <FormattedMessage
          defaultMessage="Invitation"
          description="Home Screen - invitation title"
        />
      </Text>
      <Text variant="medium" style={styles.informationText}>
        <FormattedMessage
          defaultMessage="{contact} invited you to the WebCard{azzappA} {company}"
          description="Home bottom panel invitation"
          values={{
            contact:
              profile?.invitedBy?.user?.email ||
              profile?.invitedBy?.user?.phoneNumber ||
              profile?.webCard?.owner?.email ||
              profile?.webCard?.owner?.phoneNumber ||
              '',
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
          loading={isLoadingQuitWebCard}
          onPress={quitWebCard}
        />
      </View>
    </View>
  );
};

export default HomeBottomPanelInvitation;

const styles = StyleSheet.create({
  viewContainer: { justifyContent: 'space-between', alignItems: 'center' },
  informationText: {
    textAlign: 'center',
    color: colors.white,
    marginHorizontal: 50,
    marginTop: 10,
  },
  message: {
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
