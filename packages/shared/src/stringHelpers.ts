import { isValidPhoneNumber } from 'libphonenumber-js';
import isEmail from 'validator/es/lib/isEmail';
import type { CountryCode } from 'libphonenumber-js';
export const isValidEmail: (email?: string) => boolean = email => {
  if (isNotFalsyString(email)) {
    return isEmail(email!);
  }
  return false;
};
/**
 * Check is string is valid( not null, undefined, or '')
 *
 * @param {string} value
 * @returns {boolean}
 */
export const isNotFalsyString = (value: string | null | undefined) => {
  if (value === null) {
    return false;
  }
  if (value === undefined) {
    return false;
  }
  if (value === '') {
    return false;
  }
  return true;
};

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
 * If the phone number is not a falsy string, then return whether or not the phone number is valid.
 * @param {string} phoneNumber - The phone number to validate.
 * @param {string} countryCode - The country code of the phone number.
 * @returns A boolean value
 */
export const isInternationalPhoneNumber = (phoneNumber?: string | null) => {
  if (isNotFalsyString(phoneNumber)) {
    return isValidPhoneNumber(phoneNumber!);
  }
  return false;
};
export const REGEX_USERNAME = /^(?=.*[a-zA-Z])[a-zA-Z0-9_.]{4,30}$/;
export const REGEX_CHAR_USERNAME = /^[a-zA-Z0-9_.]$/;
/**
 * Validate username using simple regex (does not start with specific charaters, does not container special characters and only one _ allowed at the end)
 * Also check to be URLEncoded indentical
 *
 * @param {string} username
 * @return {*}
 */
export const isValidUsername = (username: string) => {
  return REGEX_USERNAME.test(username) && encodeURI(username) === username;
};
