import * as Sentry from '@sentry/react-native';
import { File, Paths } from 'expo-file-system/next';
import { useMemo } from 'react';
import { useIntl } from 'react-intl';
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
import { getLocalCachedMediaFile } from './mediaHelpers/remoteMediaCache';
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
      const existingFile = getLocalCachedMediaFile(contactImageId, 'image');
      let file: File | undefined;
      if (existingFile) {
        file = new File(existingFile);
      }
      if (!file || !file.exists) {
        file = new File(existingFile ?? Paths.cache.uri + contactImageId);
        if (!file.exists) {
          await File.downloadFileAsync(contactImageUrl, file);
        }
      }
      const image = file.base64();
      if (image) {
        vCard.addPhoto(image, 'png'); // requested avatars format
      }
      console.log(vCard.toString());
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
