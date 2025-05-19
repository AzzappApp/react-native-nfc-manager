import * as Sentry from '@sentry/react-native';
import { File, Paths } from 'expo-file-system/next';
import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Image as ImageCompressor } from 'react-native-compressor';
import {
  ConnectionHandler,
  type RecordProxy,
  type RecordSourceProxy,
} from 'relay-runtime';
import VCard from 'vcard-creator';
import * as z from 'zod';
import {
  addressLabelToVCardLabel,
  emailLabelToVCardLabel,
  phoneLabelToVCardLabel,
} from '@azzapp/shared/vCardHelpers';
import { textStyles } from '#theme';
import { createStyleSheet } from '#helpers/createStyles';
import { phoneNumberSchema } from '#helpers/phoneNumbersHelper';
import { prefixWithHttp } from './contactListHelpers';
import type { ContactMeetingPlaceType, ContactType } from './contactTypes';
import type { ColorSchemeName } from 'react-native';

export const DELETE_BUTTON_WIDTH = 70;
export const MAX_FIELD_HEIGHT = 85;
const MIN_FIELD_HEIGHT = 72;

//TODO: if this updated color is validated after dev test
// (respecting our color and not using pure black, using transparancy because the background behing have the right color)
// we have to remove this param, but that will imply to udpate 12/15 files and remove useStyleSheet
// waiting for nico validation of this change. ()
export const buildContactStyleSheet = (_: ColorSchemeName) =>
  ({
    field: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: MIN_FIELD_HEIGHT,
      paddingHorizontal: 10,
    },
    fieldCommon: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      minHeight: MIN_FIELD_HEIGHT,
      paddingLeft: 10,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 7,
      minHeight: MIN_FIELD_HEIGHT,
      paddingRight: 20,
      paddingLeft: 10,
    },
    sectionsContainer: {
      rowGap: 1,
    },
    input: {
      flex: 1,
      padding: 0,
      maxHeight: MAX_FIELD_HEIGHT,
      height: undefined,
      backgroundColor: 'transparent',
      borderWidth: 0,
      paddingRight: 0,
      ...textStyles.medium,
    },
    fieldTitle: { minWidth: 120 },
  }) as const;

export const contactEditStyleSheet = createStyleSheet(buildContactStyleSheet);

export const useContactAddressLabels = () => {
  const intl = useIntl();

  const labelValues = useMemo(
    () => [
      {
        key: 'Home',
        value: intl.formatMessage({
          defaultMessage: 'Home',
          description:
            '"Home" value as type for an address in Contact Card edition',
        }),
      },
      {
        key: 'Work',
        value: intl.formatMessage({
          defaultMessage: 'Work',
          description:
            '"Work" value as type for an address in Contact Card edition',
        }),
      },
      {
        key: 'Main',
        value: intl.formatMessage({
          defaultMessage: 'Main',
          description:
            '"Main" value as type for an address in Contact Card edition',
        }),
      },
      {
        key: 'Other',
        value: intl.formatMessage({
          defaultMessage: 'Other',
          description:
            '"Other" value as type for an address in Contact Card edition',
        }),
      },
    ],
    [intl],
  );

  return labelValues;
};

export const useContactEmailLabels = () => {
  const intl = useIntl();

  const labelValues = useMemo(
    () => [
      {
        key: 'Home',
        value: intl.formatMessage({
          defaultMessage: 'Home',
          description:
            '"Home" value as type for an email in Contact Card edition',
        }),
      },
      {
        key: 'Work',
        value: intl.formatMessage({
          defaultMessage: 'Work',
          description:
            '"Work" value as type for an email in Contact Card edition',
        }),
      },
      {
        key: 'Main',
        value: intl.formatMessage({
          defaultMessage: 'Main',
          description:
            '"Main" value as type for an email in Contact Card edition',
        }),
      },

      {
        key: 'Other',
        value: intl.formatMessage({
          defaultMessage: 'Other',
          description:
            '"Other" value as type for an email in Contact Card edition',
        }),
      },
    ],
    [intl],
  );
  return labelValues;
};
export const CardPhoneLabels = [
  'Home',
  'Work',
  'Mobile',
  'Main',
  'Fax',
  'Other',
];
export const useContactPhoneLabels = () => {
  const intl = useIntl();

  const labelValues = useMemo(
    () => [
      {
        key: 'Home',
        value: intl.formatMessage({
          defaultMessage: 'Home',
          description:
            '"Home" value as type for a phone number in Contact Card edition',
        }),
      },
      {
        key: 'Work',
        value: intl.formatMessage({
          defaultMessage: 'Work',
          description:
            '"Work" value as type for a phone number in Contact Card edition',
        }),
      },
      {
        key: 'Mobile',
        value: intl.formatMessage({
          defaultMessage: 'Mobile',
          description:
            '"Mobile" value as type for a phone number in Contact Card edition',
        }),
      },
      {
        key: 'Main',
        value: intl.formatMessage({
          defaultMessage: 'Main',
          description:
            '"Main" value as type for a phone number in Contact Card edition',
        }),
      },
      {
        key: 'Fax',
        value: intl.formatMessage({
          defaultMessage: 'Fax',
          description:
            '"Fax" value as type for a phone number in Contact Card edition',
        }),
      },
      {
        key: 'Other',
        value: intl.formatMessage({
          defaultMessage: 'Other',
          description:
            '"Other" value as type for a phone number in Contact Card edition',
        }),
      },
    ],
    [intl],
  );

  return labelValues;
};

export const buildVCard = async (contact: ContactType) => {
  const vCard = new VCard();
  vCard.addName(contact.lastName ?? undefined, contact.firstName ?? undefined);
  if (contact.title) {
    vCard.addJobtitle(contact.title);
  }
  if (contact.birthday) {
    vCard.addBirthday(contact.birthday.toString());
  }
  if (contact.company) {
    vCard.addCompany(contact.company);
  }
  contact.phoneNumbers?.forEach(number => {
    if (number.number) {
      vCard.addPhoneNumber(
        `${number.number}`,
        phoneLabelToVCardLabel(number.label) || '',
      );
    }
  });
  contact.emails?.forEach(email => {
    if (email.address)
      vCard.addEmail(email.address, emailLabelToVCardLabel(email.label) || '');
  });

  contact.urls?.forEach(url => {
    if (url.url) vCard.addURL(prefixWithHttp(url.url));
  });

  contact.socials?.forEach(social => {
    if (social.url)
      vCard.addSocial(prefixWithHttp(social.url), social.label || '');
  });

  contact.addresses?.forEach(addr => {
    if (addr.address) {
      vCard.addAddress(
        undefined,
        undefined,
        addr.address,
        undefined,
        undefined,
        undefined,
        undefined,
        addressLabelToVCardLabel(addr.label),
      );
    }
  });

  const contactImageUrl = contact.avatar?.uri || contact.logo?.uri;
  const contactImageId = contact.avatar?.id || contact.logo?.id;
  if (contactImageId && contactImageUrl && contactImageUrl.startsWith('http')) {
    try {
      const file = new File(Paths.cache.uri + contactImageId);
      if (!file.exists) {
        await File.downloadFileAsync(contactImageUrl, file);
      }

      const image = await ImageCompressor.compress(file.uri, {
        output: 'jpg',
        quality: 0.7,
      });
      const imageFile = new File(image);
      if (imageFile.exists) {
        vCard.addPhoto(imageFile.base64(), 'jpeg');
      }
    } catch (e) {
      Sentry.captureException(e);
      console.error('download avatar failure', e);
    }
  }
  return vCard;
};

export const getFriendlyNameFromLocation = (
  meetingPlace?: ContactMeetingPlaceType | null,
) => {
  return (
    meetingPlace?.city ||
    meetingPlace?.subregion ||
    meetingPlace?.region ||
    meetingPlace?.country
  );
};

export const contactSchema = z
  .object({
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    company: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    phoneNumbers: z.array(phoneNumberSchema),
    emails: z.array(
      z.object({
        label: z.string(),
        address: z.string(),
      }),
    ),
    urls: z.array(
      z.object({
        url: z.string(),
      }),
    ),
    addresses: z.array(
      z.object({
        label: z.string(),
        address: z.string(),
      }),
    ),
    // @todo need to change birthday behaviour
    birthday: z
      .object({
        birthday: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
    meetingDate: z.date().optional(),
    socials: z.array(
      z.object({
        url: z.string(),
        label: z.string(),
      }),
    ),
    avatar: z
      .object({
        uri: z.string(),
        id: z.string().optional(),
        local: z.boolean().optional(),
      })
      .optional()
      .nullable(),
    logo: z
      .object({
        uri: z.string(),
        id: z.string().optional(),
        local: z.boolean().optional(),
      })
      .optional()
      .nullable(),
  })
  .refine(
    data => !!data.firstName || !!data.lastName || !!data.company,
    'Either one of firstname or lastname or company name should be filled in.',
  );

export type contactFormValues = z.infer<typeof contactSchema>;

const getContactsConnection = (
  store: RecordSourceProxy,
  user: RecordProxy,
  connectionName: string,
) => {
  const userContactsConnectionId = ConnectionHandler.getConnectionID(
    user.getDataID(),
    connectionName,
  );
  return userContactsConnectionId ? store.get(userContactsConnectionId) : null;
};

const getContactsByDateConnection = (
  store: RecordSourceProxy,
  user: RecordProxy,
) => {
  return getContactsConnection(store, user, 'currentUser_contactsByDates');
};

const getContactsByLocationConnection = (
  store: RecordSourceProxy,
  user: RecordProxy,
) => {
  return getContactsConnection(store, user, 'currentUser_contactsByLocation');
};
const getContactsByNameConnection = (
  store: RecordSourceProxy,
  user: RecordProxy,
) => {
  return getContactsConnection(store, user, 'currentUser_contacts');
};

export const addContactUpdater = (
  store: RecordSourceProxy,
  user: RecordProxy,
  newContact: RecordProxy,
) => {
  // Update currentUser nbContacts
  const userNbContacts = user.getValue('nbContacts');
  if (typeof userNbContacts === 'number') {
    user.setValue(userNbContacts + 1, 'nbContacts');
  }

  // Update user by date connection

  const userByDatesConnection = getContactsByDateConnection(store, user);
  if (userByDatesConnection) {
    const meetingDate = newContact.getValue('meetingDate');
    if (meetingDate) {
      const date = new Date(meetingDate.toString());
      const dateEdge = userByDatesConnection
        .getLinkedRecords('edges')
        ?.find(edge => {
          const node = edge?.getLinkedRecord('node');
          if (!node) {
            return false;
          }
          const edgeDateStr = node.getValue('date');
          if (typeof edgeDateStr !== 'string') {
            return false;
          }
          const edgeDate = new Date(edgeDateStr);
          return (
            edgeDate.getUTCFullYear() === date.getUTCFullYear() &&
            edgeDate.getUTCMonth() === date.getUTCMonth() &&
            edgeDate.getUTCDate() === date.getUTCDate()
          );
        });
      if (dateEdge) {
        const dateEdgeNode = dateEdge.getLinkedRecord('node');
        const nbContacts = dateEdgeNode?.getValue('nbContacts');
        dateEdgeNode?.setValue(
          typeof nbContacts === 'number' ? nbContacts + 1 : 1,
          'nbContacts',
        );
        dateEdgeNode?.setLinkedRecords(
          [newContact, ...(dateEdgeNode?.getLinkedRecords('contacts') ?? [])],
          'contacts',
        );
      } else {
        const node = store.create(
          `${user.getDataID()}_${date.toISOString()}`,
          'ContactsByDate',
        );
        node.setValue(date.toISOString(), 'date');
        node.setLinkedRecords([newContact], 'contacts');
        node.setValue(1, 'nbContacts');
        const newDateEdge = ConnectionHandler.createEdge(
          store,
          userByDatesConnection,
          node,
          'ContactsByDateEdge',
        );
        const nextEdge = userByDatesConnection
          .getLinkedRecords('edges')
          ?.find(edge => {
            const node = edge?.getLinkedRecord('node');
            if (!node) {
              return false;
            }
            const edgeDateStr = node.getValue('date');
            if (typeof edgeDateStr !== 'string') {
              return false;
            }
            const edgeDate = new Date(edgeDateStr);
            return edgeDate < date;
          });
        ConnectionHandler.insertEdgeBefore(
          userByDatesConnection,
          newDateEdge,
          nextEdge?.getValue('cursor') as string | undefined,
        );
      }
    }
  }

  // Update user by name connection
  const userContactsConnection = getContactsByNameConnection(store, user);
  if (userContactsConnection) {
    const edge = ConnectionHandler.createEdge(
      store,
      userContactsConnection,
      newContact,
      'ContactEdge',
    );

    const getCursorForContact = (contact: RecordProxy): string =>
      [
        contact.getValue('lastName'),
        contact.getValue('firstName'),
        contact.getValue('company'),
        contact.getLinkedRecord('webCard')?.getValue('userName'),
        contact.getValue('id'),
      ]
        .filter(Boolean)
        .join('\u0001');

    const cursorCompare = getCursorForContact(newContact);
    const prevRecordEdge = userContactsConnection
      .getLinkedRecords('edges')
      ?.find(edge => {
        const node = edge?.getLinkedRecord('node');
        if (!node) {
          return false;
        }
        const cursor = getCursorForContact(node);
        return cursor > cursorCompare;
      });

    ConnectionHandler.insertEdgeBefore(
      userContactsConnection,
      edge,
      prevRecordEdge?.getValue('cursor') as string | undefined,
    );
  }

  // Update user by location connection
  const userByLocationsConnection = getContactsByLocationConnection(
    store,
    user,
  );
  if (userByLocationsConnection) {
    const meetingPlace = newContact.getLinkedRecord('meetingPlace');
    const location: string | null = meetingPlace
      ? (getFriendlyNameFromLocation({
          city: meetingPlace?.getValue('city') as string | null,
          region: meetingPlace?.getValue('region') as string | null,
          subregion: meetingPlace?.getValue('subregion') as string | null,
          country: meetingPlace?.getValue('country') as string | null,
        }) ?? null)
      : null;

    const locationEdge = userByLocationsConnection
      .getLinkedRecords('edges')
      ?.find(edge => {
        const node = edge?.getLinkedRecord('node');
        if (!node) {
          return false;
        }
        const locationName = node.getValue('location');
        return (locationName ?? null) === location;
      });

    if (locationEdge) {
      const locationEdgeNode = locationEdge.getLinkedRecord('node');
      const nbContacts = locationEdgeNode?.getValue('nbContacts');
      locationEdgeNode?.setValue(
        typeof nbContacts === 'number' ? nbContacts + 1 : 1,
        'nbContacts',
      );
      locationEdgeNode?.setLinkedRecords(
        [newContact, ...(locationEdgeNode?.getLinkedRecords('contacts') ?? [])],
        'contacts',
      );
    } else {
      const node = store.create(
        `${user.getDataID()}_${location}`,
        'ContactsByLocation',
      );
      node.setValue(location, 'location');
      node.setLinkedRecords([newContact], 'contacts');
      node.setValue(1, 'nbContacts');
      const newLocationEdge = ConnectionHandler.createEdge(
        store,
        userByLocationsConnection,
        node,
        'ContactsByLocationEdge',
      );
      if (location) {
        const nextEdge = userByLocationsConnection
          .getLinkedRecords('edges')
          ?.find(edge => {
            const node = edge?.getLinkedRecord('node');
            if (!node) {
              return false;
            }
            const locationName = node.getValue('location');
            if (typeof locationName !== 'string') {
              //Every valid location is before the null one
              return true;
            }
            return locationName > location;
          });
        ConnectionHandler.insertEdgeBefore(
          userByLocationsConnection,
          newLocationEdge,
          nextEdge?.getValue('cursor') as string | undefined,
        );
      } else {
        ConnectionHandler.insertEdgeAfter(
          userByLocationsConnection,
          newLocationEdge,
        );
      }
    }
  }
};

export const removeContactUpdater = (
  store: RecordSourceProxy,
  user: RecordProxy,
  contactID: string,
) => {
  const deleteContact = store.get(contactID);
  if (!deleteContact) {
    return;
  }
  // Update currentUser nbContacts
  const userNbContacts = user.getValue('nbContacts');
  if (typeof userNbContacts === 'number') {
    user.setValue(userNbContacts - 1, 'nbContacts');
  }
  // Update user by date connection
  const userByDatesConnection = getContactsByDateConnection(store, user);
  if (userByDatesConnection) {
    const meetingDate = deleteContact.getValue('meetingDate');
    if (meetingDate) {
      const date = new Date(meetingDate.toString());
      const dateEdge = userByDatesConnection
        .getLinkedRecords('edges')
        ?.find(edge => {
          const node = edge?.getLinkedRecord('node');
          if (!node) {
            return false;
          }
          const edgeDateStr = node.getValue('date');
          if (typeof edgeDateStr !== 'string') {
            return false;
          }
          const edgeDate = new Date(edgeDateStr);
          return (
            edgeDate.getUTCFullYear() === date.getUTCFullYear() &&
            edgeDate.getUTCMonth() === date.getUTCMonth() &&
            edgeDate.getUTCDate() === date.getUTCDate()
          );
        });
      if (dateEdge) {
        const dateEdgeNode = dateEdge.getLinkedRecord('node');
        const nbContacts = dateEdgeNode?.getValue('nbContacts');
        dateEdgeNode?.setValue(
          typeof nbContacts === 'number' ? nbContacts - 1 : 0,
          'nbContacts',
        );
        const dateEdgeContacts =
          dateEdgeNode
            ?.getLinkedRecords('contacts')
            ?.filter(contact => contact.getDataID() !== contactID) ?? [];

        if (dateEdgeNode && dateEdgeContacts.length === 0) {
          ConnectionHandler.deleteNode(
            userByDatesConnection,
            dateEdgeNode.getDataID(),
          );
        } else {
          dateEdgeNode?.setLinkedRecords(dateEdgeContacts, 'contacts');
        }
      }
    }
  }

  const userContactsConnection = getContactsByNameConnection(store, user);
  if (userContactsConnection) {
    ConnectionHandler.deleteNode(userContactsConnection, contactID);
  }
  // Update user by location connection
  const userByLocationsConnection = getContactsByLocationConnection(
    store,
    user,
  );
  if (userByLocationsConnection) {
    const meetingPlace = deleteContact.getLinkedRecord('meetingPlace');
    const location: string | null = meetingPlace
      ? (getFriendlyNameFromLocation({
          city: meetingPlace?.getValue('city') as string | null,
          region: meetingPlace?.getValue('region') as string | null,
          subregion: meetingPlace?.getValue('subregion') as string | null,
          country: meetingPlace?.getValue('country') as string | null,
        }) ?? null)
      : null;

    const locationEdge = userByLocationsConnection
      .getLinkedRecords('edges')
      ?.find(edge => {
        const node = edge?.getLinkedRecord('node');
        if (!node) {
          return false;
        }
        const locationName = node.getValue('location');
        return (locationName ?? null) === location;
      });

    if (locationEdge) {
      const locationEdgeNode = locationEdge.getLinkedRecord('node');
      const nbContacts = locationEdgeNode?.getValue('nbContacts');
      locationEdgeNode?.setValue(
        typeof nbContacts === 'number' ? nbContacts - 1 : 0,
        'nbContacts',
      );
      const locationEdgeContacts =
        locationEdgeNode
          ?.getLinkedRecords('contacts')
          ?.filter(contact => contact.getDataID() !== contactID) ?? [];

      if (locationEdgeNode && locationEdgeContacts.length === 0) {
        ConnectionHandler.deleteNode(
          userByLocationsConnection,
          locationEdgeNode.getDataID(),
        );
      } else {
        locationEdgeNode?.setLinkedRecords(locationEdgeContacts, 'contacts');
      }
    }
  }
};
