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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return false;
  }
};

export const parseContactCardPhoneNumber = (
  p: ContactCardPhoneNumber,
): ContactCardPhoneNumber => {
  try {
    const { nationalNumber, country } = parsePhoneNumberWithError(p.number);
    return { ...p, number: nationalNumber, countryCode: country };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return p;
  }
};

export const parsePhoneNumber = (
  phoneNumber: string,
  countryCode?: CountryCode,
) => {
  try {
    const number = parsePhoneNumberWithError(phoneNumber, countryCode);
    return number;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return null;
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
    console.warn(
      `Phone number ${phoneNumber} with countryCode "${countryCode}" is not valid: ${e}`,
    );
    return phoneNumber;
  }
};

export const extractPhoneNumberDetails = (
  phoneNumber: string,
): { number: string; countryCode?: string | undefined } => {
  try {
    const parsedNumber = parsePhoneNumberWithError(phoneNumber);
    if (parsedNumber) {
      return {
        countryCode: parsedNumber.country,
        number: parsedNumber.nationalNumber.replace(/\D/g, ''),
      };
    }
    return { number: phoneNumber.replace(/\D/g, '') };
  } catch {
    return { number: phoneNumber.replace(/\D/g, '') };
  }
};
