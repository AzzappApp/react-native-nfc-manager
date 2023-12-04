import { fromGlobalId } from 'graphql-relay';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import * as mime from 'react-native-mime-types';
import { useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { graphql, useFragment, useMutation } from 'react-relay';
import { colors, textStyles } from '#theme';
import ScreenModal from '#components/ScreenModal';
import { getFileName } from '#helpers/fileHelpers';
import { addLocalCachedMediaFile } from '#helpers/mediaHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import ContactCardEditForm from '#screens/ContactCardScreen/ContactCardEditForm';
import HomeStatistics from '#screens/HomeScreen/HomeStatistics';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import PressableNative from '#ui/PressableNative';
import Select from '#ui/Select';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import type { ContactCardEditFormValues } from '#screens/ContactCardScreen/ContactCardEditModalSchema';
import type { AssociatedUser } from '#screens/MultiUserAddScreen/MultiUserAddModal';
import type { MultiUserDetailModal_UpdateProfileMutation } from '@azzapp/relay/artifacts/MultiUserDetailModal_UpdateProfileMutation.graphql';
import type { MultiUserDetailModal_webcard$key } from '@azzapp/relay/artifacts/MultiUserDetailModal_webcard.graphql';
import type { ProfileRole } from '@azzapp/relay/artifacts/MultiUserScreenQuery.graphql';
import type { ContactCard } from '@azzapp/shared/contactCardHelpers';
import type { ForwardedRef, ReactNode } from 'react';
import type { Control } from 'react-hook-form';

type MultiUserDetailModalProps = {
  user: MultiUserDetailModal_webcard$key;
};

export type MultiUserDetailFormValues = ContactCardEditFormValues & {
  contact: string;
  role: ProfileRole;
};

export type MultiUserDetailModalActions = {
  open: (
    associated: AssociatedUser,
    contactCard: ContactCard,
    profileId: string,
  ) => void;
};

const MultiUserDetailModal = (
  props: MultiUserDetailModalProps,
  ref: ForwardedRef<MultiUserDetailModalActions>,
) => {
  const { user } = props;
  const [visible, setVisible] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [profileId, setProfileId] = useState('');

  const onClose = () => setVisible(false);
  const intl = useIntl();

  const { control, watch, handleSubmit, reset, formState } =
    useForm<MultiUserDetailFormValues>({
      mode: 'onSubmit',
    });

  const data = useFragment(
    graphql`
      fragment MultiUserDetailModal_webcard on WebCard {
        profiles {
          id
          ...HomeStatistics_profiles
        }
      }
    `,
    user,
  );

  const [commit] = useMutation<MultiUserDetailModal_UpdateProfileMutation>(
    graphql`
      mutation MultiUserDetailModal_UpdateProfileMutation(
        $input: UpdateProfileInput!
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
              uri
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

  const submit = handleSubmit(
    async data => {
      const { avatar, contact, role, ...contactCard } = data;

      const input = {};
      let avatarId: string | undefined = undefined;

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
          avatarId = public_id;
          Object.assign(input, { avatarId });
        }
      }
      if (formState.dirtyFields.role)
        Object.assign(input, { profileRole: role });

      commit({
        variables: {
          input: {
            ...input,
            profileId,
            contactCard,
          },
          // pixelRatio: CappedPixelRatio(),
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
    open: (
      associated: AssociatedUser,
      contactCard: ContactCard,
      profileId: string,
    ) => {
      reset({
        role: 'user',
        contact: associated.email ?? associated.phoneNumber,
        firstName: contactCard['firstName'],
        lastName: contactCard['lastName'],
        phoneNumbers: contactCard['phoneNumbers'] ?? [],
        emails: contactCard['emails'] ?? [],
        title: contactCard['title'],
        company: contactCard['company'] ?? undefined,
        urls: contactCard['urls'] ?? [],
        birthday: contactCard['birthday'],
        socials: contactCard['socials'] ?? [],
      });

      setProfileId(profileId);

      setVisible(true);
    },
  }));

  const firstName = watch('firstName');
  const lastName = watch('lastName');

  const index = useSharedValue(0);

  useEffect(() => {
    const profileIndex =
      data.profiles?.findIndex(
        profile => fromGlobalId(profile.id).id === profileId,
      ) ?? 0;

    index.value = profileIndex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, data.profiles]);

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
              <Text style={textStyles.large}>
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
            commonInformation={null}
            control={control as unknown as Control<ContactCardEditFormValues>}
            hideImagePicker={() => setShowImagePicker(false)}
            showImagePicker={() => setShowImagePicker(true)}
            imagePickerVisible={showImagePicker}
            isMultiUser={true}
            footer={
              <PressableNative style={styles.removeButton}>
                <Text style={[styles.removeText, textStyles.button]}>
                  <FormattedMessage
                    defaultMessage="Remove user"
                    description="label for button to remove user from multi-user profile"
                  />
                </Text>
              </PressableNative>
            }
          >
            <View style={{ paddingHorizontal: 10 }}>
              <Controller
                control={control}
                name="contact"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.field}>
                    <Text style={[styles.title, textStyles.xsmall]}>
                      <FormattedMessage
                        defaultMessage="Email address or phone number"
                        description="MultiUserDetailModal - label for contact"
                      />
                    </Text>
                    <TextInput
                      value={value ?? ''}
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
                      accessibilityLabelledBy="roleLabel"
                      data={roles}
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
              <Text style={[styles.description, textStyles.xsmall]}>
                <FormattedMessage
                  defaultMessage="A user has a ContactCard linked to the shared webcard but cannot publish posts or edit the WebCard."
                  description="MultiUserDetailModal - Main description for contact card"
                />
              </Text>
              <View style={styles.stats}>
                {data.profiles && (
                  <HomeStatistics
                    user={data.profiles}
                    height={400}
                    currentUserIndex={0}
                    currentProfileIndexSharedValue={index}
                    variant="secondary"
                  />
                )}
              </View>
            </View>
          </ContactCardEditForm>
        </SafeAreaView>
      </Container>
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
  removeText: { color: colors.red400 },
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
});

export default forwardRef(MultiUserDetailModal);
