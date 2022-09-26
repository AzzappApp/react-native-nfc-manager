import {
  isValidEmail,
  isValidPassword,
  isNotFalsyString,
} from '../stringHelpers';

describe('stringHelper', () => {
  describe('isValidEmail', () => {
    test('should be a valid email', () => {
      expect(isValidEmail('salut@gmail.com')).toBe(true);
    });
    test('should not be a valid email', () => {
      expect(isValidEmail('salutma.ilcom')).toBe(false);
      expect(isValidEmail('salutgmailcom')).toBe(false);
      expect(isValidEmail('salut@@@@gmailcom')).toBe(false);
      expect(isValidEmail('salut@@@@gmailcom')).toBe(false);
    });
  });
  describe('isValidPassword', () => {
    test('should be a valid pwd', () => {
      expect(isValidPassword('Salut1111.')).toBe(true);
    });
    test('should not be a valid pwd', () => {
      expect(isValidPassword('passe')).toBe(false);
      expect(isValidPassword('.')).toBe(false);
      expect(isValidPassword('.AAAA')).toBe(false);
    });
  });
  describe('isValidString', () => {
    test('should be a valid string', () => {
      expect(isNotFalsyString('hello')).toBe(true);
    });
    test('should not be a valid string', () => {
      expect(isNotFalsyString(null)).toBe(false);
      expect(isNotFalsyString(undefined)).toBe(false);
      expect(isNotFalsyString('')).toBe(false);
    });
  });
});
