import { zodResolver } from '@hookform/resolvers/zod';
import parsePhoneNumberFromString, {
  parsePhoneNumber,
} from 'libphonenumber-js';
import capitalize from 'lodash/capitalize';
import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { View, StyleSheet, Keyboard } from 'react-native';
import * as mime from 'react-native-mime-types';
import Toast from 'react-native-toast-message';
import {
  ConnectionHandler,
  graphql,
  useFragment,
  useMutation,
} from 'react-relay';
import * as z from 'zod';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';

import ERRORS from '@azzapp/shared/errors';
import { encodeMediaId } from '@azzapp/shared/imagesHelpers';
import { isValidEmail } from '@azzapp/shared/stringHelpers';
import ScreenModal from '#components/ScreenModal';
import { CardPhoneLabels } from '#helpers/contactCardHelpers';
import { getFileName } from '#helpers/fileHelpers';
import { getLocales, useCurrentLocale } from '#helpers/localeHelpers';
import { addLocalCachedMediaFile } from '#helpers/mediaHelpers';
import { uploadMedia, uploadSign } from '#helpers/MobileWebAPI';
import useAuthState from '#hooks/useAuthState';
import ContactCardEditForm from '#screens/ContactCardScreen/ContactCardEditForm';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import SafeAreaView from '#ui/SafeAreaView';
import Text from '#ui/Text';
import MultiUserAddForm from './MultiUserAddForm';
import type { EmailPhoneInput } from '#components/EmailOrPhoneInput';
import type { MultiUserAddModal_InviteUserMutation } from '#relayArtifacts/MultiUserAddModal_InviteUserMutation.graphql';
import type { MultiUserAddModal_webCard$key } from '#relayArtifacts/MultiUserAddModal_webCard.graphql';
import type { ContactCardEditFormValues } from '#screens/ContactCardScreen/ContactCardEditModalSchema';
import type { MultiUserAddFormValues } from './MultiUserAddForm';
import type { Contact } from 'expo-contacts';
import type { CountryCode } from 'libphonenumber-js';
import type { ForwardedRef } from 'react';
import type { Control } from 'react-hook-form';

const multiUserAddFormSchema = z.object({
  selectedContact: z
    .object({
      countryCodeOrEmail: z.string(),
      value: z.string(),
    })
    .refine(contact => {
      if (contact.countryCodeOrEmail === 'email') {
        return isValidEmail(contact.value);
      } else if (contact.countryCodeOrEmail) {
        return parsePhoneNumberFromString(
          contact.value,
          contact.countryCodeOrEmail as CountryCode,
        )?.isValid();
      }
    }),
  role: z.enum(['user', 'admin', 'editor']),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  emails: z.array(
    z.object({
      label: z.string(),
      address: z.string(),
      selected: z.boolean().nullable().optional(),
    }),
  ),
  phoneNumbers: z.array(
    z.object({
      label: z.string(),
      number: z.string(),
      selected: z.boolean().nullable().optional(),
    }),
  ),
  title: z.string().optional(),
  company: z.string().optional(),
  urls: z.array(
    z.object({
      address: z.string(),
      selected: z.boolean().nullable().optional(),
    }),
  ),
  birthday: z
    .object({
      birthday: z.string(),
      selected: z.boolean().nullable().optional(),
    })
    .optional(),
  socials: z.array(
    z.object({
      url: z.string(),
      label: z.string(),
      selected: z.boolean().nullable().optional(),
    }),
  ),
  addresses: z.array(
    z.object({
      address: z.string(),
      label: z.string(),
      selected: z.boolean().nullable().optional(),
    }),
  ),
  avatar: z
    .object({
      uri: z.string(),
      id: z.string(),
      local: z.boolean(),
    })
    .optional(),
});

// eslint-disable-next-line @typescript-eslint/ban-types
type MultiUserAddModalProps = {
  beforeClose: () => void;
  onCompleted: () => void;
  webCard: MultiUserAddModal_webCard$key;
};

export type MultiUserAddModalActions = {
  open: (contact: Contact | string) => void;
};

const MultiUserAddModal = (
  props: MultiUserAddModalProps,
  ref: ForwardedRef<MultiUserAddModalActions>,
) => {
  const { commonInformation } = useFragment(
    graphql`
      fragment MultiUserAddModal_webCard on WebCard {
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
      }
    `,
    props.webCard,
  );

  const { beforeClose, onCompleted } = props;
  const [visible, setVisible] = useState(false);

  const intl = useIntl();

  const [contact, setContact] = useState<Contact>();

  const [isManual, setIsManual] = useState(false);

  const onClose = () => {
    setVisible(false);
  };

  const contacts: Array<{
    id: string;
    label: string;
    countryCodeOrEmail: CountryCode | 'email';
  }> = useMemo(() => {
    if (contact) {
      const baseContacts = getUserContacts(contact);
      return baseContacts;
    }
    return [];
  }, [contact]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
    watch,
  } = useForm<MultiUserAddFormValues>({
    resolver: zodResolver(multiUserAddFormSchema),
    defaultValues: {
      role: 'user',
    },
    mode: 'onSubmit',
  });

  const firstName = watch('firstName');
  const lastName = watch('lastName');

  const locales = getLocales();
  const currentLanguageLocale = useCurrentLocale();

  const locale = locales.find(
    locale => locale.languageCode === currentLanguageLocale,
  );

  useImperativeHandle(ref, () => ({
    open: (contact: Contact | string) => {
      if (typeof contact !== 'string') {
        setContact(contact);
        setIsManual(false);
        let selectedContact: EmailPhoneInput = {
          countryCodeOrEmail: 'email',
          value: '',
        };
        const ctc = getUserContacts(contact);
        if (ctc.length > 0) {
          selectedContact = {
            countryCodeOrEmail: ctc[0].countryCodeOrEmail as
              | CountryCode
              | 'email',
            value: ctc[0].id,
          };
        }
        reset(
          {
            role: 'user',
            selectedContact,
            firstName: contact.firstName,
            lastName: contact.lastName,
            phoneNumbers:
              contact.phoneNumbers?.map(a => ({
                label: normalizePhoneMailLabel(a.label),
                number: a.number,
              })) ?? [],
            emails:
              contact.emails?.map(a => ({
                label: normalizePhoneMailLabel(a.label),
                address: a.email,
              })) ?? [],
            title: contact.jobTitle,
            company: contact.company ?? undefined,
            urls: contact.urlAddresses?.map(a => ({ address: a.url })) ?? [],
            birthday: contact.birthday
              ? {
                  birthday: new Date(
                    contact.birthday.year!,
                    contact.birthday.month!,
                    contact.birthday.day!,
                  ).toISOString(),
                }
              : undefined,
            avatar: contact?.image?.uri
              ? {
                  uri: contact?.image?.uri,
                  id: contact?.image.uri,
                  local: true,
                }
              : undefined,
          },
          { keepDirty: true },
        );
      } else {
        reset({
          role: 'user',
          selectedContact: {
            countryCodeOrEmail:
              !contact || isValidEmail(contact)
                ? 'email'
                : (locale?.countryCode.toUpperCase() as CountryCode),
            value: contact,
          },
        });
        setIsManual(isManual);
      }
      setVisible(true);
    },
  }));

  const [showImagePicker, setShowImagePicker] = useState(false);

  const [commit, saving] = useMutation<MultiUserAddModal_InviteUserMutation>(
    graphql`
      mutation MultiUserAddModal_InviteUserMutation(
        $profileId: ID!
        $invited: InviteUserInput!
      ) {
        inviteUser(profileId: $profileId, invited: $invited) {
          profile {
            id
            profileRole
            contactCard {
              firstName
              lastName
            }
            ...MultiUserScreenUserListItem_Profile
            ...MultiUserDetailModal_Profile
          }
        }
      }
    `,
  );

  const { profileInfos } = useAuthState();
  const submit = handleSubmit(
    async value => {
      if (profileInfos) {
        Keyboard.dismiss();
        let avatarId: string | undefined = undefined;
        const { avatar, ...data } = value;
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
            target: 'avatar',
          });
          const { /* progress: uploadProgress, */ promise: uploadPromise } =
            uploadMedia(file, uploadURL, uploadParameters);
          // setProgressIndicator(uploadProgress);
          const { public_id } = await uploadPromise;
          avatarId = public_id;
        }

        const {
          selectedContact,
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

        const email =
          selectedContact.countryCodeOrEmail === 'email'
            ? selectedContact.value
            : undefined;

        const phoneNumber =
          selectedContact.countryCodeOrEmail !== 'email'
            ? parsePhoneNumber(
                selectedContact.value,
                selectedContact.countryCodeOrEmail,
              ).formatInternational()
            : undefined;

        const invited = {
          email,
          phoneNumber,
          profileRole: data.role,
          contactCard: {
            firstName,
            lastName,
            phoneNumbers,
            emails,
            title,
            company,
            urls,
            birthday,
            socials,
            avatarId: avatarId ? encodeMediaId(avatarId, 'image') : avatarId,
            addresses,
          },
        };

        commit({
          variables: {
            profileId: profileInfos.profileId,
            invited,
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
            const invitedProfile = data?.inviteUser?.profile;
            const webCard = store?.get(profileInfos.webCardId);
            if (invitedProfile && webCard) {
              const connection = ConnectionHandler.getConnection(
                webCard,
                'MultiUserScreenUserList_webCard_connection_profiles',
              );
              const newProfileRecord = store.get(invitedProfile.id);
              if (connection && newProfileRecord) {
                const edges = connection.getLinkedRecords('edges');
                if (edges) {
                  const invitedContactCard = {
                    firstName: invitedProfile?.contactCard?.firstName,
                    lastName: invitedProfile?.contactCard?.lastName,
                  };
                  let cursor: string | null = null;
                  for (let index = 0; index < edges.length; index++) {
                    const edge = edges[index];
                    const dataId = edges[index]
                      .getLinkedRecord('node')
                      ?.getDataID();
                    const profile = store.get(dataId!);
                    const profileRole = profile?.getValue('profileRole');
                    if (profileRole === invitedProfile.profileRole) {
                      const contactCard = profile?.getLinkedRecord<{
                        firstName: string;
                        lastName: string;
                      }>('contactCard');
                      const firstName = contactCard?.getValue('firstName');
                      const lastName = contactCard?.getValue('lastName');

                      if (
                        isAfter(invitedContactCard, {
                          firstName,
                          lastName,
                        })
                      ) {
                        cursor = edge.getValue('cursor') as string;
                        break;
                      }
                    }
                  }

                  const edge = ConnectionHandler.createEdge(
                    store,
                    connection,
                    newProfileRecord,
                    'WebCardEdge',
                  );
                  if (cursor) {
                    ConnectionHandler.insertEdgeAfter(connection, edge, cursor);
                  } else {
                    ConnectionHandler.insertEdgeAfter(connection, edge);
                  }
                }
              }
            }
            //update the user counter profile?.webCard?.nbProfiles
            const nbProfiles = webCard?.getValue('nbProfiles') as number;
            webCard?.setValue(nbProfiles + 1, 'nbProfiles');
          },
        });
      }
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
              <Text variant="large" style={styles.name}>
                {firstName} {lastName}
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
                loading={isSubmitting || saving}
              />
            }
          />
          <ContactCardEditForm
            commonInformation={commonInformation}
            control={control as unknown as Control<ContactCardEditFormValues>}
            hideImagePicker={() => setShowImagePicker(false)}
            showImagePicker={() => setShowImagePicker(true)}
            imagePickerVisible={showImagePicker}
            isMultiUser={true}
          >
            <MultiUserAddForm contacts={contacts} control={control} />
          </ContactCardEditForm>
        </SafeAreaView>
        {isSubmitting || saving ? (
          /* Used to prevent user from interacting with the screen while saving */
          <View style={StyleSheet.absoluteFill} />
        ) : null}
      </Container>
    </ScreenModal>
  );
};
/**
 * This is a hack because of the way the contact object is structured
 *
 * @param {Contact} user
 * @param {boolean} withLabel: Hack to get the label of contact only in one part of react hook form, or use the number as label for another part instead of building 2 functions
 * @return {*}
 */
const getUserContacts = (user: Contact) => {
  const phoneNumber = convertToNonNullArray(
    (user.phoneNumbers ?? []).map(a => {
      if (a.digits) {
        let formattedNumber = a.digits;
        if (a.digits.startsWith('+') && parsePhoneNumberFromString(a.digits)) {
          formattedNumber = parsePhoneNumberFromString(
            a.digits,
          )!.formatInternational();
        } else if (
          a.countryCode &&
          parsePhoneNumberFromString(
            a.digits,
            a.countryCode?.toUpperCase() as CountryCode,
          )
        ) {
          formattedNumber = parsePhoneNumberFromString(
            a.digits,
            a.countryCode?.toUpperCase() as CountryCode,
          )!.formatInternational();
        }
        return {
          id: formattedNumber,
          label: normalizePhoneMailLabel(a.label),
          countryCodeOrEmail: a.countryCode?.toUpperCase() as CountryCode,
        };
      }
      return null;
    }),
  );
  const emails = convertToNonNullArray(
    (user.emails ?? []).map(a => {
      if (a.email)
        return { id: a.email!, label: a.email!, countryCodeOrEmail: 'email' };
      return null;
    }),
  );
  return [...phoneNumber, ...emails] as Array<{
    id: string;
    label: string;
    countryCodeOrEmail: CountryCode | 'email';
  }>;
};

const normalizePhoneMailLabel = (label?: string) => {
  if (!label) return 'Other';
  if (CardPhoneLabels.includes(label)) {
    return label;
  }
  //try with capitalization of the first letter
  const capitalizedLabel = capitalize(label);
  if (CardPhoneLabels.includes(capitalizedLabel)) {
    return capitalizedLabel;
  }
  return 'Other';
};

const styles = StyleSheet.create({
  name: {
    maxWidth: '50%',
    textAlign: 'center',
  },
});

export default forwardRef(MultiUserAddModal);

const isAfter = (
  profileA: {
    firstName: string | null | undefined;
    lastName: string | null | undefined;
  },
  profileB: {
    firstName: string | null | undefined;
    lastName: string | null | undefined;
  },
) => {
  if (profileA.firstName && profileB.firstName) {
    const firstNameComparison = profileA.firstName.localeCompare(
      profileB.firstName,
    );
    if (firstNameComparison !== 0) {
      return firstNameComparison;
    }
  } else if (profileA.firstName) {
    return -1; // profileA comes first if profileB.firstName is undefined
  } else if (profileB.firstName) {
    return 1; // profileB comes first if profileA.firstName is undefined
  }

  // If first names are equal or undefined, compare last names
  if (profileA.lastName && profileB.lastName) {
    return profileA.lastName.localeCompare(profileB.lastName);
  } else if (profileA.lastName) {
    return -1; // profileA comes first if profileB.lastName is undefined
  } else if (profileB.lastName) {
    return 1; // profileB comes first if profileA.lastName is undefined
  }

  // If all fields are equal or undefined, return 0
  return 0;
};
