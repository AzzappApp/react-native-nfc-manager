import * as Sentry from '@sentry/react-native';
import { File, Paths } from 'expo-file-system/next';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import {
  graphql,
  useFragment,
  useLazyLoadQuery,
  useMutation,
} from 'react-relay';
import { parseContactCard } from '@azzapp/shared/contactCardHelpers';
import { isDefined } from '@azzapp/shared/isDefined';
import { buildWebUrl } from '@azzapp/shared/urlHelpers';
import { colors } from '#theme';
import useOnInviteContact from '#components/Contact/useOnInviteContact';
import CoverRenderer from '#components/CoverRenderer';
import { useRouter } from '#components/NativeRouter';
import ProfilesSelector, {
  ProfilesSelectorFallback,
} from '#components/ProfilesSelector';
import {
  stringToContactAddressLabelType,
  stringToContactEmailLabelType,
  stringToContactPhoneNumberLabelType,
  addContactUpdater,
} from '#helpers/contactHelpers';
import { createHash } from '#helpers/cryptoHelpers';
import { isFileURL } from '#helpers/fileHelpers';
import { prepareAvatarForUpload } from '#helpers/imageHelpers';
import { uploadMedia } from '#helpers/MobileWebAPI';
import useBoolean from '#hooks/useBoolean';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import CheckBox from '#ui/CheckBox';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { ContactType } from '#helpers/contactHelpers';
import type { AddContactModal_webCard$key } from '#relayArtifacts/AddContactModal_webCard.graphql';

import type {
  AddContactModalMutation,
  ContactInput,
} from '#relayArtifacts/AddContactModalMutation.graphql';
import type { AddContactModalProfilesSelectorQuery } from '#relayArtifacts/AddContactModalProfilesSelectorQuery.graphql';
import type { useOnInviteContactDataQuery_contact$key } from '#relayArtifacts/useOnInviteContactDataQuery_contact.graphql';
import type { WebCardRoute } from '#routes';
import type { CheckboxStatus } from '#ui/CheckBox';
import type { ContactCard } from '@azzapp/shared/contactCardHelpers';
import type { Image } from 'expo-contacts';

type Props = {
  params: WebCardRoute['params'];
  webCard: AddContactModal_webCard$key;
};

const AddContactModal = ({
  params: {
    additionalContactData,
    contactData,
    geolocation,
    contactCard,
    avatarUrl,
    contactProfileId,
  },
  webCard: webCardKey,
}: Props) => {
  const [viewer, setViewer] = useState<string | null>(null);
  const [contactKey, setContactKey] = useState<
    | (useOnInviteContactDataQuery_contact$key & {
        firstName: string;
        lastName: string;
        company: string;
        id: string;
      })
    | null
    | undefined
  >(null);

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
      $contact: ContactInput!
      $withShareBack: Boolean!
    ) {
      createContact(
        profileId: $profileId
        input: $contact
        notify: false
        scanUsed: false
        withShareBack: $withShareBack
      ) {
        contact {
          id
          lastName
          firstName
          company
          ...useOnInviteContactDataQuery_contact
          ...ContactActionModal_contact
          ...ContactsHorizontalList_contacts
          ...ContactDetailsBody_contact
          ...ContactsListItem_contact
        }
      }
    }
  `);

  const intl = useIntl();

  const [withShareBack, setWithShareBack] = useState<CheckboxStatus>('checked');
  const [scanned, setScanned] = useState<ContactType | null>(null);

  const [show, open, close] = useBoolean(false);
  const router = useRouter();

  const getContactInput = useCallback(async (): Promise<
    ContactInput | undefined
  > => {
    if (!scanned || !viewer) return;

    let uploadedAvatarId: string | undefined;
    if (isFileURL(scanned.avatar?.uri) && scanned.avatar?.uri) {
      const { file, uploadURL, uploadParameters } =
        await prepareAvatarForUpload(scanned.avatar?.uri);

      uploadedAvatarId = await uploadMedia(
        file,
        uploadURL,
        uploadParameters,
      ).promise.then(({ public_id }) => {
        return public_id;
      });
    }

    const addresses = scanned.addresses;
    const emails = scanned.emails;

    const phoneNumbers = scanned.phoneNumbers?.filter(({ number }) => !!number);

    const socials = scanned?.socials?.filter(({ url }) => url);
    const urls = scanned.urls?.filter(isDefined) || [];

    return {
      addresses: addresses?.map(address => ({
        label: address.label,
        address: address.address,
      })),
      company: scanned.company,
      emails:
        emails?.map(email => ({
          label: email.label,
          address: email.address,
        })) ?? [],
      firstName: scanned.firstName,
      lastName: scanned.lastName,
      phoneNumbers:
        phoneNumbers?.map(number => ({
          label: number.label,
          number: number.number,
        })) ?? [],
      title: scanned.title,
      birthday: scanned.birthday,
      contactProfileId: scanned.profileId,
      urls: urls.map(url => ({ url: url.url })),
      socials: socials?.map(social => ({
        label: social.label,
        url: social.url,
      })),
      avatarId: uploadedAvatarId,
      location: geolocation?.location,
      meetingPlace: geolocation?.address,
    };
  }, [geolocation, scanned, viewer]);

  const onInviteContact = useOnInviteContact();

  const onRequestAddContactToPhonebook = useCallback(async () => {
    if (!contactKey) return;
    const name = `${
      `${contactKey.firstName ?? ''}  ${contactKey.lastName ?? ''}`.trim() ||
      contactKey.company ||
      webCard.userName
    }`;

    const addText = intl.formatMessage({
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
          text: addText,
          onPress: async () => {
            try {
              await onInviteContact(contactKey);
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
            if (contactKey?.id) {
              router.push({
                route: 'CONTACT_DETAILS',
                params: {
                  contactId: contactKey.id,
                  overlay: 'tooltipVisible',
                },
              });
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      {
        cancelable: true,
      },
    );
  }, [contactKey, webCard.userName, intl, onInviteContact, router]);

  const hasPhoneInsertRequested = useRef(false);
  useEffect(() => {
    if (contactKey && !hasPhoneInsertRequested.current) {
      hasPhoneInsertRequested.current = true;
      onRequestAddContactToPhonebook();
    }
  }, [contactKey, onRequestAddContactToPhonebook]);

  const onAddContactToProfile = useCallback(async () => {
    if (!scanned || !viewer) return;
    const contact = await getContactInput();
    if (!contact) return;
    commit({
      variables: {
        profileId: viewer,
        contact,
        withShareBack: withShareBack === 'checked',
      },
      updater: (store, response) => {
        if (response && response.createContact) {
          const user = store.getRoot().getLinkedRecord('currentUser');
          const newContact = store
            .getRootField('createContact')
            ?.getLinkedRecord('contact');
          if (!user || !newContact) {
            return;
          }
          addContactUpdater(store, user, newContact);
        } else {
          console.warn('fail to add contact ?');
        }
      },
      onCompleted: data => {
        close();
        Toast.show({
          type: 'success',
          text1: intl.formatMessage({
            defaultMessage: 'The contact was created successfully.',
            description: 'Toast message when a contact is created successfully',
          }),
        });
        setContactKey(data.createContact?.contact);
      },
      onError: e => {
        console.warn('error adding contact', e);
        Sentry.captureException(e);
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'The contact was not create. try again',
            description:
              'Toast message when a contact failed to be created successfully',
          }),
        });
      },
    });
  }, [scanned, viewer, getContactInput, commit, withShareBack, close, intl]);

  useEffect(() => {
    (async () => {
      if (!webCard.userName) {
        Sentry.captureMessage(
          'null username in AddContactModal / in contact build',
        );
        return;
      }
      if (!scanned && webCard) {
        if (contactData) {
          const contact = await buildContact(
            contactData,
            additionalContactData,
            webCard.userName,
          );

          setScanned(contact);
          open();
        } else if (contactCard) {
          const { contact } = await buildContactFromContactCard(
            contactCard,
            contactProfileId ?? '',
            avatarUrl,
            webCard.userName,
          );

          setScanned(contact);
          open();
        }
      }
    })();
  }, [
    contactData,
    webCard,
    additionalContactData,
    scanned,
    open,
    contactCard,
    avatarUrl,
    contactProfileId,
  ]);

  const userName = useMemo(() => {
    if (scanned) {
      if (scanned.firstName || scanned.lastName) {
        return `${scanned?.firstName ?? ''} ${scanned?.lastName ?? ''}`.trim();
      }

      if (scanned.company) {
        return scanned.company;
      }
    }

    return webCard.userName;
  }, [scanned, webCard.userName]);

  const { bottom } = useScreenInsets();

  const dim = useScreenDimensions();
  // case for little height screen
  const coverWidth = dim.height < 700 + bottom ? dim.width / 4 : 120;

  return (
    <BottomSheetModal visible={show} lazy enableContentPanningGesture={false}>
      <Header
        middleElement={
          <View style={styles.headerMiddleContent}>
            <Text variant="large" style={styles.headerText} numberOfLines={3}>
              <FormattedMessage
                defaultMessage="Add {userName} to your contacts"
                description="Title for add contact modal"
                values={{
                  userName,
                }}
              />
            </Text>
          </View>
        }
        middleElementStyle={styles.headerMiddle}
      />
      <View style={styles.section}>
        <CoverRenderer webCard={webCard} width={coverWidth} canPlay={false} />
      </View>
      <View style={styles.separator}>
        <Icon icon="arrow_down" />
        <Icon icon="arrow_up" style={{ marginLeft: 10 }} />
      </View>

      <Suspense fallback={<ProfilesSelectorFallback />}>
        <AddContactModalProfilesSelector onSelectProfile={setViewer} />
      </Suspense>

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
          onPress={onAddContactToProfile}
        />
        <PressableNative onPress={close} style={styles.notAddButton}>
          <Text variant="medium" style={styles.notAddLabel}>
            <FormattedMessage
              defaultMessage="Do not add"
              description="AddContactModal - Not add title"
            />
          </Text>
        </PressableNative>
      </View>
    </BottomSheetModal>
  );
};

export default AddContactModal;

const downloadAvatar = async (avatarUrl?: string) => {
  let image: Image | undefined = undefined;
  if (avatarUrl) {
    try {
      const hash = createHash(avatarUrl);
      const avatar = new File(Paths.cache.uri + hash);
      if (!avatar.exists) {
        await File.downloadFileAsync(avatarUrl, avatar);
      }

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

  return image;
};

const buildContactFromContactCard = async (
  contactCard: ContactCard,
  profileId: string,
  avatarUrl?: string,
  userName?: string,
) => {
  const image = await downloadAvatar(avatarUrl);

  const contact: ContactType = {
    firstName: contactCard.firstName ?? '',
    lastName: contactCard.lastName ?? '',
    company: contactCard.company ?? '',
    title: contactCard.title ?? '',
    addresses: contactCard.addresses?.map(address => ({
      label: stringToContactAddressLabelType(address.label),
      address: address.address,
      isPrimary: address.label === 'Main',
    })),
    phoneNumbers: contactCard.phoneNumbers?.map(phone => ({
      label: stringToContactPhoneNumberLabelType(phone.label),
      number: phone.number,
      isPrimary: phone.label === 'Main',
    })),
    emails: contactCard.emails?.map(email => ({
      label: stringToContactEmailLabelType(email.label),
      address: email.address,
      isPrimary: email.label === 'Main',
    })),
    birthday: contactCard.birthday?.birthday,
    socials:
      contactCard?.socials?.map(social => ({
        label: social.label,
        url: social.url,
        service: social.label,
      })) ?? [],
    urls: (userName
      ? [
          {
            label: 'azzapp',
            url: buildWebUrl(userName),
          },
        ]
      : []
    ).concat(
      contactCard?.urls?.map(url => ({
        label: '',
        url:
          !url.address || url.address.toLocaleLowerCase().startsWith('http')
            ? url.address
            : `https://${url.address}`,
      })) ?? [],
    ),
    avatar: {
      uri: image?.uri,
    },
    profileId,
    meetingDate: new Date(),
  };

  return { contact };
};

type AddContactModalProfilesSelectorProps = {
  onSelectProfile: (profileId: string) => void;
};

const AddContactModalProfilesSelector = ({
  onSelectProfile,
}: AddContactModalProfilesSelectorProps) => {
  const { currentUser } =
    useLazyLoadQuery<AddContactModalProfilesSelectorQuery>(
      graphql`
        query AddContactModalProfilesSelectorQuery {
          currentUser {
            profiles {
              ...ProfilesSelector_profiles
            }
          }
        }
      `,
      {},
    );

  return (
    <ProfilesSelector
      profiles={currentUser?.profiles ?? null}
      onSelectProfile={onSelectProfile}
    />
  );
};

const buildContact = async (
  contactCardData: string,
  additionalContactData: WebCardRoute['params']['additionalContactData'],
  userName?: string,
): Promise<ContactType> => {
  const {
    profileId,
    firstName,
    addresses,
    lastName,
    company,
    title,
    phoneNumbers,
    emails,
    birthday,
  } = parseContactCard(contactCardData);

  const image = await downloadAvatar(additionalContactData?.avatarUrl);

  const contact: ContactType = {
    id: profileId,
    firstName,
    lastName,
    company,
    title,
    addresses: addresses.map(address => ({
      label: stringToContactAddressLabelType(address[0]),
      address: address[1],
    })),
    phoneNumbers: phoneNumbers.map(phone => {
      const label = stringToContactPhoneNumberLabelType(
        Platform.OS === 'android' && phone[0] !== 'Main'
          ? phone[0].toLowerCase()
          : phone[0],
      );
      return {
        label,
        number: phone[1],
      };
    }),
    emails: emails.map(email => ({
      label: stringToContactEmailLabelType(
        Platform.OS === 'android' && email[0] !== 'Main'
          ? email[0].toLowerCase()
          : email[0],
      ),
      address: email[1],
    })),
    birthday,
    socials:
      additionalContactData?.socials?.map(social => ({
        label: social.label,
        url: social.url,
      })) ?? [],
    urls: (userName
      ? [
          {
            url: buildWebUrl(userName),
          },
        ]
      : []
    ).concat(
      additionalContactData?.urls?.map(url => ({
        url:
          !url.address || url.address.toLocaleLowerCase().startsWith('http')
            ? url.address
            : `https://${url.address}`,
      })) ?? [],
    ),
    avatar: {
      uri: image?.uri,
    },
    profileId,
    meetingDate: new Date(),
  };
  return contact;
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
  notAddButton: {
    margin: 20,
    alignItems: 'center',
  },
  notAddLabel: {
    color: colors.grey200,
  },
  headerText: {
    textAlign: 'center',
    marginHorizontal: 25,
  },
  headerMiddle: {
    justifyContent: 'flex-start',
  },
  headerMiddleContent: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
  },
});
