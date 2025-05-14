import { zodResolver } from '@hookform/resolvers/zod';
import * as Sentry from '@sentry/react-native';
import parsePhoneNumberFromString, {
  parsePhoneNumberWithError,
} from 'libphonenumber-js';
import capitalize from 'lodash/capitalize';
import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { View, StyleSheet, Keyboard } from 'react-native';
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
import { isDefined } from '@azzapp/shared/isDefined';
import { isValidEmail } from '@azzapp/shared/stringHelpers';
import { ScreenModal } from '#components/NativeRouter';
import { getAuthState } from '#helpers/authStore';
import { CardPhoneLabels } from '#helpers/contactHelpers';
import {
  prepareAvatarForUpload,
  prepareLogoForUpload,
} from '#helpers/imageHelpers';
import { getLocales, useCurrentLocale } from '#helpers/localeHelpers';
import {
  addLocalCachedMediaFile,
  downloadContactImage,
} from '#helpers/mediaHelpers';
import { uploadMedia } from '#helpers/MobileWebAPI';
import {
  getPhonenumberWithCountryCode,
  parseContactCardPhoneNumber,
} from '#helpers/phoneNumbersHelper';
import useOnSubscriptionError from '#hooks/useOnSubscriptionError';
import ContactCardEditForm from '#screens/ContactCardEditScreen/ContactCardEditForm';
import { baseUserDetailsSchema } from '#screens/MultiUserDetailsScreen/MultiUserDetailsSchema';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import SafeAreaView from '#ui/SafeAreaView';
import Text from '#ui/Text';
import MultiUserAddForm from './MultiUserAddForm';
import type { EmailPhoneInput } from '#components/EmailOrPhoneInput';
import type { ContactCardPhoneNumber } from '#helpers/phoneNumbersHelper';
import type { MultiUserAddModal_InviteUserMutation } from '#relayArtifacts/MultiUserAddModal_InviteUserMutation.graphql';
import type { MultiUserAddModal_webCard$key } from '#relayArtifacts/MultiUserAddModal_webCard.graphql';
import type { ContactCardFormValues } from '#screens/ContactCardEditScreen/ContactCardSchema';
import type { MultiUserAddFormValues } from './MultiUserAddForm';
import type { Address, Contact } from 'expo-contacts';
import type { CountryCode } from 'libphonenumber-js';
import type { ForwardedRef } from 'react';
import type { Control } from 'react-hook-form';

const multiUserAddFormSchema = baseUserDetailsSchema.extend({
  selectedContact: z
    .object({
      countryCodeOrEmail: z.string(),
      value: z.string(),
    })
    .refine(
      contact => {
        if (contact.countryCodeOrEmail === 'email') {
          return isValidEmail(contact.value);
        } else if (contact.countryCodeOrEmail) {
          return parsePhoneNumberFromString(
            contact.value,
            contact.countryCodeOrEmail as CountryCode,
          )?.isValid();
        }
      },
      {
        message: 'Invalid contact info',
      },
    ),
});

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
  const webCard = useFragment(
    graphql`
      fragment MultiUserAddModal_webCard on WebCard
      @argumentDefinitions(
        pixelRatio: {
          type: "Float!"
          provider: "CappedPixelRatio.relayprovider"
        }
      ) {
        id
        isMultiUser
        userName
        isPremium
        subscription {
          issuer
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
        logo {
          uri: uri(width: 180, pixelRatio: $pixelRatio)
          id
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
      logo: webCard?.logo,
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
        const formatExpoAddress = (addr: Address) => {
          let formatedAddress = '';
          if (addr.street?.length) {
            formatedAddress = addr.street;
          }
          if (addr.postalCode?.length) {
            if (formatedAddress?.length) {
              formatedAddress += ` ${addr.postalCode}`;
            }
          }
          if (addr.country?.length) {
            if (formatedAddress?.length) {
              formatedAddress += ` ${addr.country}`;
            }
          }
          return formatedAddress;
        };

        reset(
          {
            role: 'user',
            selectedContact,
            firstName: contact.firstName,
            lastName: contact.lastName,
            phoneNumbers:
              contact.phoneNumbers
                ?.map<ContactCardPhoneNumber>(a => ({
                  label: normalizePhoneMailLabel(a.label),
                  number: a.number || '',
                }))
                .map(parseContactCardPhoneNumber) ?? [],
            emails:
              contact.emails?.map(a => ({
                label: normalizePhoneMailLabel(a.label),
                address: a.email,
              })) ?? [],
            title: contact.jobTitle,
            company: contact.company ?? undefined,
            urls:
              contact.urlAddresses
                ?.map(a =>
                  a.url
                    ? {
                        address: a.url,
                      }
                    : null,
                )
                .filter(isDefined) ?? [],
            birthday:
              contact.birthday?.day &&
              contact.birthday.month &&
              contact.birthday.year
                ? {
                    birthday: new Date(
                      contact.birthday.year,
                      contact.birthday.month,
                      contact.birthday.day,
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
            addresses: contact.addresses?.map(addr => {
              return {
                label: addr.label,
                address: formatExpoAddress(addr),
              };
            }),
            socials: contact.socialProfiles?.map(social => {
              return {
                url: social.url,
                label: social.label,
                selected: true,
              };
            }),
            logo: webCard?.logo,
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
          logo: webCard?.logo,
        });
        setIsManual(isManual);
        setContact(undefined);
      }
      setVisible(true);
    },
  }));

  const [commit, saving] = useMutation<MultiUserAddModal_InviteUserMutation>(
    graphql`
      mutation MultiUserAddModal_InviteUserMutation(
        $profileId: ID!
        $invited: InviteUserInput!
      ) {
        inviteUser(profileId: $profileId, invited: $invited, sendInvite: true) {
          profile {
            id
            profileRole
            contactCard {
              firstName
              lastName
            }
          }
        }
      }
    `,
  );

  const onSubscriptionError = useOnSubscriptionError(
    webCard.subscription?.issuer === 'web',
  );

  const submit = handleSubmit(
    async value => {
      const { profileInfos } = getAuthState();
      const webCardId = profileInfos?.webCardId;
      const profileId = profileInfos?.profileId;
      if (!webCardId || !profileId) {
        return;
      }

      Keyboard.dismiss();

      const uploads = [];

      const { avatar, logo, ...data } = value;

      let avatarUri = avatar?.uri;
      if (avatar?.local && avatarUri) {
        if (avatarUri.startsWith('content://')) {
          try {
            avatarUri = `file://${await downloadContactImage(avatarUri)}`;
          } catch (e: any) {
            Sentry.captureException(e);
            console.warn(
              'error downloading contact image from phone contacts',
              e,
            );
          }
        }

        const { file, uploadURL, uploadParameters } =
          await prepareAvatarForUpload(avatarUri);

        uploads.push(uploadMedia(file, uploadURL, uploadParameters));
      } else {
        uploads.push(null);
      }
      let logoUri;
      if (logo?.local && logo.uri) {
        try {
          const { file, uploadURL, uploadParameters } =
            await prepareLogoForUpload(logo.uri);
          logoUri = file.uri;
          uploads.push(uploadMedia(file, uploadURL, uploadParameters));
        } catch (e) {
          Sentry.captureException(e);
          uploads.push(null);
        }
      } else {
        uploads.push(null);
      }
      try {
        const [uploadedAvatarId, uploadedLogoId] = await Promise.all(
          uploads.map(upload =>
            upload?.promise.then(({ public_id }) => {
              return public_id;
            }),
          ),
        );

        const avatarId =
          avatar === null
            ? null
            : avatar?.local
              ? uploadedAvatarId
              : avatar?.id;
        const logoId =
          logo === null ? null : logo?.local ? uploadedLogoId : null;

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
            ? parsePhoneNumberWithError(
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
            phoneNumbers: phoneNumbers
              ?.filter(phoneNumber => phoneNumber.number)
              .map(({ countryCode, ...phoneNumber }) => {
                const number = getPhonenumberWithCountryCode(
                  phoneNumber.number,
                  countryCode as CountryCode,
                );
                return { ...phoneNumber, number };
              }),
            emails,
            title,
            company,
            urls,
            birthday,
            socials,
            avatarId,
            logoId,
            addresses,
          },
        };

        if (avatar?.local && avatarUri) {
          addLocalCachedMediaFile(avatarId, 'image', avatarUri);
        }

        if (logoUri) {
          addLocalCachedMediaFile(logoId, 'image', logoUri);
        }

        commit({
          variables: {
            profileId,
            invited,
          },
          onCompleted: () => {
            beforeClose();
            onClose();
            onCompleted();
          },
          onError: e => {
            if (e.message === ERRORS.USER_IS_BLOCKED) {
              Toast.show({
                type: 'error',
                text1: intl.formatMessage({
                  defaultMessage:
                    'Error, this user is not allowed to user azzapp',
                  description:
                    'Error toast message when inviting user that is blocked from MultiUserAddModal',
                }),
              });
              return;
            }
            if (e.message === ERRORS.PROFILE_ALREADY_EXISTS) {
              Toast.show({
                type: 'error',
                text1: intl.formatMessage({
                  defaultMessage: 'Error, this user is already invited',
                  description:
                    'Error toast message when inviting user that is already a member from MultiUserAddModal',
                }),
              });
              return;
            }
            onSubscriptionError(e);
          },
          updater: (store, data) => {
            const invitedProfile = data?.inviteUser?.profile;
            const webCard = store?.get(webCardId);
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
                        }) < 0
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
                    ConnectionHandler.insertEdgeBefore(
                      connection,
                      edge,
                      cursor,
                    );
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
      } catch (e: any) {
        Sentry.captureException(e);
        console.warn('Error submit', e);
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Error, could not invite user. Please try again.',
            description:
              'Error toast message when inviting user from MultiUserAddModal',
          }),
        });
      }
    },
    error => {
      console.log(error);
    },
  );

  return (
    <ScreenModal
      visible={visible}
      animationType="slide"
      onRequestDismiss={onClose}
    >
      <Container style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
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
            webCard={webCard}
            control={control as unknown as Control<ContactCardFormValues>}
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
      const phoneNumber = a.digits || a.number;
      if (phoneNumber) {
        let formattedNumber = phoneNumber;
        let countryCode = a.countryCode?.toUpperCase() as CountryCode;

        const parsedPhoneNumber = parsePhoneNumberFromString(phoneNumber);
        if (phoneNumber.startsWith('+') && parsedPhoneNumber?.isValid()) {
          formattedNumber = parsedPhoneNumber.formatInternational();
          countryCode =
            (parsedPhoneNumber.country as CountryCode) ?? countryCode;
        } else if (
          a.countryCode &&
          parsePhoneNumberFromString(
            phoneNumber,
            a.countryCode?.toUpperCase() as CountryCode,
          )
        ) {
          formattedNumber = parsePhoneNumberFromString(
            phoneNumber,
            a.countryCode?.toUpperCase() as CountryCode,
          )!.formatInternational();
        } else {
          const country =
            user.addresses?.find(a => a.isoCountryCode)?.isoCountryCode ??
            getLocales()[0].countryCode;

          if (country) {
            countryCode = country.toUpperCase() as CountryCode;
            const parsed = parsePhoneNumberFromString(phoneNumber, countryCode);
            if (parsed?.isValid()) {
              formattedNumber = parsed.formatInternational();
            }
          }
        }
        return {
          id: formattedNumber,
          label: normalizePhoneMailLabel(a.label),
          countryCodeOrEmail: countryCode,
        };
      }
      return null;
    }),
  );
  const emails = convertToNonNullArray(
    (user.emails ?? []).map(a => {
      if (a.email)
        return {
          id: a.email!,
          label: a.email!,
          countryCodeOrEmail: 'email' as const,
        };
      return null;
    }),
  );

  return [...phoneNumber, ...emails].reduce(
    (
      acc: Array<{
        id: string;
        label: string;
        countryCodeOrEmail: CountryCode | 'email';
      }>,
      data,
    ) => {
      if (!acc.find(a => a.id === data.id)) {
        acc.push(data);
      }
      return acc;
    },
    [],
  );
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
