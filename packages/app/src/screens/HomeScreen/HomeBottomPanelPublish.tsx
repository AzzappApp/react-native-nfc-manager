import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, commitMutation } from 'react-relay';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import PremiumIndicator from '#components/PremiumIndicator';
import { getAuthState } from '#helpers/authStore';
import { profileInfoHasAdminRight } from '#helpers/profileRoleHelper';
import { getRelayEnvironment } from '#helpers/relayEnvironment';
import useHandleProfileActionError from '#hooks/useHandleProfileError';
import useOnSubscriptionError from '#hooks/useOnSubscriptionError';
import Button from '#ui/Button';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import type { HomeBottomPanelMessage_profiles$data } from '#relayArtifacts/HomeBottomPanelMessage_profiles.graphql';
import type { HomeBottomPanelPublishMutation } from '#relayArtifacts/HomeBottomPanelPublishMutation.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';

type HomeBottomPanelPublishProps = {
  profile: ArrayItemType<HomeBottomPanelMessage_profiles$data>;
};

const HomeBottomPanelPublish = ({ profile }: HomeBottomPanelPublishProps) => {
  const intl = useIntl();

  const handleProfileActionError = useHandleProfileActionError(
    intl.formatMessage(
      {
        defaultMessage:
          'Error, could not publish your WebCard{azzappA}, please try again later',
        description:
          'Error message displayed when the publication of the webcard failed in Home Screen',
      },
      {
        azzappA: <Text variant="azzapp">a</Text>,
      },
    ) as unknown as string,
  );
  const onSubscriptionError = useOnSubscriptionError(
    profile.webCard?.subscription?.issuer === 'web',
  );
  const router = useRouter();

  const onPublish = useCallback(() => {
    if (!profile || !profile.webCard?.id) {
      return;
    }
    const { profileInfos } = getAuthState();
    if (!profileInfos) {
      return;
    }
    // using disable state with current profile show a disabled style during maybe one secdon
    // (currentProfile is not animated so need to be updated)
    // avoid adding a new interpolation by using this condition
    if (!profileInfoHasAdminRight(profile)) {
      return;
    }

    if (profile.webCard?.requiresSubscription && !profile.webCard.isPremium) {
      if (profileInfos?.profileRole === 'owner') {
        router.push({ route: 'USER_PAY_WALL' });
        return;
      } else {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage(
            {
              defaultMessage:
                'Please contact the owner of this WebCard{azzappA}. There is an issue on his/her azzapp+ subscription.',
              description:
                'Error toast when a non-owner is trying to publish a webcard from Home without subscription',
            },
            {
              azzappA: <Text variant="azzapp">a</Text>,
            },
          ) as unknown as string,
        });
        return;
      }
    }

    const environment = getRelayEnvironment();
    const publishMutation = graphql`
      mutation HomeBottomPanelPublishMutation(
        $webCardId: ID!
        $input: ToggleWebCardPublishedInput!
      ) @raw_response_type {
        toggleWebCardPublished(webCardId: $webCardId, input: $input) {
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
        webCardId: profile.webCard.id,
        input: {
          published: true,
        },
      },
      optimisticResponse: {
        toggleWebCardPublished: {
          webCard: {
            id: profile.webCard.id,
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
          ) as unknown as string,
        });
      },
      onError: error => {
        handleProfileActionError(error);
        onSubscriptionError(error);
      },
    });
  }, [handleProfileActionError, intl, onSubscriptionError, profile, router]);

  return (
    <>
      <Icon icon="warning" style={styles.warningIcon} />
      <Text variant="large" style={styles.message}>
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
      {profileInfoHasAdminRight(profile) && (
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
          rightElement={
            <PremiumIndicator
              isRequired={
                profile?.webCard?.requiresSubscription &&
                !profile?.webCard.isPremium
              }
            />
          }
          style={styles.button}
          onPress={onPublish}
        />
      )}
    </>
  );
};

export default HomeBottomPanelPublish;

const styles = StyleSheet.create({
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
  warningIcon: {
    tintColor: colors.white,
    marginBottom: 20,
    width: 20,
    height: 20,
  },
  button: {
    marginTop: 30,
    minWidth: 250,
  },
});
