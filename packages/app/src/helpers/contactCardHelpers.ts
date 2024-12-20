import { getContactByIdAsync } from 'expo-contacts';
import * as FileSystem from 'expo-file-system';
import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import VCard from 'vcard-creator';
import { SOCIAL_NETWORK_LINKS } from '@azzapp/shared/socialLinkHelpers';
import {
  addressLabelToVCardLabel,
  emailLabelToVCardLabel,
  phoneLabelToVCardLabel,
} from '@azzapp/shared/vCardHelpers';
import { textStyles } from '#theme';
import { createStyleSheet } from '#helpers/createStyles';
import type { Contact } from 'expo-contacts';
import type { ColorSchemeName } from 'react-native';
import type { MMKV } from 'react-native-mmkv';

export const DELETE_BUTTON_WIDTH = 70;
export const MAX_FIELD_HEIGHT = 85;
const MIN_FIELD_HEIGHT = 72;

export const buildContactCardModalStyleSheet = (appareance: ColorSchemeName) =>
  ({
    field: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: MIN_FIELD_HEIGHT,
      paddingHorizontal: 10,
      backgroundColor: appareance === 'light' ? 'white' : 'black',
    },
    fieldCommon: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      minHeight: MIN_FIELD_HEIGHT,
      paddingLeft: 10,
      backgroundColor: appareance === 'light' ? 'white' : 'black',
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 7,
      minHeight: MIN_FIELD_HEIGHT,
      paddingRight: 20,
      paddingLeft: 10,
      backgroundColor: appareance === 'light' ? 'white' : 'black',
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

export const contactCardEditModalStyleSheet = createStyleSheet(
  buildContactCardModalStyleSheet,
);

export const useContactCardAddressLabels = () => {
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

export const useContactCardEmailLabels = () => {
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
export const useContactCardPhoneLabels = () => {
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

export const useSocialLinkLabels = () => {
  const labelValues = useMemo(
    () =>
      SOCIAL_NETWORK_LINKS.map(socialLink => ({
        key: socialLink.id as string,
        value: socialLink.label,
      })),
    [],
  );

  return labelValues;
};

export const findLocalContact = async (
  storage: MMKV,
  phoneNumbers: string[],
  emails: string[],
  localContacts: Contact[],
  profileId?: string,
): Promise<Contact | undefined> => {
  if (profileId && storage.contains(profileId)) {
    const internalId = storage.getString(profileId);
    if (internalId) {
      const contactByInternalId = await getContactByIdAsync(internalId);

      if (contactByInternalId) {
        //temporary patch: we have remarked that contacts are mixed, I think it's due to internal id that are reused by the OS
        let hasCommonInfo = phoneNumbers?.find(phoneNumber =>
          contactByInternalId.phoneNumbers?.some(ph => {
            return ph.number === phoneNumber;
          }),
        );

        hasCommonInfo =
          hasCommonInfo ||
          emails?.find(email =>
            contactByInternalId.emails?.some(em => email === em.email),
          );
        if (hasCommonInfo) {
          return contactByInternalId;
        }
      }
    }
  }

  const localContact = localContacts?.find(localContact => {
    const hasCommonPhoneNumber = phoneNumbers?.find(phoneNumber =>
      localContact.phoneNumbers?.some(ph => {
        return ph.number === phoneNumber;
      }),
    );

    if (hasCommonPhoneNumber) return true;
    const hasCommonEmails = emails?.find(email =>
      localContact.emails?.some(em => email === em.email),
    );
    return hasCommonEmails;
  });

  return localContact;
};

export const buildVCardFromExpoContact = async (contact: Contact) => {
  const vCard = new VCard();
  vCard.addName(contact.lastName ?? undefined, contact.firstName ?? undefined);

  if (contact.jobTitle) {
    vCard.addJobtitle(contact.jobTitle);
  }
  if (contact.birthday && contact.birthday) {
    vCard.addBirthday(contact.birthday.toString());
  }
  if (contact.company) {
    vCard.addCompany(contact.company);
  }

  contact.phoneNumbers?.forEach(number => {
    vCard.addPhoneNumber(
      `${number.number}`,
      phoneLabelToVCardLabel(number.label) || '',
    );
  });
  contact.emails?.forEach(email => {
    if (email.email)
      vCard.addEmail(email.email, emailLabelToVCardLabel(email.label) || '');
  });
  contact.urlAddresses?.forEach(url => {
    if (url.url) vCard.addURL(url.url);
  });
  contact.socialProfiles?.forEach(social => {
    if (social.url) vCard.addSocial(social.url, social.label || '');
  });
  contact.addresses?.forEach(addr => {
    let fullAdress = addr.street || '';
    if (fullAdress.length) fullAdress += ' ';
    fullAdress += addr.postalCode || '';
    if (fullAdress.length) fullAdress += ' ';
    fullAdress += addr.city || '';
    if (fullAdress.length) fullAdress = fullAdress + ' ';
    fullAdress += addr.country || '';

    if (fullAdress.length)
      vCard.addAddress(fullAdress, addressLabelToVCardLabel(addr.label) || '');
  });
  if (contact?.image?.uri) {
    const image = await FileSystem.readAsStringAsync(contact?.image?.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    if (image) {
      vCard.addPhoto(image);
    }
  }
  return vCard;
};
