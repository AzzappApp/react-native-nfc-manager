import { forwardRef, useImperativeHandle, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, useFragment, useMutation } from 'react-relay';
import { colors } from '#theme';
import ScreenModal from '#components/ScreenModal';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Text from '#ui/Text';
import type { MultiUserTransferOwnershipModal_TransferOwnershipMutation } from '#relayArtifacts/MultiUserTransferOwnershipModal_TransferOwnershipMutation.graphql';
import type { MultiUserTransferOwnershipModal_webCard$key } from '#relayArtifacts/MultiUserTransferOwnershipModal_webCard.graphql';
import type { ForwardedRef } from 'react';

type MultiUserTransferOwnershipModalProps = {
  webCard: MultiUserTransferOwnershipModal_webCard$key;
};

export type MultiUserTransferOwnershipModalActions = {
  open: () => void;
};

const MultiUserTransferOwnershipModal = (
  { webCard: webCardKey }: MultiUserTransferOwnershipModalProps,
  ref: ForwardedRef<MultiUserTransferOwnershipModalActions>,
) => {
  const intl = useIntl();

  const [visible, setVisible] = useState(false);
  const [selected] = useState(0);

  const [commit, saving] =
    useMutation<MultiUserTransferOwnershipModal_TransferOwnershipMutation>(
      graphql`
        mutation MultiUserTransferOwnershipModal_TransferOwnershipMutation(
          $input: TransferOwnershipInput!
        ) {
          transferOwnership(input: $input) {
            profile {
              id
              promotedAsOwner
            }
          }
        }
      `,
    );

  const webCard = useFragment(
    graphql`
      fragment MultiUserTransferOwnershipModal_webCard on WebCard {
        id
        userName
        nbProfiles
      }
    `,
    webCardKey,
  );

  const onClose = () => {
    setVisible(false);
  };

  const onTransfer = () => {
    commit({
      variables: {
        input: {
          profileId: 'TODO', //waiting for Nico review
          webCardId: webCard.id,
        },
      },
      onCompleted: () => {
        setVisible(false);
      },
    });
  };

  useImperativeHandle(ref, () => ({
    open: () => {
      setVisible(true);
    },
  }));

  return (
    <ScreenModal visible={visible} animationType="slide">
      <Container style={{ flex: 1 }}>
        <SafeAreaView
          style={{ flex: 1 }}
          edges={{ bottom: 'off', top: 'additive' }}
        >
          <Header
            leftElement={
              <Button
                variant="secondary"
                label={intl.formatMessage({
                  defaultMessage: 'Cancel',
                  description: 'MultiUserDetailModal - Cancel button label',
                })}
                onPress={onClose}
              />
            }
            middleElement={
              <Text variant="large" style={styles.name}>
                <FormattedMessage
                  defaultMessage="Transfer Ownership"
                  description="MultiUserTransferOwnershipModal - Title"
                />
              </Text>
            }
            rightElement={
              <Button
                label={intl.formatMessage({
                  defaultMessage: 'Transfer',
                  description:
                    'MultiUserTransferOwnershipModal - Transfer button label',
                })}
                onPress={onTransfer}
                disabled={selected === 0 || saving}
              />
            }
          />
          <Text variant="xsmall" style={styles.description}>
            <FormattedMessage
              defaultMessage={`Select a new owner for the WebCard “{userName}”. The owner has full control over the WebCard, including the ability to add and remove collaborators. This is also the person who will be billed for multi-user.`}
              description="MultiUserDetailModal - User description"
              values={{ userName: webCard.userName }}
            />
          </Text>

          <Text variant="smallbold" style={styles.price}>
            <FormattedMessage
              defaultMessage="$0,99/user, billed monthly - "
              description="Price for MultiUserScreen"
            />
            <FormattedMessage
              defaultMessage="{nbUsers} user"
              description="Title for switch section in MultiUserScreen"
              values={{ nbUsers: webCard.nbProfiles ?? 1 }}
            />
          </Text>

          <View style={styles.users}>
            {/* TODO : use a paginated SectionList is required by Nico after review*/}
          </View>
        </SafeAreaView>
      </Container>
    </ScreenModal>
  );
};

const styles = StyleSheet.create({
  name: {
    textAlign: 'center',
    maxWidth: '45%',
  },
  description: {
    paddingHorizontal: 50,
    textAlign: 'center',
    marginTop: 20,
    color: colors.grey900,
  },
  price: {
    textAlign: 'center',
    color: colors.grey400,
    paddingHorizontal: 50,
    marginTop: 20,
  },
  users: {
    marginHorizontal: 10,
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
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  separation: {
    marginTop: 20,
  },
});

export default forwardRef(MultiUserTransferOwnershipModal);
