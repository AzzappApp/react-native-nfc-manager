import * as Sentry from '@sentry/react-native';
import { parsePhoneNumberWithError } from 'libphonenumber-js';

import * as z from 'zod';
import type { CountryCode } from 'libphonenumber-js';

export const phoneNumberSchema = z.object({
  label: z.string(),
  number: z.string(),
  countryCode: z.string().optional(),
  selected: z.boolean().nullable().optional(),
});

export type ContactCardPhoneNumber = z.infer<typeof phoneNumberSchema>;

export const isPhoneNumberValid = (
  phoneNumber: string,
  countryCode: CountryCode,
) => {
  try {
    const phone = parsePhoneNumberWithError(phoneNumber, {
      defaultCountry: countryCode,
    });
    return phone.isValid();
  } catch (e) {
    Sentry.captureException(`Phone number ${phoneNumber} is not valid: ${e}`);
    return false;
  }
};

export const parsePhoneNumber = (
  p: ContactCardPhoneNumber,
): ContactCardPhoneNumber => {
  try {
    const { nationalNumber, country } = parsePhoneNumberWithError(p.number);
    return { ...p, number: nationalNumber, countryCode: country };
  } catch (e) {
    Sentry.captureException(`Phone number ${p.number} is not valid: ${e}`);
    return p;
  }
};

export const getPhonenumberWithCountryCode = (
  phoneNumber: string,
  countryCode?: CountryCode,
): string => {
  try {
    const { number } = parsePhoneNumberWithError(phoneNumber, {
      defaultCountry: countryCode,
    });
    return number;
  } catch (e) {
    Sentry.captureException(
      `Phone number ${phoneNumber} with countryCode ${countryCode} is not valid: ${e}`,
    );
    return phoneNumber;
  }
};
