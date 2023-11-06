import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';
import * as mime from 'react-native-mime-types';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { graphql, useMutation } from 'react-relay';
import { type ContactCard } from '@azzapp/shared/contactCardHelpers';
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
};

type UserToAdd = {
  firstName: string;
  lastName: string;
  phoneNumbers: string[];
  emails: string[];
  contactCard: ContactCard;
  userId?: string;
};

export type AssociatedUser = {
  email?: string;
  phoneNumber?: string;
};

export type MultiUserAddModalActions = {
  open: (associated: AssociatedUser, user: UserToAdd) => void;
};

const MultiUserAddModal = (
  props: MultiUserAddModalProps,
  ref: ForwardedRef<MultiUserAddModalActions>,
) => {
  const { beforeClose } = props;
  const [visible, setVisible] = useState(false);

  const intl = useIntl();

  const [user, setUser] = useState<AssociatedUser & UserToAdd>({
    firstName: '',
    lastName: '',
    phoneNumbers: [],
    emails: [],
    contactCard: {},
  });

  const onClose = () => {
    setVisible(false);
  };

  const contacts = useMemo(
    () => [
      ...getUserContacts(user),
      {
        id: 'manual',
        label: intl.formatMessage({
          defaultMessage: 'Manual entry',
          description: 'MultiUserAddModal - Label for manual entry',
        }),
      },
    ],
    [user, intl],
  );

  const { control, setValue, watch, handleSubmit, reset } =
    useForm<MultiUserAddFormValues>({
      defaultValues: {
        contact: contacts[0].id,
        manualContact: '',
        role: 'user',
      },
      mode: 'onSubmit',
    });

  useImperativeHandle(ref, () => ({
    open: (associated: AssociatedUser, user: UserToAdd) => {
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
        },
      };

      // @TODO retrieve local user information to generate webcard (phone with label isntead of just number, etc.)
      commit({
        variables: {
          input,
          // pixelRatio: CappedPixelRatio(),
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
          setVisible(false);
        },
        onError: e => {
          console.error(e);
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'Error, could invite user. Please try again.',
              description:
                'Error toast message when inviting user from MultiUserAddModal',
            }),
          });
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
            setAvatar={avatar => setValue('avatar', avatar)}
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
