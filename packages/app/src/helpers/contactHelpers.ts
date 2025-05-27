import * as Sentry from '@sentry/react-native';
import { ContactTypes } from 'expo-contacts';
import { File, Paths } from 'expo-file-system/next';
import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Platform } from 'react-native';
import { Image as ImageCompressor } from 'react-native-compressor';
import ShareCommand from 'react-native-share';
import {
  ConnectionHandler,
  graphql,
  readInlineData,
  type RecordProxy,
  type RecordSourceProxy,
} from 'relay-runtime';
import VCard from 'vcard-creator';
import * as z from 'zod';
import { isDefined } from '@azzapp/shared/isDefined';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import {
  addressLabelToVCardLabel,
  emailLabelToVCardLabel,
  phoneLabelToVCardLabel,
} from '@azzapp/shared/vCardHelpers';
import { textStyles } from '#theme';
import { createStyleSheet } from '#helpers/createStyles';
import { phoneNumberSchema } from '#helpers/phoneNumbersHelper';
import { sanitizeFilePath } from './fileHelpers';
import { getLocalCachedMediaFile } from './mediaHelpers/remoteMediaCache';
import { getRelayEnvironment } from './relayEnvironment';
import type {
  contactHelpersShareContactData_contact$data,
  contactHelpersShareContactData_contact$key,
} from '#relayArtifacts/contactHelpersShareContactData_contact.graphql';
import type { useOnInviteContactDataQuery_contact$data } from '#relayArtifacts/useOnInviteContactDataQuery_contact.graphql';
import type { Contact as ExpoContact, Date as ExpoDate } from 'expo-contacts';
import type { ColorSchemeName } from 'react-native';

/**
 * This file defines all types for contacts management
 * Types shall be as close as possible from graphql information
 */
export type ContactAddressLabelType = 'Home' | 'Main' | 'Other' | 'Work';

export type ContactAddressType = {
  address: string;
  label: ContactAddressLabelType;
};

export type ContactMediaType = {
  id?: string | null;
  uri?: string | null;
};

export type ContactEmailLabelType = 'Home' | 'Main' | 'Other' | 'Work';

export type ContactEmailType = {
  address: string;
  label: ContactEmailLabelType;
};

export type ContactPhoneNumberLabelType =
  | 'Fax'
  | 'Home'
  | 'Main'
  | 'Mobile'
  | 'Other'
  | 'Work';

export type ContactPhoneNumberType = {
  number: string;
  label: ContactPhoneNumberLabelType;
};

// TODO - add fixed label support for socials
export type ContactSocialType = {
  label: string;
  url: string;
};

export type ContactUrlType = {
  url: string;
};

export type ContactMeetingPlaceType = {
  city: string | null;
  country: string | null;
  region: string | null;
  subregion: string | null;
};

export type ContactType = {
  id?: string;
  addresses?: ContactAddressType[] | null;
  avatar?: ContactMediaType | null;
  birthday?: string | null;
  company?: string;
  emails?: ContactEmailType[] | null;
  firstName?: string | null;
  lastName?: string | null;
  logo?: ContactMediaType | null;
  meetingPlace?: ContactMeetingPlaceType | null;
  meetingDate: Date;
  phoneNumbers?: ContactPhoneNumberType[] | null;
  socials?: ContactSocialType[] | null;
  title?: string | null;
  urls?: ContactUrlType[] | null;
  profileId?: string | null;
  note?: string | null;
};

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

export const buildVCard = async (
  contact: contactHelpersShareContactData_contact$data,
) => {
  const vCard = new VCard();
  vCard.addName(contact.lastName ?? undefined, contact.firstName ?? undefined);

  const title = contact.enrichment?.fields?.title || contact.title;
  if (title) {
    vCard.addJobtitle(title);
  }

  const birthday =
    contact.enrichment?.fields?.birthday?.toString() ||
    contact.birthday?.toString();
  if (birthday) {
    vCard.addBirthday(birthday);
  }
  const company = contact.enrichment?.fields?.company || contact.company;
  if (company) {
    vCard.addCompany(company);
  }

  const phoneNumbers = [
    ...contact.phoneNumbers,
    ...(contact.enrichment?.fields?.phoneNumbers ?? []),
  ];
  phoneNumbers.forEach(number => {
    if (number.number) {
      vCard.addPhoneNumber(
        `${number.number}`,
        phoneLabelToVCardLabel(number.label) || '',
      );
    }
  });
  const emails = [
    ...contact.emails,
    ...(contact.enrichment?.fields?.emails ?? []),
  ];
  emails?.forEach(email => {
    if (email.address)
      vCard.addEmail(email.address, emailLabelToVCardLabel(email.label) || '');
  });

  const urls = [
    ...(contact.urls ?? []),
    ...(contact.enrichment?.fields?.urls ?? []),
  ];
  urls?.forEach(url => {
    if (url.url) vCard.addURL(prefixWithHttp(url.url));
  });

  const socials = [
    ...(contact.socials ?? []),
    ...(contact.enrichment?.fields?.socials ?? []),
  ];
  socials?.forEach(social => {
    if (social.url)
      vCard.addSocial(prefixWithHttp(social.url), social.label || '');
  });

  const addresses = [
    ...(contact.addresses ?? []),
    ...(contact.enrichment?.fields?.addresses ?? []),
  ];
  addresses?.forEach(addr => {
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

  const contactImageUrl =
    contact.enrichment?.fields?.avatar?.uri ||
    contact.avatar?.uri ||
    contact.enrichment?.fields?.logo?.uri ||
    contact.logo?.uri;
  const contactImageId =
    contact.enrichment?.fields?.avatar?.id ||
    contact.avatar?.id ||
    contact.enrichment?.fields?.logo?.id ||
    contact.logo?.id;

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

export const shareContactFragment_contact = graphql`
  fragment contactHelpersShareContactData_contact on Contact
  @inline
  @argumentDefinitions(
    pixelRatio: { type: "Float!", provider: "CappedPixelRatio.relayprovider" }
  ) {
    id
    firstName
    lastName
    title
    company
    note
    phoneNumbers {
      number
      label
    }
    emails {
      label
      address
    }
    urls {
      url
    }
    addresses {
      label
      address
    }
    birthday
    meetingDate
    socials {
      url
      label
    }
    avatar {
      uri: uri(width: 112, pixelRatio: $pixelRatio, format: png)
      id
    }
    logo {
      uri: uri(width: 180, pixelRatio: $pixelRatio, format: png)
      id
    }
    enrichment {
      fields {
        title
        company
        phoneNumbers {
          label
          number
        }
        emails {
          address
          label
        }
        urls {
          url
        }
        addresses {
          address
          label
        }
        birthday
        socials {
          label
          url
        }
        avatar {
          uri: uri(width: 112, pixelRatio: $pixelRatio, format: png)
          id
        }
        logo {
          uri: uri(width: 180, pixelRatio: $pixelRatio, format: png)
          id
        }
      }
    }
  }
`;

export const useShareContact = () => {
  return async (
    contactData?: contactHelpersShareContactData_contact$key | null,
  ) => {
    if (!contactData) return;
    const contact = readInlineData(shareContactFragment_contact, contactData);
    const vCardData = await buildVCard(contact);

    if (!vCardData) {
      console.error('cannot generate VCard');
      return;
    }
    const contactName =
      `${contact?.firstName ?? ''} ${contact?.lastName ?? ''}`.trim();
    const filePath =
      Paths.cache.uri +
      sanitizeFilePath(contactName.length ? contactName : 'contact') +
      '.vcf';

    let file;
    try {
      file = new File(filePath);
      file.create();
      // generate file
      file.write(vCardData.toString());
      // share the file
      await ShareCommand.open({
        url: filePath,
        type: 'text/x-vcard',
        failOnCancel: false,
      });
      // clean up file afterward
      file.delete();
    } catch (e) {
      Sentry.captureException(e);
      console.error(e);
      file?.delete();
    }
  };
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

const getContactsConnections = (
  store: RecordSourceProxy,
  user: RecordProxy,
  connectionName: string,
  expectedType: string,
) => {
  const environment = getRelayEnvironment();
  const source = environment.getStore().getSource();
  const recordIds = source.getRecordIDs();
  const userContactsConnectionId = ConnectionHandler.getConnectionID(
    user.getDataID(),
    connectionName,
  );
  return recordIds
    .filter(recordId => recordId.startsWith(userContactsConnectionId))
    .map(recordId => store.get(recordId))
    .filter(isDefined)
    .filter(record => record.getType() === expectedType);
};

const getContactsByDateConnection = (
  store: RecordSourceProxy,
  user: RecordProxy,
) => {
  return getContactsConnections(
    store,
    user,
    'currentUser_contactsByDates',
    'ContactsByDateConnection',
  );
};

const getContactsByLocationConnection = (
  store: RecordSourceProxy,
  user: RecordProxy,
) => {
  return getContactsConnections(
    store,
    user,
    'currentUser_contactsByLocation',
    'ContactsByLocationConnection',
  );
};

const getContactsByNameConnection = (
  store: RecordSourceProxy,
  user: RecordProxy,
) => {
  return getContactsConnections(
    store,
    user,
    'currentUser_contacts',
    'ContactConnection',
  );
};

/**
 * Extracts the variables part from a Relay connection cache ID.
 * Supports strings, numbers, and booleans.
 * Example: (nbContactsByDate:10,search:"A,B",active:true)
 */
export const extractRelayConnectionVariables = (
  relayId: string,
): Record<string, any> => {
  // Extract the substring inside the last parentheses in the id
  const match = relayId.match(/\((.*)\)$/);
  if (!match) return {};

  const varsString = match[1];
  const variables: Record<string, any> = {};

  // Parse each key:value, taking care of quoted values with commas inside
  let i = 0;
  while (i < varsString.length) {
    // Parse key
    let key = '';
    while (i < varsString.length && varsString[i] !== ':') {
      key += varsString[i++];
    }
    i++; // skip ':'
    // Parse value
    let value = '';
    let inQuotes = false;
    while (i < varsString.length && (inQuotes || varsString[i] !== ',')) {
      if (varsString[i] === '"') {
        inQuotes = !inQuotes;
      }
      value += varsString[i++];
    }
    if (varsString[i] === ',') i++; // skip ','

    value = value.trim();

    // Parse value as string, number, or boolean
    let parsedValue: any;
    if (value.startsWith('"') && value.endsWith('"')) {
      parsedValue = value.slice(1, -1);
    } else if (/^\d+$/.test(value)) {
      parsedValue = Number(value);
    } else if (value === 'true') {
      parsedValue = true;
    } else if (value === 'false') {
      parsedValue = false;
    } else {
      parsedValue = value;
    }
    variables[key.trim()] = parsedValue;
  }

  return variables;
};

const contactMatchSearch = (contact: RecordProxy, search: string): boolean => {
  search = search.toLowerCase();
  const firstName = contact.getValue('firstName');
  const lastName = contact.getValue('lastName');
  const company = contact.getValue('company');
  const webCardUserName = contact
    .getLinkedRecord('webCard')
    ?.getValue('userName');
  return (
    (typeof firstName === 'string' &&
      firstName.toLowerCase().includes(search)) ||
    (typeof lastName === 'string' && lastName.toLowerCase().includes(search)) ||
    (typeof company === 'string' && company.toLowerCase().includes(search)) ||
    (typeof webCardUserName === 'string' &&
      webCardUserName.toLowerCase().includes(search))
  );
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

  const userByDatesConnections = getContactsByDateConnection(store, user);
  userByDatesConnections.forEach(userByDatesConnection => {
    const variables = extractRelayConnectionVariables(
      userByDatesConnection.getDataID(),
    );
    if (
      variables?.search &&
      !contactMatchSearch(newContact, variables.search)
    ) {
      return;
    }
    const meetingDate = newContact.getValue('meetingDate');
    if (!meetingDate) {
      return;
    }
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
      const createEdge = () => {
        const node = store.create(
          `${userByDatesConnection.getDataID()}_${user.getDataID()}_${date.toISOString()}`,
          'ContactsByDate',
        );
        node.setValue(date.toISOString(), 'date');
        node.setLinkedRecords([newContact], 'contacts');
        node.setValue(1, 'nbContacts');
        return ConnectionHandler.createEdge(
          store,
          userByDatesConnection,
          node,
          'ContactsByDateEdge',
        );
      };
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
      if (nextEdge) {
        ConnectionHandler.insertEdgeBefore(
          userByDatesConnection,
          createEdge(),
          nextEdge.getValue('cursor') as string,
        );
      } else {
        const pageInfo = userByDatesConnection.getLinkedRecord('pageInfo');
        if (!pageInfo?.getValue('hasNextPage')) {
          ConnectionHandler.insertEdgeAfter(
            userByDatesConnection,
            createEdge(),
          );
        }
      }
    }
  });

  // Update user by name connection
  const userContactsConnections = getContactsByNameConnection(store, user);
  userContactsConnections.forEach(userContactsConnection => {
    const variables = extractRelayConnectionVariables(
      userContactsConnection.getDataID(),
    );
    if (
      variables?.search &&
      !contactMatchSearch(newContact, variables.search)
    ) {
      return;
    }
    if (variables?.date) {
      const date = new Date(variables.date);
      const meetingDate = newContact.getValue('meetingDate');
      if (meetingDate) {
        const meetingDateObj = new Date(meetingDate.toString());
        if (
          date.getUTCFullYear() !== meetingDateObj.getUTCFullYear() ||
          date.getUTCMonth() !== meetingDateObj.getUTCMonth() ||
          date.getUTCDate() !== meetingDateObj.getUTCDate()
        ) {
          return;
        }
      }
    }
    if (variables?.location) {
      const meetingPlace = newContact.getLinkedRecord('meetingPlace');
      const location = getFriendlyNameFromLocation({
        city: meetingPlace?.getValue('city') as string | null,
        region: meetingPlace?.getValue('region') as string | null,
        subregion: meetingPlace?.getValue('subregion') as string | null,
        country: meetingPlace?.getValue('country') as string | null,
      });
      if (location !== variables.location) {
        return;
      }
    }
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
        contact
          .getLinkedRecord('profile')
          ?.getLinkedRecord('webCard')
          ?.getValue('userName'),
      ]
        .filter(val => !!val)
        .map(val => val!.toString().toLowerCase())
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

    if (prevRecordEdge) {
      ConnectionHandler.insertEdgeBefore(
        userContactsConnection,
        edge,
        prevRecordEdge?.getValue('cursor') as string | undefined,
      );
    } else if (
      !userContactsConnection
        .getLinkedRecord('pageInfo')
        ?.getValue('hasNextPage')
    ) {
      ConnectionHandler.insertEdgeAfter(userContactsConnection, edge);
    }
  });

  // Update user by location connection
  const userByLocationsConnections = getContactsByLocationConnection(
    store,
    user,
  );
  userByLocationsConnections.forEach(userByLocationsConnection => {
    const variables = extractRelayConnectionVariables(
      userByLocationsConnection.getDataID(),
    );
    if (
      variables?.search &&
      !contactMatchSearch(newContact, variables.search)
    ) {
      return;
    }
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
      const createEdge = () => {
        const node = store.create(
          `${userByLocationsConnection.getDataID()}_${user.getDataID()}_${location}`,
          'ContactsByLocation',
        );
        node.setValue(location, 'location');
        node.setLinkedRecords([newContact], 'contacts');
        node.setValue(1, 'nbContacts');
        return ConnectionHandler.createEdge(
          store,
          userByLocationsConnection,
          node,
          'ContactsByLocationEdge',
        );
      };
      const pageInfo = userByLocationsConnection.getLinkedRecord('pageInfo');
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
        if (nextEdge || !pageInfo?.getValue('hasNextPage')) {
          ConnectionHandler.insertEdgeBefore(
            userByLocationsConnection,
            createEdge(),
            nextEdge?.getValue('cursor') as string | undefined,
          );
        }
      } else if (!pageInfo?.getValue('hasNextPage')) {
        ConnectionHandler.insertEdgeAfter(
          userByLocationsConnection,
          createEdge(),
        );
      }
    }
  });
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
  const userByDatesConnections = getContactsByDateConnection(store, user);
  userByDatesConnections.forEach(userByDatesConnection => {
    const dateEdge = userByDatesConnection
      .getLinkedRecords('edges')
      ?.find(edge =>
        edge
          ?.getLinkedRecord('node')
          ?.getLinkedRecords('contacts')
          ?.some(contact => contact.getDataID() === contactID),
      );
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
  });

  const userContactsConnections = getContactsByNameConnection(store, user);
  userContactsConnections.forEach(userContactsConnection => {
    ConnectionHandler.deleteNode(userContactsConnection, contactID);
  });
  // Update user by location connection
  const userByLocationsConnections = getContactsByLocationConnection(
    store,
    user,
  );
  userByLocationsConnections.forEach(userByLocationsConnection => {
    const locationEdge = userByLocationsConnection
      .getLinkedRecords('edges')
      ?.find(edge =>
        edge
          ?.getLinkedRecord('node')
          ?.getLinkedRecords('contacts')
          ?.some(contact => contact.getDataID() === contactID),
      );

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
  });
};

export function prefixWithHttp(link: string): string;
export function prefixWithHttp(link: undefined): undefined;
export function prefixWithHttp(link: string | undefined): string | undefined;
export function prefixWithHttp(link?: string): string | undefined {
  if (!link || link.startsWith('http://') || link.startsWith('https://')) {
    return link;
  }
  return `https://${link}`;
}

export const buildExpoContact = async (
  contact: useOnInviteContactDataQuery_contact$data,
): Promise<ExpoContact> => {
  let birthday: ExpoDate | undefined = undefined;
  const birth = contact?.enrichment?.fields?.birthday || contact?.birthday;
  if (birth) {
    const contactBirthday = new Date(birth);
    birthday = {
      label: 'birthday',
      year: contactBirthday.getFullYear(),
      month: contactBirthday.getMonth(),
      day: contactBirthday.getDate(),
    };
  }

  let avatar: File | undefined;
  try {
    const webCardPreview =
      contact.contactProfile?.webCard?.cardIsPublished &&
      contact?.contactProfile?.webCard?.coverMedia?.webCardPreview
        ? {
            id: contact?.contactProfile?.webCard?.coverMedia?.id,
            uri: contact?.contactProfile?.webCard?.coverMedia?.webCardPreview,
          }
        : undefined;
    const contactAvatar =
      contact?.enrichment?.fields?.avatar ||
      contact?.avatar ||
      contact?.enrichment?.fields?.logo ||
      contact?.logo ||
      webCardPreview;
    if (contactAvatar && contactAvatar.id) {
      const existingFile = getLocalCachedMediaFile(contactAvatar.id, 'image');
      if (existingFile) {
        avatar = new File(existingFile);
      }

      if ((!avatar || !avatar.exists) && contactAvatar.uri) {
        avatar = new File(Paths.cache.uri + contactAvatar.id);
        if (!avatar.exists) {
          await File.downloadFileAsync(contactAvatar.uri, avatar);
        }
      }
    } else if (contactAvatar?.uri) {
      // already in cache
      avatar = new File(contactAvatar.uri);
    }
  } catch (e) {
    Sentry.captureException(e);
    console.error('download avatar failure', e);
  }
  const image = avatar?.uri ? { uri: avatar.uri } : undefined;
  const addresses = [
    ...(contact.addresses ?? []),
    ...(contact?.enrichment?.fields?.addresses ?? []),
  ].map(({ address, label }) => ({
    street: address,
    label,
  }));

  const emails = [
    ...(contact.emails ?? []),
    ...(contact?.enrichment?.fields?.emails ?? []),
  ].map(({ address, label }) => ({
    email: address,
    label,
  }));
  const phoneNumbers = [
    ...(contact.phoneNumbers ?? []),
    ...(contact?.enrichment?.fields?.phoneNumbers ?? []),
  ].map(({ number, label }) => ({
    number,
    label: Platform.OS === 'android' && label === 'Fax' ? 'otherFax' : label,
  }));
  const urlAddresses = [
    ...(contact.urls ?? []),
    ...(contact?.enrichment?.fields?.urls ?? []),
  ].map(({ url }) => ({
    label: 'default',
    url: prefixWithHttp(url),
  }));
  const socialProfiles = [
    ...(contact.socials ?? []),
    ...(contact?.enrichment?.fields?.socials ?? []),
  ].map(({ url, label }) => ({
    label,
    url: prefixWithHttp(url),
  }));

  return {
    contactType: ContactTypes.Person,
    firstName: contact.firstName || undefined,
    lastName: contact.lastName || undefined,
    company:
      contact.enrichment?.fields?.company || contact.company || undefined,
    jobTitle: contact.enrichment?.fields?.title || contact.title || undefined,
    name: formatDisplayName(contact.firstName, contact.lastName) || '',
    birthday,
    addresses,
    emails,
    image,
    imageAvailable: !!image,
    urlAddresses,
    socialProfiles,
    phoneNumbers,
    note: contact.note || undefined,
  };
};

export const stringToContactAddressLabelType = (
  str: string,
): ContactAddressLabelType => {
  switch (str.toLowerCase()) {
    case 'home':
      return 'Home';
    case 'main':
      return 'Main';
    case 'work':
      return 'Work';
    default:
      return 'Other'; // Fallback to 'Other'
  }
};

export const stringToContactEmailLabelType = (
  str: string,
): ContactEmailLabelType => {
  switch (str.toLowerCase()) {
    case 'home':
      return 'Home';
    case 'main':
      return 'Main';
    case 'work':
      return 'Work';
    default:
      return 'Other'; // Fallback to 'Other'
  }
};

export const stringToContactPhoneNumberLabelType = (
  str: string,
): ContactPhoneNumberLabelType => {
  switch (str.toLowerCase()) {
    case 'home':
      return 'Home';
    case 'main':
      return 'Main';
    case 'work':
      return 'Work';
    case 'fax':
      return 'Fax';
    case 'mobile':
      return 'Mobile';
    default:
      return 'Other'; // Fallback to 'Other'
  }
};
