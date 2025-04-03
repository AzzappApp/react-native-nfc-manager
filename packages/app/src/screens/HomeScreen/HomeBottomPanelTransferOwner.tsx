import { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, commitMutation } from 'react-relay';
import ERRORS from '@azzapp/shared/errors';
import { PAYMENT_IS_ENABLED } from '#Config';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { onChangeWebCard } from '#helpers/authStore';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import Button from '#ui/Button';
import Text from '#ui/Text';
import type { HomeBottomPanel_user$data } from '#relayArtifacts/HomeBottomPanel_user.graphql';
import type { HomeBottomPanelMessage_profiles$data } from '#relayArtifacts/HomeBottomPanelMessage_profiles.graphql';
import type { HomeBottomPanelTransferOwnerAcceptMutation } from '#relayArtifacts/HomeBottomPanelTransferOwnerAcceptMutation.graphql';
import type { HomeBottomPanelTransferOwnerDeclineMutation } from '#relayArtifacts/HomeBottomPanelTransferOwnerDeclineMutation.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';

const HomeBottomPanelTransferOwner = ({
  profile,
  userSubscription,
}: {
  profile: ArrayItemType<HomeBottomPanelMessage_profiles$data>;
  userSubscription: HomeBottomPanel_user$data['userSubscription'];
}) => {
  const router = useRouter();
  const intl = useIntl();
  const [loading, setLoading] = useState(false);

  const onAcceptOwnership = useCallback(() => {
    if (!profile) {
      return;
    }
    const environment = getRelayEnvironment();

    const acceptOwnershipMutation = graphql`
      mutation HomeBottomPanelTransferOwnerAcceptMutation($profileId: ID!)
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
    setLoading(true);
    commitMutation<HomeBottomPanelTransferOwnerAcceptMutation>(environment, {
      mutation: acceptOwnershipMutation,
      variables: {
        profileId: profile.id,
      },
      onCompleted: (data, error) => {
        setLoading(false);
        if (!error) {
          if (data.acceptOwnership?.profile?.profileRole) {
            onChangeWebCard({
              profileRole: data.acceptOwnership.profile.profileRole,
            });
          }
        }
      },
      onError: error => {
        setLoading(false);
        if (error.message === ERRORS.SUBSCRIPTION_REQUIRED) {
          if (PAYMENT_IS_ENABLED) {
            router.push({
              route: 'USER_PAY_WALL',
            });
          } else {
            Toast.show({
              type: 'error',
              text1: intl.formatMessage(
                {
                  defaultMessage:
                    'You can’t accept ownership of this WebCard{azzappA}.',
                  description:
                    'Error toast message when trying to accept ownership of a WebCard without a subscription on android',
                },
                {
                  azzappA: (
                    <Text style={styles.icon} variant="azzapp">
                      a
                    </Text>
                  ) as unknown as string,
                },
              ),
            });
          }
        } else if (error.message === ERRORS.SUBSCRIPTION_INSUFFICIENT_SEATS) {
          if (userSubscription?.issuer === 'web') {
            Toast.show({
              type: 'error',
              text1: intl.formatMessage({
                defaultMessage:
                  'Please log in to the WebApp to manage your azzapp+ subscription',
                description:
                  'Error message when trying to activate multi-user on mobile when it is configured on the WebApp.',
              }),
            });
          } else if (PAYMENT_IS_ENABLED) {
            router.push({
              route: 'USER_PAY_WALL',
            });
          } else {
            Toast.show({
              type: 'error',
              text1: intl.formatMessage(
                {
                  defaultMessage:
                    'You can’t accept ownership of this WebCard{azzappA}.',
                  description:
                    'Error toast message when trying to accept ownership of a WebCard without a subscription on android',
                },
                {
                  azzappA: (
                    <Text style={styles.icon} variant="azzapp">
                      a
                    </Text>
                  ) as unknown as string,
                },
              ),
            });
          }
        } else {
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'Error while accepting ownership',
              description:
                'Error toast message when accepting ownership on home screen',
            }),
          });
        }
      },
    });
  }, [intl, profile, router, userSubscription?.issuer]);

  const onDeclineOwnership = useCallback(() => {
    if (!profile) {
      return;
    }

    const environment = getRelayEnvironment();

    const declineInvitationMutation = graphql`
      mutation HomeBottomPanelTransferOwnerDeclineMutation($profileId: ID!)
      @raw_response_type {
        declineOwnership(profileId: $profileId) {
          profile {
            id
            promotedAsOwner
          }
        }
      }
    `;

    commitMutation<HomeBottomPanelTransferOwnerDeclineMutation>(environment, {
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
          loading={loading}
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

export default HomeBottomPanelTransferOwner;

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
