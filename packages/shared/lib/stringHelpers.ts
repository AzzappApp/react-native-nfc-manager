import isEmail from 'validator/es/lib/isEmail';

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
