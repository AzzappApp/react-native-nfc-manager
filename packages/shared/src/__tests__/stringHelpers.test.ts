import {
  isValidEmail,
  isValidPassword,
  isNotFalsyString,
  isValidUsername,
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
  describe('isValidUsername', () => {
    test('should not contain only number', () => {
      expect(isValidUsername('123456789')).toBe(false);
    });
    test('should have at least 4 characters', () => {
      expect(isValidUsername('aze')).toBe(false);
    });
    test('should not contains special caracters', () => {
      expect(isValidUsername('aze&é')).toBe(false);
    });
    test('should be URI encoding compatible', () => {
      expect(isValidUsername('aze ]%')).toBe(false);
    });
    test('should be a valid username', () => {
      expect(isValidUsername('1aze')).toBe(true);
      expect(isValidUsername('se._test')).toBe(true);
      expect(isValidUsername('zer23sdf')).toBe(true);
      expect(isValidUsername('superTester23_______')).toBe(true);
    });
  });
});
