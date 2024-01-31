import { zodResolver } from '@hookform/resolvers/zod';
import { parsePhoneNumber } from 'libphonenumber-js';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View, useColorScheme } from 'react-native';
import * as mime from 'react-native-mime-types';
import { useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {
  ConnectionHandler,
  graphql,
  useFragment,
  useMutation,
} from 'react-relay';
import ERRORS from '@azzapp/shared/errors';
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import { colors } from '#theme';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { getFileName } from '#helpers/fileHelpers';
import { addLocalCachedMediaFile } from '#helpers/mediaHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import useAuthState from '#hooks/useAuthState';
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
import { multiUSerDetailModalSchema } from './MultiUserDetailModalSchema';
import type { EmailPhoneInput } from '#components/EmailOrPhoneInput';
import type { MultiUserDetailModal_Profile$key } from '#relayArtifacts/MultiUserDetailModal_Profile.graphql';
import type { MultiUserDetailModal_RemoveUserMutation } from '#relayArtifacts/MultiUserDetailModal_RemoveUserMutation.graphql';
import type { MultiUserDetailModal_UpdateProfileMutation } from '#relayArtifacts/MultiUserDetailModal_UpdateProfileMutation.graphql';
import type { MultiUserDetailModal_webCard$key } from '#relayArtifacts/MultiUserDetailModal_webCard.graphql';
import type { ProfileRole } from '#relayArtifacts/MultiUserScreenQuery.graphql';
import type { ContactCardEditFormValues } from '#screens/ContactCardScreen/ContactCardEditModalSchema';
import type { ReactNode } from 'react';
import type { Control } from 'react-hook-form';

type MultiUserDetailModalProps = {
  webCard: MultiUserDetailModal_webCard$key;
  profile: MultiUserDetailModal_Profile$key | undefined;
  onClose: () => void;
};

export type MultiUserDetailFormValues = ContactCardEditFormValues & {
  role: ProfileRole;
  selectedContact: EmailPhoneInput | null;
};

const MultiUserDetailModal = ({
  webCard: webCardKey,
  profile: profileKey,
  onClose,
}: MultiUserDetailModalProps) => {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const { profileInfos } = useAuthState();
  const intl = useIntl();
  const styles = useStyleSheet(styleSheet);

  const profile = useFragment(
    graphql`
      fragment MultiUserDetailModal_Profile on Profile
      @argumentDefinitions(
        pixelRatio: {
          type: "Float!"
          provider: "CappedPixelRatio.relayprovider"
        }
      ) {
        id
        profileRole
        promotedAsOwner
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
        ...HomeStatistics_profiles
        avatar {
          id
          uri: uri(width: 112, pixelRatio: $pixelRatio)
        }
        user {
          email
          phoneNumber
        }
      }
    `,
    profileKey,
  );

  const phoneNumber =
    profile?.user.phoneNumber && parsePhoneNumber(profile.user.phoneNumber);

  const {
    control,
    watch,
    handleSubmit,
    formState: { dirtyFields, isSubmitting },
  } = useForm<MultiUserDetailFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(multiUSerDetailModalSchema),
    defaultValues: {
      role: profile?.profileRole,
      firstName: profile?.contactCard?.firstName,
      lastName: profile?.contactCard?.lastName,
      //use .slice to tricks the readOnly coming from relay type.(using hard cast 'as' make it hard to read the code)
      phoneNumbers: profile?.contactCard?.phoneNumbers?.slice() ?? [],
      emails: profile?.contactCard?.emails?.slice() ?? [],
      title: profile?.contactCard?.title,
      company: profile?.contactCard?.company ?? undefined,
      urls: profile?.contactCard?.urls?.slice() ?? [],
      birthday: profile?.contactCard?.birthday,
      socials: profile?.contactCard?.socials?.slice() ?? [],
      addresses: profile?.contactCard?.addresses?.slice() ?? [],
      avatar: profile?.avatar,
      selectedContact: profile?.user.email
        ? {
            countryCodeOrEmail: 'email',
            value: profile.user.email,
          }
        : phoneNumber && phoneNumber?.isValid()
          ? {
              countryCodeOrEmail: phoneNumber.country!,
              value: phoneNumber.formatInternational()!,
            }
          : null,
    },
  });

  const webCard = useFragment(
    graphql`
      fragment MultiUserDetailModal_webCard on WebCard {
        id
        profilePendingOwner {
          id
          user {
            email
            phoneNumber
          }
        }
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
      }
    `,
    webCardKey,
  );

  const [commit, saving] =
    useMutation<MultiUserDetailModal_UpdateProfileMutation>(graphql`
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
    `);

  const submit = handleSubmit(
    async data => {
      if (profile == null) return;
      const { avatar, role, selectedContact, ...contactCard } = data;

      const input = {};

      let avatarId: string | null = profile?.avatar?.id ?? null;

      if (avatar?.local && avatar.uri) {
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
        const { promise: uploadPromise } = uploadMedia(
          file,
          uploadURL,
          uploadParameters,
        );

        const { public_id } = await uploadPromise;
        avatarId = encodeMediaId(public_id, 'image');
      }

      if (dirtyFields.role) Object.assign(input, { profileRole: role });

      commit({
        variables: {
          input: {
            ...input,
            avatarId,
            contactCard,
            profileId: profile.id,
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
          onClose();
        },
        onError: e => {
          console.error(e);

          if (e.message === ERRORS.PROFILE_DONT_EXISTS) {
            Toast.show({
              type: 'error',
              text1: intl.formatMessage({
                defaultMessage: 'Error, user declined the invitation.',
                description:
                  'Error toast message when updating user who declined the invitation from MultiUserDetailModal',
              }),
              onHide: () => {
                onClose();
              },
            });
          } else {
            Toast.show({
              type: 'error',
              text1: intl.formatMessage({
                defaultMessage:
                  'Error, could not update user. Please try again.',
                description:
                  'Error toast message when updating user from MultiUserDetailModal',
              }),
            });
          }
        },
      });
    },
    error => {
      console.error(error);
    },
  );

  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const role = watch('role');

  const index = useSharedValue(0);

  const isCurrentProfile = profile?.id === profileInfos?.profileId;

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
    if (profileInfos?.profileId == null || profile == null) return;
    commitDelete({
      variables: {
        input: {
          profileId: profileInfos?.profileId,
          removeProfileId: profile.id,
        },
      },
      onCompleted: () => {
        onClose();
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
        if (webCardRecord) {
          const connection = ConnectionHandler.getConnection(
            webCardRecord,
            'MultiUserScreenUserList_webCard_connection_profiles',
          );
          if (connection) {
            ConnectionHandler.deleteNode(connection, profile.id);
          }
        }
      },
    });
  };

  const colorScheme = useColorScheme();

  if (!profileInfos?.profileId || profile == null) return null;

  return (
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
              ~{firstName} {lastName}
            </Text>
          }
          rightElement={
            <Button
              label={intl.formatMessage({
                defaultMessage: 'Save',
                description: 'MultiUserAddModal - Save button label',
              })}
              loading={saving || isSubmitting}
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
                <Text variant="button" style={styles.removeText}>
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
                  <Text variant="xsmall" style={styles.title}>
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
                  <Text variant="xsmall" style={styles.title}>
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
                    bottomSheetTitle={
                      intl.formatMessage({
                        defaultMessage: 'Select a role',
                        description:
                          'MultiUserDetailForm - Role BottomSheet - Title',
                      }) as string
                    }
                  />
                </View>
              )}
            />

            {!webCard.profilePendingOwner && (
              <Text variant="xsmall" style={styles.description}>
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
            {webCard.profilePendingOwner && (
              <Text variant="xsmall" style={styles.description}>
                <FormattedMessage
                  defaultMessage="An ownership request has been sent. Ownership will be transfered as soon as the request is accepted."
                  description="MultiUserDetailModal - Description for pending ownership transfer"
                />
              </Text>
            )}
            <View style={styles.stats}>
              <HomeStatistics
                user={[profile]}
                height={250}
                currentProfileIndexSharedValue={index}
                variant={colorScheme === 'dark' ? 'dark' : 'light'}
                initialStatsIndex={1}
              />
            </View>
          </View>
        </ContactCardEditForm>
      </SafeAreaView>
      {isSubmitting || saving ? (
        /* Used to prevent user from interacting with the screen while saving */
        <View style={StyleSheet.absoluteFill} />
      ) : null}
    </Container>
  );
};

const BOTTOM_SHEET_HEIGHT_BASE = 100;
const BOTTOM_SHEET_HEIGHT_ITEM = 40;

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

const styleSheet = createStyleSheet(appearance => ({
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
    marginBottom: 18,
  },
  contactText: {
    backgroundColor: 'transparent',
    color: colors.grey600,
  },
  description: {
    paddingHorizontal: 50,
    textAlign: 'center',
    marginTop: 20,
    color: appearance === 'light' ? colors.grey900 : colors.grey300,
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
}));

export default MultiUserDetailModal;
