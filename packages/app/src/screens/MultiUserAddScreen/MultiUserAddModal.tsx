import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';
import * as mime from 'react-native-mime-types';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { graphql, useMutation } from 'react-relay';
import { type ContactCard } from '@azzapp/shared/contactCardHelpers';
import ERRORS from '@azzapp/shared/errors';
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import { textStyles } from '#theme';
import ScreenModal from '#components/ScreenModal';
import { getFileName } from '#helpers/fileHelpers';
import { addLocalCachedMediaFile } from '#helpers/mediaHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import ContactCardEditForm from '#screens/ContactCardScreen/ContactCardEditForm';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Text from '#ui/Text';
import MultiUserAddForm from './MultiUserAddForm';
import type { ContactCardEditFormValues } from '#screens/ContactCardScreen/ContactCardEditModalSchema';
import type { MultiUserAddFormValues } from './MultiUserAddForm';
import type { MultiUserAddModal_InviteUserMutation } from '@azzapp/relay/artifacts/MultiUserAddModal_InviteUserMutation.graphql';
import type { ForwardedRef } from 'react';
import type { Control } from 'react-hook-form';

// eslint-disable-next-line @typescript-eslint/ban-types
type MultiUserAddModalProps = {
  beforeClose: () => void;
  onCompleted: () => void;
};

export type UserToAdd = {
  firstName: string;
  lastName: string;
  phoneNumbers: string[];
  emails: string[];
  contactCard: ContactCard;
};

export type AssociatedUser = {
  email?: string;
  phoneNumber?: string;
};

export type MultiUserAddModalActions = {
  open: (
    associated: AssociatedUser,
    user: UserToAdd,
    isManual: boolean,
  ) => void;
};

const MultiUserAddModal = (
  props: MultiUserAddModalProps,
  ref: ForwardedRef<MultiUserAddModalActions>,
) => {
  const { beforeClose, onCompleted } = props;
  const [visible, setVisible] = useState(false);

  const intl = useIntl();

  const [user, setUser] = useState<AssociatedUser & UserToAdd>({
    firstName: '',
    lastName: '',
    phoneNumbers: [],
    emails: [],
    contactCard: {},
  });

  const [isManual, setIsManual] = useState(false);

  const onClose = () => {
    setVisible(false);
  };

  const contacts = useMemo(() => {
    const baseContacts = getUserContacts(user);
    if (isManual) return baseContacts;
    return [
      ...baseContacts,
      {
        id: 'manual',
        label: intl.formatMessage({
          defaultMessage: 'Manual entry',
          description: 'MultiUserAddModal - Label for manual entry',
        }),
      },
    ];
  }, [user, intl, isManual]);

  const { control, watch, handleSubmit, reset } =
    useForm<MultiUserAddFormValues>({
      defaultValues: {
        contact: contacts[0]?.id,
        manualContact: '',
        role: 'user',
      },
      mode: 'onSubmit',
    });

  useImperativeHandle(ref, () => ({
    open: (associated: AssociatedUser, user: UserToAdd, isManual: boolean) => {
      setUser({ ...associated, ...user });

      reset({
        role: 'user',
        contact: getUserContacts(user)[0].id,
        firstName: user.contactCard['firstName'],
        lastName: user.contactCard['lastName'],
        phoneNumbers: user.contactCard['phoneNumbers'] ?? [],
        emails: user.contactCard['emails'] ?? [],
        title: user.contactCard['title'],
        company: user.contactCard['company'] ?? undefined,
        urls: user.contactCard['urls'] ?? [],
        birthday: user.contactCard['birthday'],
        socials: user.contactCard['socials'] ?? [],
      });

      setIsManual(isManual);

      setVisible(true);
    },
  }));

  const [showImagePicker, setShowImagePicker] = useState(false);

  const currentContact = watch('contact');

  const [commit] = useMutation<MultiUserAddModal_InviteUserMutation>(graphql`
    mutation MultiUserAddModal_InviteUserMutation($input: InviteUserInput!) {
      inviteUser(input: $input) {
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
          user {
            email
            phoneNumber
          }
          profileRole
          avatar {
            id
            uri
          }
          statsSummary {
            day
            contactCardScans
          }
          webCard {
            statsSummary {
              day
              webCardViews
              likes
            }
          }
        }
      }
    }
  `);

  const submit = handleSubmit(
    async ({ avatar, ...data }) => {
      let avatarId: string | undefined = undefined;
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
      }

      const {
        firstName,
        lastName,
        phoneNumbers,
        emails,
        title,
        company,
        urls,
        birthday,
        socials,
        addresses,
      } = data;

      const input = {
        email: user.email,
        phoneNumber: user.phoneNumber,
        profileRole: data.role,
        contactCard: {
          firstName,
          lastName,
          phoneNumbers,
          emails,
          title,
          company,
          urls,
          birthday: birthday ?? { birthday: '', selected: null },
          socials,
          avatarId: avatarId ? encodeMediaId(avatarId, 'image') : avatarId,
          addresses,
        },
      };

      // @TODO retrieve local user information to generate webcard (phone with label isntead of just number, etc.)
      commit({
        variables: {
          input,
        },
        onCompleted: () => {
          if (avatarId && avatar?.uri) {
            addLocalCachedMediaFile(
              `${'image'.slice(0, 1)}:${avatarId}`,
              'image',
              avatar.uri,
            );
          }

          beforeClose();
          onClose();
          onCompleted();
        },
        onError: e => {
          if (e.message === ERRORS.PROFILE_ALREADY_EXISTS) {
            Toast.show({
              type: 'error',
              text1: intl.formatMessage({
                defaultMessage: 'Error, this user is already invited',
                description:
                  'Error toast message when inviting user that is already a member from MultiUserAddModal',
              }),
            });
          } else {
            Toast.show({
              type: 'error',
              text1: intl.formatMessage({
                defaultMessage:
                  'Error, could not invite user. Please try again.',
                description:
                  'Error toast message when inviting user from MultiUserAddModal',
              }),
            });
          }
        },
        updater: (store, data) => {
          const invitedProfile = data.inviteUser?.profile;

          if (invitedProfile) {
            const root = store.getRoot();
            const viewer = root.getLinkedRecord('viewer');
            const profile = viewer?.getLinkedRecord('profile');
            const webcard = profile?.getLinkedRecord('webCard');
            const profiles = webcard?.getLinkedRecords('profiles');

            const newProfileRecord = store.get(invitedProfile.id);

            if (newProfileRecord) {
              webcard?.setLinkedRecords(
                profiles?.concat(newProfileRecord),
                'profiles',
              );
            }
          }
        },
      });
    },
    error => {
      console.log(error);
    },
  );

  return (
    <ScreenModal visible={visible} animationType="slide">
      <Container style={{ flex: 1 }}>
        <SafeAreaView
          style={{ flex: 1 }}
          edges={{ bottom: 'off', top: 'additive' }}
        >
          <Header
            middleElement={
              <Text style={textStyles.large}>
                {user.firstName} {user.lastName}
              </Text>
            }
            leftElement={
              <Button
                variant="secondary"
                label={intl.formatMessage({
                  defaultMessage: 'Cancel',
                  description: 'MultiUserAddModal - Cancel button label',
                })}
                onPress={onClose}
              />
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
          >
            <MultiUserAddForm
              contacts={contacts}
              control={control}
              currentContact={currentContact}
            />
          </ContactCardEditForm>
        </SafeAreaView>
      </Container>
    </ScreenModal>
  );
};

const getUserContacts = (user: UserToAdd) => {
  return [
    ...user.emails.map(email => ({
      id: email,
      label: email,
    })),
    ...user.phoneNumbers.map(phoneNumber => ({
      id: phoneNumber,
      label: phoneNumber,
    })),
  ];
};

export default forwardRef(MultiUserAddModal);
