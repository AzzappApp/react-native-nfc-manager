import { Fragment, forwardRef, useImperativeHandle, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, useFragment, useMutation } from 'react-relay';
import { colors, textStyles } from '#theme';
import { MEDIA_WIDTH } from '#components/AuthorCartouche';
import { MediaImageRenderer } from '#components/medias';
import ScreenModal from '#components/ScreenModal';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import RadioButton from '#ui/RadioButton';
import Separation from '#ui/Separation';
import Text from '#ui/Text';
import Avatar from './Avatar';
import type { ProfileRole } from '#relayArtifacts/MultiUserScreenQuery.graphql';
import type { MultiUserTransferOwnershipModal_TransferOwnershipMutation } from '#relayArtifacts/MultiUserTransferOwnershipModal_TransferOwnershipMutation.graphql';
import type { MultiUserTransferOwnershipModal_webcard$key } from '#relayArtifacts/MultiUserTransferOwnershipModal_webcard.graphql';
import type { UserInformation } from './MultiUserScreen';
import type { ForwardedRef } from 'react';

type MultiUserTransferOwnershipModalProps = {
  usersByRole: Record<ProfileRole, UserInformation[]>;
  webCard: MultiUserTransferOwnershipModal_webcard$key;
};

export type MultiUserTransferOwnershipModalActions = {
  open: () => void;
};

const MultiUserTransferOwnershipModal = (
  props: MultiUserTransferOwnershipModalProps,
  ref: ForwardedRef<MultiUserTransferOwnershipModalActions>,
) => {
  const { usersByRole, webCard } = props;
  const intl = useIntl();

  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(0);

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

  const data = useFragment(
    graphql`
      fragment MultiUserTransferOwnershipModal_webcard on WebCard {
        userName
        profiles {
          id
        }
      }
    `,
    webCard,
  );

  const onClose = () => {
    setVisible(false);
  };

  const onTransfer = () => {
    const userToTransfer = Object.values(usersByRole).reduce(
      (accumulator, currentValue) => [...accumulator, ...currentValue],
      [] as UserInformation[],
    )[selected];

    commit({
      variables: {
        input: {
          profileId: userToTransfer.profileId,
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
              <Text style={[textStyles.large, styles.name]}>
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
          <Text style={[styles.description, textStyles.xsmall]}>
            <FormattedMessage
              defaultMessage={`Select a new owner for the WebCard “{userName}”. The owner has full control over the WebCard, including the ability to add and remove collaborators. This is also the person who will be billed for multi-user.`}
              description="MultiUserDetailModal - User description"
              values={{ userName: data.userName }}
            />
          </Text>

          <Text style={[textStyles.smallbold, styles.price]}>
            <FormattedMessage
              defaultMessage="$0,99/user, billed monthly - "
              description="Price for MultiUserScreen"
            />
            <FormattedMessage
              defaultMessage="{nbUsers} user"
              description="Title for switch section in MultiUserScreen"
              values={{ nbUsers: data.profiles?.length ?? 1 }}
            />
          </Text>

          <View style={styles.users}>
            {Object.entries(usersByRole).map(([key, users], index) => {
              const profileRole = key as ProfileRole; // ts infers the key type as string
              return (
                <Fragment key={profileRole}>
                  <Separation style={styles.separation}>
                    {profileRole}
                  </Separation>
                  {users.map(user => {
                    return (
                      <View key={user.email} style={styles.user}>
                        {user.avatar ? (
                          <MediaImageRenderer
                            source={{
                              uri: user.avatar.uri,
                              mediaId: user.avatar.id ?? '',
                              requestedSize: MEDIA_WIDTH,
                            }}
                            style={styles.avatar}
                          />
                        ) : (
                          <Avatar
                            firstName={user.firstName}
                            lastName={user.lastName}
                          />
                        )}
                        <View style={styles.userInfos}>
                          <Text style={textStyles.large}>
                            ~{user.firstName} {user.lastName}{' '}
                            {index === 0 && '(me)'}
                          </Text>
                          <Text style={[styles.contact]}>{user.email}</Text>
                        </View>
                        <RadioButton
                          checked={selected === index}
                          onChange={() => setSelected(index)}
                        />
                      </View>
                    );
                  })}
                </Fragment>
              );
            })}
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
