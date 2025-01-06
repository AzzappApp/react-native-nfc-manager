import * as Sentry from '@sentry/react-native';
import {
  addContactAsync,
  presentFormAsync,
  updateContactAsync,
  PermissionStatus as ContactPermissionStatus,
} from 'expo-contacts';
import { File, Paths } from 'expo-file-system/next';
import { fromGlobalId } from 'graphql-relay';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import Toast from 'react-native-toast-message';
import {
  ConnectionHandler,
  graphql,
  useFragment,
  useMutation,
} from 'react-relay';
import { parseContactCard } from '@azzapp/shared/contactCardHelpers';
import { isDefined } from '@azzapp/shared/isDefined';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import CoverRenderer from '#components/CoverRenderer';
import { useRouter } from '#components/NativeRouter';
import { findLocalContact } from '#helpers/contactCardHelpers';
import { reworkContactForDeviceInsert } from '#helpers/contactListHelpers';
import { getLocalContactsMap } from '#helpers/getLocalContactsMap';
import useBoolean from '#hooks/useBoolean';
import { usePhonebookPermission } from '#hooks/usePhonebookPermission';
import useScreenInsets from '#hooks/useScreenInsets';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import CheckBox from '#ui/CheckBox';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import AddContactModalProfiles from './AddContactModalProfiles';
import type { AddContactModal_webCard$key } from '#relayArtifacts/AddContactModal_webCard.graphql';

import type { AddContactModalMutation } from '#relayArtifacts/AddContactModalMutation.graphql';
import type { AddContactModalProfiles_user$key } from '#relayArtifacts/AddContactModalProfiles_user.graphql';
import type { CheckboxStatus } from '#ui/CheckBox';
import type { CommonInformation } from '@azzapp/shared/contactCardHelpers';
import type { Contact, Image } from 'expo-contacts';

export const storage = new MMKV({
  id: 'contacts',
});

type Props = {
  contactData?: string | null;
  additionalContactData?: Pick<CommonInformation, 'socials' | 'urls'> & {
    avatarUrl?: string;
  };
  webCard: AddContactModal_webCard$key;
  user: AddContactModalProfiles_user$key;
};

const AddContactModal = ({
  contactData,
  additionalContactData,
  webCard: webCardKey,
  user: userKey,
}: Props) => {
  const [viewer, setViewer] = useState<string | null>(null);
  const {
    requestPhonebookPermissionAndRedirectToSettingsAsync,
    requestPhonebookPermissionAsync,
  } = usePhonebookPermission();

  const webCard = useFragment(
    graphql`
      fragment AddContactModal_webCard on WebCard {
        ...CoverRenderer_webCard
        id
        userName
      }
    `,
    webCardKey,
  );

  const [commit, saving] = useMutation<AddContactModalMutation>(graphql`
    mutation AddContactModalMutation(
      $profileId: ID!
      $input: AddContactInput!
    ) {
      addContact(profileId: $profileId, input: $input) {
        contact {
          id
        }
      }
    }
  `);

  const intl = useIntl();

  const [withShareBack, setWithShareBack] = useState<CheckboxStatus>('checked');
  const [scanned, setScanned] = useState<{
    contact: Contact;
    profileId: string;
  } | null>(null);

  const [show, open, close] = useBoolean(false);
  const router = useRouter();

  const getContactInput = useCallback(() => {
    if (!scanned || !viewer) return;

    const addresses = scanned.contact.addresses?.map(({ label, street }) => ({
      label,
      address: street ?? '',
    }));

    const emails = scanned.contact.emails?.map(({ label, email }) => ({
      label,
      address: email ?? '',
    }));

    const phoneNumbers = scanned.contact.phoneNumbers
      ?.map(({ label, number }) => ({
        label,
        number,
      }))
      .filter(({ number }) => !!number) as Array<{
      label: string;
      number: string;
    }>;

    const socials = (scanned.contact?.socialProfiles
      ?.filter(({ url }) => url)
      .map(({ label, url }) => ({
        label,
        url,
      })) ?? []) as Array<{
      label: string;
      url: string;
    }>;

    const urls =
      scanned.contact.urlAddresses
        ?.map(url => {
          return url.url ? { url: url.url } : undefined;
        })
        ?.filter(isDefined) || [];

    const birthdayItem = scanned.contact?.dates?.find(
      x => x.label === 'birthday',
    );
    const birthday =
      birthdayItem &&
      birthdayItem.year !== undefined &&
      birthdayItem.month !== undefined &&
      birthdayItem.day !== undefined
        ? `${birthdayItem.year}-${birthdayItem.month}-${birthdayItem.day}`
        : null;

    return {
      addresses: addresses ?? [],
      company: scanned.contact.company ?? '',
      emails: emails ?? [],
      firstname: scanned.contact.firstName ?? '',
      lastname: scanned.contact.lastName ?? '',
      phoneNumbers: phoneNumbers ?? [],
      profileId: scanned.profileId ?? '',
      title: scanned.contact.jobTitle ?? '',
      withShareBack: withShareBack === 'checked',
      birthday,
      urls,
      socials,
    };
  }, [scanned, viewer, withShareBack]);

  const onRequestAddContactToPhonebook = useCallback(async () => {
    if (!scanned) return;

    const findContact = async () => {
      const localContacts = await getLocalContactsMap();
      const phoneNumbers =
        scanned.contact.phoneNumbers
          ?.map(({ number }) => number)
          .filter(isDefined) || [];
      const emails =
        scanned.contact.emails?.map(({ email }) => email).filter(isDefined) ||
        [];

      return findLocalContact(
        storage,
        phoneNumbers,
        emails,
        localContacts,
        scanned.profileId,
      );
    };

    const name = `${
      `${scanned.contact.firstName ?? ''}  ${scanned.contact.lastName ?? ''}`.trim() ||
      scanned.contact.company ||
      webCard.userName
    }`;

    let foundContact: Contact | undefined = undefined;
    const { status } = await requestPhonebookPermissionAsync();
    if (status === ContactPermissionStatus.GRANTED) {
      foundContact = await findContact();
    }

    const addOrUpdateText = foundContact
      ? intl.formatMessage({
          defaultMessage: 'Update',
          description:
            'confirmation button displayed to update an existing contact on phone',
        })
      : intl.formatMessage({
          defaultMessage: 'Add',
          description:
            'confirmation button displayed to add an new contact on phone',
        });

    Alert.alert(
      intl.formatMessage({
        defaultMessage: 'Add to Phone contact',
        description: 'Alert title when adding a profile to contacts',
      }),
      intl.formatMessage(
        {
          defaultMessage: 'Add {name} to the contacts list of your phone',
          description: 'Alert message when adding a profile to contacts',
        },
        {
          name,
        },
      ),
      [
        {
          text: addOrUpdateText,
          onPress: async () => {
            try {
              let messageToast = '';
              // Here we don't want to display popup
              const { status } =
                await requestPhonebookPermissionAndRedirectToSettingsAsync();
              if (status === ContactPermissionStatus.GRANTED) {
                if (!foundContact) {
                  foundContact = await findContact();
                }
                if (foundContact && foundContact.id) {
                  const updatedContact = reworkContactForDeviceInsert({
                    ...scanned.contact,
                    urlAddresses:
                      additionalContactData?.urls?.map(addr => {
                        return { label: 'default', address: addr.address };
                      }) || undefined,
                    socialProfiles:
                      additionalContactData?.socials?.map(social => {
                        return { ...social, address: social.url };
                      }) || undefined,
                    id: foundContact.id,
                  });
                  await updateContactAsync(updatedContact);
                  messageToast = intl.formatMessage({
                    defaultMessage: 'The contact was updated successfully.',
                    description:
                      'Toast message when a contact is updated successfully',
                  });
                } else {
                  const newContact = {
                    ...scanned.contact,
                    urls: additionalContactData?.urls,
                    socials: additionalContactData?.socials,
                  };
                  const contactToAddReworked =
                    reworkContactForDeviceInsert(newContact);
                  const resultId = await addContactAsync(contactToAddReworked);

                  if (scanned.profileId) {
                    storage.set(scanned.profileId, resultId);
                  }
                  messageToast = intl.formatMessage({
                    defaultMessage: 'The contact was created successfully.',
                    description:
                      'Toast message when a contact is created successfully',
                  });
                }

                Toast.show({
                  type: 'success',
                  text1: messageToast,
                });
              }
            } catch (e) {
              console.error(e);
            }
          },
        },
        {
          text: intl.formatMessage({
            defaultMessage: 'View Contact',
            description: 'Button to view the contact',
          }),
          onPress: async () => {
            const { status } =
              await requestPhonebookPermissionAndRedirectToSettingsAsync();
            if (status !== ContactPermissionStatus.GRANTED) {
              return;
            }

            if (Platform.OS === 'ios') {
              try {
                const updatedContact = reworkContactForDeviceInsert({
                  ...scanned.contact,
                  urlAddresses:
                    additionalContactData?.urls?.map(addr => {
                      return { label: 'default', address: addr.address };
                    }) || undefined,
                  socialProfiles:
                    additionalContactData?.socials?.map(social => {
                      return { ...social, address: social.url };
                    }) || undefined,
                });

                await presentFormAsync(null, updatedContact, {
                  isNew: true,
                });
              } catch (e) {
                console.warn(e);
                Sentry.captureException(e);
              }
            } else {
              router.push({
                route: 'CONTACT_DETAILS',
                params: {
                  ...scanned.contact,
                  createdAt: new Date(),
                  profileId: scanned.profileId,
                },
              });
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      {
        // options
        cancelable: true,
      },
    );
  }, [
    scanned,
    webCard.userName,
    requestPhonebookPermissionAsync,
    intl,
    requestPhonebookPermissionAndRedirectToSettingsAsync,
    additionalContactData?.urls,
    additionalContactData?.socials,
    router,
  ]);

  const onAddContactToAzzapp = useCallback(() => {
    if (!scanned || !viewer) return;
    const input = getContactInput();
    if (!input) return;
    commit({
      variables: {
        input,
        profileId: viewer,
      },
      updater: (store, response) => {
        if (response && response.addContact) {
          const profile = store.get(viewer);
          const nbContacts = profile?.getValue('nbContacts');

          if (typeof nbContacts === 'number') {
            profile?.setValue(nbContacts + 1, 'nbContacts');
          }

          const nbNewContacts = profile?.getValue('nbNewContacts');
          if (typeof nbNewContacts === 'number') {
            profile?.setValue(nbNewContacts + 1, 'nbNewContacts');
          }

          if (profile) {
            ConnectionHandler.getConnection(
              profile,
              'Profile_searchContacts',
            )?.invalidateRecord();
          }
        } else {
          console.warn('fail to add contact ?');
        }
      },
      onCompleted: close,
      onError: e => {
        console.warn('error adding contact', e);
      },
    });
  }, [scanned, viewer, getContactInput, commit, close]);

  const onDismiss = useCallback(() => {
    router.pop(1);
    onRequestAddContactToPhonebook();
  }, [onRequestAddContactToPhonebook, router]);

  useEffect(() => {
    (async () => {
      if (!scanned && contactData && webCard) {
        const { contact, webCardId, profileId } = await buildContact(
          contactData,
          additionalContactData,
          webCard.userName,
        );
        if (webCardId === fromGlobalId(webCard.id).id) {
          setScanned({ contact, profileId });
          open();
        }
      }
    })();
  }, [contactData, webCard, additionalContactData, scanned, open]);

  const onShowContact = useCallback(() => {
    if (!scanned) return;

    // When user click on add contact, the contact shall always be added to azzapp contacts
    onAddContactToAzzapp();
    const messageToast = intl.formatMessage({
      defaultMessage: 'The contact was created successfully.',
      description: 'Toast message when a contact is created successfully',
    });
    Toast.show({
      type: 'success',
      text1: messageToast,
    });
  }, [intl, onAddContactToAzzapp, scanned]);

  const userName = useMemo(() => {
    if (scanned) {
      const { contact } = scanned;

      if (contact.firstName || contact.lastName) {
        return `${contact.firstName} ${contact.lastName}`;
      }

      if (contact.company) {
        return contact.company;
      }
    }

    return webCard.userName;
  }, [scanned, webCard.userName]);

  const { bottom } = useScreenInsets();

  return (
    <BottomSheetModal
      visible={show}
      onDismiss={onDismiss}
      height={675 + bottom}
      lazy
      enableContentPanningGesture={false}
    >
      <Header
        middleElement={
          <Text variant="large" style={styles.headerText} numberOfLines={3}>
            <FormattedMessage
              defaultMessage="Add {userName} to your contacts"
              description="Title for add contact modal"
              values={{
                userName,
              }}
            />
          </Text>
        }
        leftElement={
          <PressableNative onPress={close}>
            <Icon icon="close" />
          </PressableNative>
        }
      />
      <View style={styles.section}>
        <CoverRenderer webCard={webCard} width={120} canPlay={false} />
      </View>
      <View style={styles.separator}>
        <Icon icon="arrow_down" />
        <Icon icon="arrow_up" style={{ marginLeft: 10 }} />
      </View>
      <AddContactModalProfiles user={userKey} onSelectProfile={setViewer} />

      <View style={{ paddingHorizontal: 20 }}>
        <CheckBox
          label={intl.formatMessage({
            defaultMessage: 'Share back your contact details',
            description: 'AddContactModal - shareback title',
          })}
          labelStyle={styles.label}
          style={styles.checkbox}
          status={withShareBack}
          onValueChange={setWithShareBack}
        />
        <Button
          loading={saving}
          style={styles.button}
          label={intl.formatMessage({
            defaultMessage: 'Add to my WebCard contacts',
            description: 'AddContactModal - Submit title',
          })}
          onPress={onShowContact}
        />
      </View>
    </BottomSheetModal>
  );
};

const buildContact = async (
  contactCardData: string,
  additionalContactData: Props['additionalContactData'],
  userName?: string,
) => {
  const {
    profileId,
    webCardId,
    firstName,
    addresses,
    lastName,
    company,
    title,
    phoneNumbers,
    emails,
    birthday,
  } = parseContactCard(contactCardData);

  let image: Image | undefined = undefined;

  if (additionalContactData?.avatarUrl) {
    try {
      const avatar = new File(Paths.cache.uri + profileId);
      if (avatar.exists) {
        // be sure that avatar can be refreshed
        avatar.delete();
      }
      avatar.create();
      await File.downloadFileAsync(additionalContactData.avatarUrl, avatar);

      image = {
        width: 720,
        height: 720,
        uri: avatar.uri,
      };
    } catch (e) {
      console.warn('error downloading avatar', e);
      Sentry.captureException(e);
    }
  }

  const birthdayDate = birthday ? new Date(birthday) : undefined;

  const contact: Contact = {
    id: profileId,
    contactType: 'person',
    firstName: firstName ?? '',
    lastName: lastName ?? '',
    name: `${firstName ?? ''} ${lastName ?? ''}`,
    company: company ?? '',
    jobTitle: title ?? '',
    addresses: addresses.map(address => ({
      label: address[0],
      street: address[1],
      isPrimary: address[0] === 'Main',
      id: `${profileId}-${address[1]}`,
    })),
    phoneNumbers: phoneNumbers.map(phone => ({
      label:
        Platform.OS === 'android' && phone[0] !== 'Main'
          ? phone[0].toLowerCase()
          : phone[0],
      number: phone[1],
      isPrimary: phone[0] === 'Main',
      id: `${profileId}-${phone[1]}`,
    })),
    emails: emails.map(email => ({
      label:
        Platform.OS === 'android' && email[0] !== 'Main'
          ? email[0].toLowerCase()
          : email[0],
      email: email[1],
      isPrimary: email[0] === 'Main',
      id: `${profileId}-${email[1]}`,
    })),
    dates: birthdayDate
      ? [
          {
            label: 'birthday',
            year: birthdayDate?.getFullYear(),
            month: birthdayDate?.getMonth(),
            day: birthdayDate?.getDate(),
            id: `${profileId}-birthday`,
          },
        ]
      : [],
    socialProfiles:
      additionalContactData?.socials?.map(social => ({
        label: social.label,
        url: social.url,
        id: `${profileId}-${social.label}`,
        service: social.label,
      })) ?? [],
    urlAddresses: (userName
      ? [
          {
            label: 'azzapp',
            url: buildUserUrl(userName),
            id: `${profileId}-azzapp`,
          },
        ]
      : []
    ).concat(
      additionalContactData?.urls?.map(url => ({
        label: '',
        url:
          !url.address || url.address.toLocaleLowerCase().startsWith('http')
            ? url.address
            : `http://${url.address}`,
        id: `${profileId}-${url.address}`,
      })) ?? [],
    ),
    image,
  };

  return { contact, webCardId, profileId };
};

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    alignItems: 'center',
  },
  separator: {
    marginTop: 20,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  checkbox: {
    marginTop: 20,
  },
  label: {
    marginLeft: 10,
  },
  button: {
    marginTop: 20,
  },
  headerText: {
    textAlign: 'center',
    marginHorizontal: 25,
  },
});

export default AddContactModal;
