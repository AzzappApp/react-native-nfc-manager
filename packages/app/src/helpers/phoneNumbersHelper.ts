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

export const parsePhoneNumber = (
  p: ContactCardPhoneNumber,
): ContactCardPhoneNumber => {
  try {
    const { number, country } = parsePhoneNumberWithError(p.number);
    return { ...p, number, countryCode: country };
  } catch (e) {
    Sentry.captureException(e);
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
    Sentry.captureException(e);
    return phoneNumber;
  }
};
