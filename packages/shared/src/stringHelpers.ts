import {
  isValidPhoneNumber,
  parsePhoneNumberWithError,
} from 'libphonenumber-js';
import isEmail from 'validator/lib/isEmail';
import isURL from 'validator/lib/isURL';
import type { CountryCode } from 'libphonenumber-js';

/**
 * Check is string is valid( not null, undefined, or '')
 *
 * @param {string} value
 * @returns {boolean}
 */
export const isNotFalsyString = (value: string | null | undefined) => {
  return !!value;
};

/**
 * Check is email is valid
 * @param {string} email - The email to validate.
 * @returns A boolean value
 */
export const isValidEmail: (email?: string) => boolean = email => {
  if (isNotFalsyString(email)) {
    return isEmail(email!);
  }
  return false;
};

// TODO improve regex
// At least one digit [0-9]
// At least one lowercase character [a-z]
// At least one uppercase character [A-Z]
// NOT USE : At least one special character [*.!@#$%^&(){}[]:;<>,.?/~_+-=|\]
// At least 8 characters in length, but no more than 32.
//export const REGEX_PWD = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[*.!@$%^&(){}[]:;<>,.?/~_+-=|\]).{8,32}$/

export const REGEX_PWD = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,32}$/;
/**
 * Check is password is correct (7-20 caracters, special....)
 *
 * @param {string} password
 * @returns {boolean}
 */
export const isValidPassword = (password: string) => {
  return REGEX_PWD.test(password);
};

/**
 * If the phone number is not a falsy string, then return whether or not the phone number is valid.
 * @param {string} phoneNumber - The phone number to validate.
 * @param {string} countryCode - The country code of the phone number.
 * @returns A boolean value
 */
export const isPhoneNumber = (
  phoneNumber: string,
  countryCode: CountryCode,
) => {
  if (isNotFalsyString(phoneNumber)) {
    return isValidPhoneNumber(phoneNumber, countryCode);
  }
  return false;
};

/**
 * If the phone number is not a falsy string, then return whether or not the phone number is a valid international phonenumber.
 * @param {string} phoneNumber - The phone number to validate.
 * @returns A boolean value
 */
export const isInternationalPhoneNumber = (phoneNumber?: string | null) => {
  if (isNotFalsyString(phoneNumber)) {
    return isValidPhoneNumber(phoneNumber!);
  }
  return false;
};

const REGEX_USERNAME = /^(?=.*[a-zA-Z])[a-zA-Z0-9_]{1,30}$/;
/**
 * Validate username using simple regex (does not start with specific charaters, does not container special characters and only one _ allowed at the end)
 * Also check to be URLEncoded indentical
 *
 * @param {string} username
 * @return {*}
 */
export const isValidUserName = (username: string) => {
  return REGEX_USERNAME.test(username) && encodeURI(username) === username;
};

const matcher = /^#?([0-9A-F]{3,8})$/i;

/**
 * It returns true if the value is a valid hexadecimal color code, and false otherwise
 * @param {string} value - string - The value to check
 * @param {boolean} [shortFormat] - boolean - Whether or not to allow format with 3 caracters
 * @returns A boolean value.
 */
export const isValidHex = (value: string, shortFormat?: boolean): boolean => {
  const match = matcher.exec(value);
  const length = match ? match[1].length : 0;

  return (
    (!!shortFormat && length === 3) || // '#rgb' format
    length === 6 // '#rrggbb' format
  );
};

/**
 *The function parse the phone number string and then formats the parsed phone number string to the E.164 format
 * The E.164 format is a standardized format for phone numbers that includes the country code, area code, and local subscriber number.
 *
 * @export
 * @param {string} phoneNumber
 * @return {*}
 */
export function formatPhoneNumber(phoneNumber: string) {
  try {
    const number = parsePhoneNumberWithError(phoneNumber);
    return number.format('E.164').replace(/\s/g, '');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return phoneNumber;
  }
}

/**
 *The function parse the phone number string and then formats the parsed phone number  as a uri (for call to action)
 *
 *
 * @export
 * @param {string} phoneNumber
 * @return {*}
 */
export function formatPhoneNumberUri(
  phoneNumber: string,
  countryCode?: CountryCode,
) {
  try {
    return parsePhoneNumberWithError(phoneNumber, countryCode).getURI();
  } catch {
    return `tel:${phoneNumber}`;
  }
}

/**
 * Simple function to format duration in minutes and seconds
 *
 * @param {number} duration
 * @return {*}
 */
export function formatDuration(duration: number) {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

/**
 *
 * Format the display name from first name and last name of a profile
 *
 * @export
 * @param {(string | null | undefined)} firstName
 * @param {(string | null | undefined)} lastName
 * @return {*}
 */
export function formatDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  companyName?: string | null | undefined,
) {
  if (isNotFalsyString(firstName) && isNotFalsyString(lastName)) {
    return `${firstName} ${lastName}`;
  }
  if (isNotFalsyString(firstName)) return firstName;
  if (isNotFalsyString(lastName)) return lastName;
  if (isNotFalsyString(companyName)) return companyName;

  return undefined;
}

/* eslint-disable no-bitwise*/
/**
 * This is a simple, *insecure* hash that's short, fast, and has no dependencies.
 */
export const simpleHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32bit integer
  }
  return new Uint32Array([hash])[0];
};
/* eslint-enable no-bitwise*/

export const isValidUrl = (url: string | null | undefined): boolean => {
  if (!url) {
    return false;
  }
  return isURL(url, {
    protocols: ['http', 'https'],
    require_valid_protocol: true,
    require_protocol: true,
  });
};

export const extractLetters = (text: string) => {
  return text.split(/(?=.)/);
};
