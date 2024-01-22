import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View, useColorScheme } from 'react-native';
import * as mime from 'react-native-mime-types';
import { useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import { isOwner } from '@azzapp/shared/profileHelpers';
import { colors, textStyles } from '#theme';
import ScreenModal from '#components/ScreenModal';
import { getFileName } from '#helpers/fileHelpers';
import { addLocalCachedMediaFile } from '#helpers/mediaHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import { get as CappedPixelRatio } from '#relayProviders/CappedPixelRatio.relayprovider';
import ContactCardEditForm from '#screens/ContactCardScreen/ContactCardEditForm';
import HomeStatistics from '#screens/HomeScreen/HomeStatistics';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import PressableNative from '#ui/PressableNative';
import Select from '#ui/Select';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import MultiUserTransferOwnershipModal from './MultiUserTransferOwnershipModal';
import type { EmailPhoneInput } from '#components/EmailOrPhoneInput';
import type { MultiUserDetailModal_CancelTransferOwnershipMutation } from '#relayArtifacts/MultiUserDetailModal_CancelTransferOwnershipMutation.graphql';
import type { MultiUserDetailModal_RemoveUserMutation } from '#relayArtifacts/MultiUserDetailModal_RemoveUserMutation.graphql';
import type { MultiUserDetailModal_UpdateProfileMutation } from '#relayArtifacts/MultiUserDetailModal_UpdateProfileMutation.graphql';
import type { MultiUserDetailModal_webCard$key } from '#relayArtifacts/MultiUserDetailModal_webCard.graphql';
import type { ProfileRole } from '#relayArtifacts/MultiUserScreenQuery.graphql';
import type { ContactCardEditFormValues } from '#screens/ContactCardScreen/ContactCardEditModalSchema';
import type { UserInformation } from './MultiUserScreen';
import type { MultiUserTransferOwnershipModalActions } from './MultiUserTransferOwnershipModal';
import type { ContactCard } from '@azzapp/shared/contactCardHelpers';
import type { CountryCode } from 'libphonenumber-js';
import type { ForwardedRef, ReactNode } from 'react';
import type { Control } from 'react-hook-form';

type MultiUserDetailModalProps = {
  webCard: MultiUserDetailModal_webCard$key;
  currentProfileId: string;
  usersByRole: Record<ProfileRole, UserInformation[]>;
};

export type MultiUserDetailFormValues = ContactCardEditFormValues & {
  role: ProfileRole;
  selectedContact: EmailPhoneInput | null;
};

export type MultiUserDetailModalActions = {
  open: (
    contactCard: ContactCard,
    profileId: string,
    role: ProfileRole,
    avatar: { uri: string; id: string } | null,
    selectedContact: {
      value: string;
      countryCodeOrEmail: CountryCode | 'email';
    } | null,
  ) => void;
};

const MultiUserDetailModal = (
  {
    webCard: webCardKey,
    currentProfileId,
    usersByRole,
  }: MultiUserDetailModalProps,
  ref: ForwardedRef<MultiUserDetailModalActions>,
) => {
  const [visible, setVisible] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [profileId, setProfileId] = useState('');
  const transfer = useRef<MultiUserTransferOwnershipModalActions>(null);

  const onClose = () => setVisible(false);
  const intl = useIntl();

  const { control, watch, handleSubmit, reset, formState } =
    useForm<MultiUserDetailFormValues>({
      mode: 'onSubmit',
    });

  const webCard = useFragment(
    graphql`
      fragment MultiUserDetailModal_webCard on WebCard {
        id
        commonInformation {
          company
          addresses {
            label
            address
          }
          emails {
            label
            address
          }
          phoneNumbers {
            label
            number
          }
          urls {
            address
          }
          socials {
            label
            url
          }
        }
        profiles {
          id
          ...HomeStatistics_profiles
          promotedAsOwner
          user {
            email
          }
        }
        ...MultiUserTransferOwnershipModal_webCard
      }
    `,
    webCardKey,
  );

  const [commit] = useMutation<MultiUserDetailModal_UpdateProfileMutation>(
    graphql`
      mutation MultiUserDetailModal_UpdateProfileMutation(
        $input: UpdateProfileInput!
        $pixelRatio: Float!
      ) {
        updateProfile(input: $input) {
          profile {
            id
            contactCard {
              firstName
              lastName
              title
              company
              emails {
                label
                address
                selected
              }
              phoneNumbers {
                label
                number
                selected
              }
              urls {
                address
                selected
              }
              addresses {
                address
                label
                selected
              }
              birthday {
                birthday
                selected
              }
              socials {
                url
                label
                selected
              }
            }
            avatar {
              id
              uri: uri(width: 112, pixelRatio: $pixelRatio)
            }
            user {
              email
              phoneNumber
            }
            profileRole
          }
        }
      }
    `,
  );

  const [commitCancelTransfer, savingCancelTransfer] =
    useMutation<MultiUserDetailModal_CancelTransferOwnershipMutation>(graphql`
      mutation MultiUserDetailModal_CancelTransferOwnershipMutation(
        $input: CancelTransferOwnershipInput!
      ) {
        cancelTransferOwnership(input: $input) {
          profile {
            id
            promotedAsOwner
          }
        }
      }
    `);

  const submit = handleSubmit(
    async data => {
      const { avatar, role, selectedContact, ...contactCard } = data;

      const input = {};
      let avatarId: string | null = avatar?.id ?? null;

      if (formState.dirtyFields.avatar) {
        if (avatar?.local && avatar.uri) {
          // setProgressIndicator(Observable.from(0));

          const fileName = getFileName(avatar.uri);
          const file: any = {
            name: fileName,
            uri: avatar.uri,
            type: mime.lookup(fileName) || 'image/jpeg',
          };

          const { uploadURL, uploadParameters } = await uploadSign({
            kind: 'image',
            target: 'post',
          });
          const { /* progress: uploadProgress, */ promise: uploadPromise } =
            uploadMedia(file, uploadURL, uploadParameters);
          // setProgressIndicator(uploadProgress);
          const { public_id } = await uploadPromise;
          avatarId = encodeMediaId(public_id, 'image');
        }
      }
      if (formState.dirtyFields.role)
        Object.assign(input, { profileRole: role });

      commit({
        variables: {
          input: {
            ...input,
            avatarId,
            contactCard,
            profileId,
          },
          pixelRatio: CappedPixelRatio(),
        },
        onCompleted: () => {
          if (avatar && avatar?.uri) {
            addLocalCachedMediaFile(
              `${'image'.slice(0, 1)}:${avatarId}`,
              'image',
              avatar.uri,
            );
          }

          setVisible(false);
        },
        onError: e => {
          console.error(e);
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'Error, could update user. Please try again.',
              description:
                'Error toast message when updating user from MultiUserDetailModal',
            }),
          });
        },
      });
    },
    error => {
      console.error(error);
    },
  );

  useImperativeHandle(ref, () => ({
    open: (contactCard, profileId, role, avatar, selectedContact) => {
      reset({
        role,
        firstName: contactCard.firstName,
        lastName: contactCard.lastName,
        phoneNumbers: contactCard.phoneNumbers ?? [],
        emails: contactCard.emails ?? [],
        title: contactCard.title,
        company: contactCard.company ?? undefined,
        urls: contactCard.urls ?? [],
        birthday: contactCard.birthday,
        socials: contactCard.socials ?? [],
        addresses: contactCard.addresses ?? [],
        avatar,
        selectedContact,
      });

      setProfileId(profileId);

      setVisible(true);
    },
  }));

  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const role = watch('role');

  const index = useSharedValue(0);

  useEffect(() => {
    const profileIndex =
      webCard.profiles?.findIndex(profile => profile.id === profileId) ?? 0;

    index.value = profileIndex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, webCard.profiles]);

  const isCurrentProfile = profileId === currentProfileId;

  const [commitDelete, deletionIsActive] =
    useMutation<MultiUserDetailModal_RemoveUserMutation>(graphql`
      mutation MultiUserDetailModal_RemoveUserMutation(
        $input: RemoveUserFromWebCardInput!
      ) {
        removeUserFromWebCard(input: $input) {
          profileId
        }
      }
    `);

  const onRemoveUser = () => {
    commitDelete({
      variables: {
        input: {
          profileId: currentProfileId,
          removeProfileId: profileId,
        },
      },
      onCompleted: () => {
        setVisible(false);
      },
      onError: e => {
        console.error(e);
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Error, could not remove user. Please try again.',
            description:
              'Error toast message when removing user from MultiUserDetailModal',
          }),
        });
      },
      updater: store => {
        const webCardRecord = store.get(webCard.id);
        const profiles = webCardRecord?.getLinkedRecords('profiles');

        webCardRecord?.setLinkedRecords(
          profiles?.filter(
            profile => profile.getValue('id')?.toString() !== profileId,
          ),
          'profiles',
        );
      },
    });
  };

  const colorScheme = useColorScheme();

  const userPendingOwnership = webCard.profiles?.find(
    profile => profile.promotedAsOwner,
  );

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
                ~{firstName} {lastName}
              </Text>
            }
            rightElement={
              <Button
                label={intl.formatMessage({
                  defaultMessage: 'Save',
                  description: 'MultiUserAddModal - Save button label',
                })}
                onPress={submit}
              />
            }
          />
          <ContactCardEditForm
            commonInformation={webCard.commonInformation}
            control={control as unknown as Control<ContactCardEditFormValues>}
            hideImagePicker={() => setShowImagePicker(false)}
            showImagePicker={() => setShowImagePicker(true)}
            imagePickerVisible={showImagePicker}
            isMultiUser={true}
            footer={
              !isCurrentProfile &&
              role !== 'owner' && (
                <PressableNative
                  style={styles.removeButton}
                  onPress={onRemoveUser}
                  disabled={deletionIsActive}
                >
                  <Text style={[styles.removeText, textStyles.button]}>
                    <FormattedMessage
                      defaultMessage="Remove user"
                      description="label for button to remove user from multi-user profile"
                    />
                  </Text>
                </PressableNative>
              )
            }
          >
            <View style={{ paddingHorizontal: 10 }}>
              <Controller
                control={control}
                name="selectedContact"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.field}>
                    <Text style={[styles.title, textStyles.xsmall]}>
                      <FormattedMessage
                        defaultMessage="Email address or phone number"
                        description="MultiUserDetailModal - label for contact"
                      />
                    </Text>
                    <TextInput
                      value={value?.value ?? ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      style={[styles.input, styles.contactText]}
                      editable={false}
                    />
                  </View>
                )}
              />
              <Controller
                control={control}
                name="role"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.field}>
                    <Text style={[styles.title, textStyles.xsmall]}>
                      <FormattedMessage
                        defaultMessage="Role"
                        description="MultiUserDetailModal - label for role"
                      />
                    </Text>
                    <Select
                      nativeID="role"
                      disabled={isCurrentProfile || role === 'owner'}
                      accessibilityLabelledBy="roleLabel"
                      data={
                        role === 'owner'
                          ? [
                              {
                                id: 'owner',
                                label: (
                                  <FormattedMessage
                                    defaultMessage="Owner"
                                    description="MultiUserDetailModal - Label for owner select input"
                                  />
                                ),
                              },
                            ]
                          : roles
                      }
                      selectedItemKey={value}
                      keyExtractor={role => role.id}
                      onItemSelected={item => onChange(item.id)}
                      itemContainerStyle={styles.selectItemContainerStyle}
                      bottomSheetHeight={
                        BOTTOM_SHEET_HEIGHT_BASE +
                        roles.length * BOTTOM_SHEET_HEIGHT_ITEM
                      }
                    />
                  </View>
                )}
              />
              {isOwner(role) && !userPendingOwnership && (
                <Button
                  style={styles.transfer}
                  variant="secondary"
                  label={intl.formatMessage({
                    defaultMessage: 'Transfer Ownership',
                    description:
                      'MultiUserDetailModal - Label for transfer ownership button',
                  })}
                  onPress={() => transfer.current?.open()}
                />
              )}
              {isOwner(role) && userPendingOwnership && (
                <>
                  <Text style={styles.pending}>
                    <FormattedMessage
                      defaultMessage="Pending Ownership transfer to"
                      description="MultiUserDetailModal - Title for ownership transfer pending"
                    />
                  </Text>

                  <Text style={styles.pendingEmail}>
                    {userPendingOwnership.user.email}
                  </Text>

                  <View style={styles.cancel}>
                    <Button
                      disabled={savingCancelTransfer}
                      onPress={() =>
                        commitCancelTransfer({
                          variables: {
                            input: {
                              profileId: userPendingOwnership.id,
                              webCardId: webCard.id,
                            },
                          },
                        })
                      }
                      label={intl.formatMessage({
                        defaultMessage: 'Cancel transfer',
                        description:
                          'MultiUserDetailModal - Cancel transfer button label',
                      })}
                      variant="little_round"
                      style={styles.cancelButton}
                    />
                  </View>
                </>
              )}
              {!userPendingOwnership && (
                <Text style={[styles.description, textStyles.xsmall]}>
                  {role === 'user' && (
                    <FormattedMessage
                      defaultMessage="A user has a ContactCard linked to the shared webcard but cannot publish posts or edit the WebCard."
                      description="MultiUserDetailModal - User description"
                    />
                  )}
                  {role === 'editor' && (
                    <FormattedMessage
                      defaultMessage="An editor can create and publish posts, edit the WebCard, but they cannot manage other aspects of the WebCard, such as settings and permissions."
                      description="MultiUserDetailModal - Editor description"
                    />
                  )}
                  {role === 'admin' && (
                    <FormattedMessage
                      defaultMessage="The admin has full control over the WebCard, including the ability to add and remove collaborators."
                      description="MultiUserDetailModal - admin description"
                    />
                  )}
                  {role === 'owner' && (
                    <FormattedMessage
                      defaultMessage="The owner has full control over the WebCard, including the ability to add and remove collaborators. This is also the person who will be billed for multi-user."
                      description="MultiUserDetailModal - admin description"
                    />
                  )}
                </Text>
              )}
              {userPendingOwnership && (
                <Text style={[styles.description, textStyles.xsmall]}>
                  <FormattedMessage
                    defaultMessage="An ownership request has been sent. Ownership will be transfered as soon as the request is accepted."
                    description="MultiUserDetailModal - Description for pending ownership transfer"
                  />
                </Text>
              )}
              <View style={styles.stats}>
                {webCard.profiles && (
                  <HomeStatistics
                    user={webCard.profiles}
                    height={250}
                    currentUserIndex={0}
                    currentProfileIndexSharedValue={index}
                    variant={colorScheme === 'dark' ? 'dark' : 'light'}
                    initialStatsIndex={1}
                  />
                )}
              </View>
            </View>
          </ContactCardEditForm>
        </SafeAreaView>
      </Container>
      <MultiUserTransferOwnershipModal
        ref={transfer}
        usersByRole={usersByRole}
        webCard={webCard}
      />
    </ScreenModal>
  );
};

const BOTTOM_SHEET_HEIGHT_BASE = 20;
const BOTTOM_SHEET_HEIGHT_ITEM = 30;

const roles: Array<{ id: ProfileRole; label: ReactNode }> = [
  {
    id: 'user',
    label: (
      <FormattedMessage
        defaultMessage="User"
        description="MultiUserDetailModal - Label for user select input"
      />
    ),
  },
  {
    id: 'editor',
    label: (
      <FormattedMessage
        defaultMessage="Editor"
        description="MultiUserDetailModal - Label for editor select input"
      />
    ),
  },
  {
    id: 'admin',
    label: (
      <FormattedMessage
        defaultMessage="Admin"
        description="MultiUserDetailModal - Label for admin select input"
      />
    ),
  },
];

const styles = StyleSheet.create({
  removeButton: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  removeText: {
    color: colors.red400,
    paddingBottom: 15,
  },
  field: {
    marginTop: 10,
  },
  input: {},
  title: {
    color: colors.grey900,
    paddingBottom: 10,
  },
  selectItemContainerStyle: {
    paddingHorizontal: 30,
  },
  contactText: {
    backgroundColor: 'transparent',
    color: colors.grey600,
  },
  description: {
    paddingHorizontal: 50,
    textAlign: 'center',
    marginTop: 20,
    color: colors.grey900,
  },
  stats: {
    paddingBottom: 50,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  name: {
    maxWidth: '50%',
    textAlign: 'center',
  },
  transfer: {
    marginTop: 20,
  },
  pending: {
    color: colors.green,
    textAlign: 'center',
    marginTop: 20,
  },
  pendingEmail: {
    marginTop: 20,
    textAlign: 'center',
  },
  cancel: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 20,
  },
  cancelButton: {
    width: 136,
  },
});

export default forwardRef(MultiUserDetailModal);
