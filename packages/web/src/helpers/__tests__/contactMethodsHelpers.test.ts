import {
  getPreferredContactMethod,
  CONTACT_METHODS,
} from '../contactMethodsHelpers';

describe('getPreferredContactMethod', () => {
  test('should return EMAIL if the email is available and confirmed', () => {
    expect(
      getPreferredContactMethod({
        email: 'user@example.com',
        emailConfirmed: true,
        phoneNumber: '1234567890',
        phoneNumberConfirmed: false,
      }),
    ).toEqual({ method: CONTACT_METHODS.EMAIL, value: 'user@example.com' });
  });

  test('should return SMS if the email is not confirmed but the phone number is confirmed', () => {
    expect(
      getPreferredContactMethod({
        email: 'user@example.com',
        emailConfirmed: false,
        phoneNumber: '1234567890',
        phoneNumberConfirmed: true,
      }),
    ).toEqual({ method: CONTACT_METHODS.SMS, value: '1234567890' });
  });

  test('should return EMAIL if only the email is available and not confirmed', () => {
    expect(
      getPreferredContactMethod({
        email: 'user@example.com',
        emailConfirmed: false,
        phoneNumber: null,
        phoneNumberConfirmed: false,
      }),
    ).toEqual({ method: CONTACT_METHODS.EMAIL, value: 'user@example.com' });
  });

  test('should return SMS if only the phone number is available and confirmed', () => {
    expect(
      getPreferredContactMethod({
        email: null,
        emailConfirmed: false,
        phoneNumber: '1234567890',
        phoneNumberConfirmed: true,
      }),
    ).toEqual({ method: CONTACT_METHODS.SMS, value: '1234567890' });
  });

  test('should return EMAIL if both email and phone number are available but not confirmed', () => {
    expect(
      getPreferredContactMethod({
        email: 'user@example.com',
        emailConfirmed: false,
        phoneNumber: '1234567890',
        phoneNumberConfirmed: false,
      }),
    ).toEqual({ method: CONTACT_METHODS.EMAIL, value: 'user@example.com' });
  });

  test('should return undefined if neither email nor phone number is available', () => {
    expect(
      getPreferredContactMethod({
        email: null,
        emailConfirmed: false,
        phoneNumber: null,
        phoneNumberConfirmed: false,
      }),
    ).toEqual(undefined);
  });

  test('should return SMS if the email is not available and the phone number is available but not confirmed', () => {
    expect(
      getPreferredContactMethod({
        email: null,
        emailConfirmed: false,
        phoneNumber: '1234567890',
        phoneNumberConfirmed: false,
      }),
    ).toEqual({ method: CONTACT_METHODS.SMS, value: '1234567890' });
  });

  test('should return EMAIL if both email and phone number are available and confirmed', () => {
    expect(
      getPreferredContactMethod({
        email: 'user@example.com',
        emailConfirmed: true,
        phoneNumber: '1234567890',
        phoneNumberConfirmed: true,
      }),
    ).toEqual({ method: CONTACT_METHODS.EMAIL, value: 'user@example.com' });
  });
});
