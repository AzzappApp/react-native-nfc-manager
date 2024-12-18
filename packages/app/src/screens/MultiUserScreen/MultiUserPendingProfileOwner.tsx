import { useCallback, useContext } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { graphql, useFragment, useMutation } from 'react-relay';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Button from '#ui/Button';
import Icon from '#ui/Icon';
import Text from '#ui/Text';
import { MultiUserTransferOwnerContext } from './MultiUserScreen';
import type { MultiUserPendingProfileOwner$key } from '#relayArtifacts/MultiUserPendingProfileOwner.graphql';
import type { MultiUserPendingProfileOwnerCancelMutation } from '#relayArtifacts/MultiUserPendingProfileOwnerCancelMutation.graphql';

type MultiUserPendingProfileOwnerProps = {
  webCard: MultiUserPendingProfileOwner$key;
};

const MultiUserPendingProfileOwner = ({
  webCard: webCardKey,
}: MultiUserPendingProfileOwnerProps) => {
  const styles = useStyleSheet(styleSheet);
  const intl = useIntl();
  const { toggleTransferOwnerMode } = useContext(MultiUserTransferOwnerContext);

  const { id: webCardId, profilePendingOwner } = useFragment(
    graphql`
      fragment MultiUserPendingProfileOwner on WebCard {
        id
        profilePendingOwner {
          id
          promotedAsOwner
          user {
            email
            phoneNumber
          }
        }
      }
    `,
    webCardKey,
  );

  const [commitCancelTransfer, savingCancelTransfer] =
    useMutation<MultiUserPendingProfileOwnerCancelMutation>(graphql`
      mutation MultiUserPendingProfileOwnerCancelMutation($webCardId: ID!) {
        cancelTransferOwnership(webCardId: $webCardId) {
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

  const cancelTransfer = useCallback(
    () =>
      commitCancelTransfer({
        variables: {
          webCardId,
        },
        updater: store => {
          // Get the new profile from the mutation response

          store.get(webCardId)?.setValue(null, 'profilePendingOwner');
        },
      }),
    [commitCancelTransfer, webCardId],
  );

  if (!profilePendingOwner) {
    return (
      <View style={styles.transferContainer}>
        <Button
          style={styles.transfer}
          variant="secondary"
          label={intl.formatMessage({
            defaultMessage: 'Transfer Ownership',
            description:
              'MultiUserScreenUserList - Label for transfer ownership button',
          })}
          onPress={toggleTransferOwnerMode}
        />
      </View>
    );
  }
  return (
    <View style={styles.cancelOwner}>
      <Icon icon="clock" style={styles.iconClock} />
      <Text variant="button" style={styles.pending}>
        <FormattedMessage
          defaultMessage="Pending Ownership transfer"
          description="MultiUserDetailModal - Title for ownership transfer pending"
        />
      </Text>
      <Text variant="xsmall" style={styles.cancelTextDescription}>
        <FormattedMessage
          defaultMessage="A request has been sent to {contact}. Upon acceptance, ownership will be transferred, and you’ll be assigned the ‘Admin’ role of the WebCard."
          description="
        MultiUserScreenUserList - Text for ownership transfer pending"
          values={{
            contact:
              profilePendingOwner.user?.email ??
              profilePendingOwner.user?.phoneNumber,
          }}
        />
      </Text>
      <View style={styles.cancel}>
        <Button
          disabled={savingCancelTransfer}
          onPress={cancelTransfer}
          label={intl.formatMessage({
            defaultMessage: 'Cancel transfer',
            description: 'MultiUserDetailModal - Cancel transfer button label',
          })}
          variant="little_round"
          style={styles.cancelButton}
        />
      </View>
    </View>
  );
};

export default MultiUserPendingProfileOwner;

const styleSheet = createStyleSheet(appearance => ({
  iconClock: {
    tintColor: appearance === 'light' ? colors.black : colors.white,
    marginTop: 10,
  },
  cancelTextDescription: {
    color: appearance === 'light' ? colors.grey900 : colors.white,
    textAlign: 'center',
  },
  cancelOwner: {
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey900,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  transfer: {
    height: 29,
    borderRadius: 15,
    alignSelf: 'center',
  },
  pending: {
    color: appearance === 'light' ? colors.grey900 : colors.white,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  pendingEmail: {
    marginTop: 20,
    textAlign: 'center',
  },
  cancel: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  transferContainer: {
    justifyContent: 'center',
    alignContent: 'center',
    paddingTop: 20,
    paddingBottom: 5,
  },
}));
