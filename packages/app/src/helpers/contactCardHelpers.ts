import { getContactByIdAsync } from 'expo-contacts';
import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { SOCIAL_NETWORK_LINKS } from '@azzapp/shared/socialLinkHelpers';
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
      paddingHorizontal: 30,
      backgroundColor: appareance === 'light' ? 'white' : 'black',
    },
    fieldCommon: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      minHeight: MIN_FIELD_HEIGHT,
      paddingLeft: 18,
      backgroundColor: appareance === 'light' ? 'white' : 'black',
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 7,
      minHeight: MIN_FIELD_HEIGHT,
      paddingHorizontal: 20,
      backgroundColor: appareance === 'light' ? 'white' : 'black',
    },
    sectionsContainer: {
      rowGap: 1,
      paddingBottom: 20,
    },
    input: {
      flex: 1,
      padding: 0,
      maxHeight: MAX_FIELD_HEIGHT,
      height: undefined,
      backgroundColor: 'transparent',
      borderWidth: 0,
      paddingLeft: 16,
      paddingRight: 0,
      ...textStyles.medium,
    },
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
        value: 'label' in socialLink ? socialLink.label : socialLink.id,
      })),
    [],
  );

  return labelValues;
};

export const findLocalContact = async (
  storage: MMKV,
  phoneNumbers: string[],
  emails: string[],
  deviceIds: string[],
  localContacts: Contact[],
  profileId?: string,
): Promise<Contact | undefined> => {
  if (profileId && storage.contains(profileId)) {
    const internalId = storage.getString(profileId);
    if (internalId) {
      const contactByInternalId = getContactByIdAsync(internalId);
      if (contactByInternalId) {
        return contactByInternalId;
      }
    }
  }

  const contactsByDeviceId = await Promise.all(
    deviceIds.map(deviceId => getContactByIdAsync(deviceId)),
  );
  const foundContactByDeviceId = contactsByDeviceId.find(
    contactByDeviceId => !!contactByDeviceId,
  );
  if (foundContactByDeviceId) {
    return foundContactByDeviceId;
  }

  const localContact = localContacts.find(localContact => {
    const hasCommonPhoneNumber = localContact.phoneNumbers?.find(phoneNumber =>
      phoneNumbers.some(ph => ph === phoneNumber.number),
    );

    const hasCommonEmails = localContact.emails?.find(email =>
      emails.some(em => em === email.email),
    );

    return hasCommonPhoneNumber || hasCommonEmails;
  });

  return localContact;
};
