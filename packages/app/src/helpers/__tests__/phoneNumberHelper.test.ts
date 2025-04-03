import {
  parseContactCardPhoneNumber,
  parsePhoneNumber,
} from '#helpers/phoneNumbersHelper';

const contactCardNumberMock = {
  label: 'Home',
  number: '+33612345678',
  countryCode: 'FR',
  selected: true,
};

describe('phoneNumberHelper', () => {
  describe('parsePhoneNumber', () => {
    test('parsePhoneNumber should return parsed number', async () => {
      const phoneNumber = await parsePhoneNumber('+33612345678');
      expect(phoneNumber?.country).toEqual('FR');
      expect(phoneNumber?.countryCallingCode).toEqual('33');
      expect(phoneNumber?.nationalNumber).toEqual('612345678');
      expect(phoneNumber?.number).toEqual('+33612345678');
    });
    test('parsePhoneNumber should return null for bad number', async () => {
      const phoneNumber = await parsePhoneNumber('bad number');
      expect(phoneNumber).toBeFalsy();
    });
  });

  describe('parseContactCardPhoneNumber', () => {
    test('parseContactCardPhoneNumber should return parsed contact card phone number', async () => {
      const phoneNumber = await parseContactCardPhoneNumber(
        contactCardNumberMock,
      );
      expect(phoneNumber).toEqual({
        ...contactCardNumberMock,
        number: '612345678',
      });
    });
    test('parseContactCardPhoneNumber should return un parsed contact card phone number', async () => {
      const phoneNumber = await parseContactCardPhoneNumber({
        ...contactCardNumberMock,
        number: 'bad number',
      });
      expect(phoneNumber).toEqual({
        ...contactCardNumberMock,
        number: 'bad number',
      });
    });
  });
});
