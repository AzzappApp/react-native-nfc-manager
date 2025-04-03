import { parse } from '@lepirlouit/vcard-parser';
import VCard from 'vcard-creator';
import {
  getVCardAddresses,
  getVCardBirthday,
  getVCardCompany,
  getVCardEmail,
  getVCardFirstName,
  getVCardImage,
  getVCardLastName,
  getVCardPhoneNumber,
  getVCardSocialUrls,
  getVCardTitle,
  getVCardUrls,
} from '../textToVCard';

describe('textToVCard', () => {
  describe('company support', () => {
    test('no default', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardCompany(parsedVCard)).toBe(undefined);
    });
    test('valid value', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addCompany('azzapp');
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardCompany(parsedVCard)).toBe('azzapp');
    });
  });

  describe('birthday support', () => {
    test('no default', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardBirthday(parsedVCard)).toBe(undefined);
    });
    test('valid value', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addBirthday('11-12-1982');
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardBirthday(parsedVCard)).toBe('11-12-1982');
    });
  });

  describe('title support', () => {
    test('no default', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardTitle(parsedVCard)).toBe(undefined);
    });
    test('valid value', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addJobtitle('BigBoss');
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardTitle(parsedVCard)).toBe('BigBoss');
    });
  });
  describe('email support', () => {
    test('empty list', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardEmail(parsedVCard)).toBe(undefined);
    });

    test('default label is Work', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addEmail('test@test.com');
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardEmail(parsedVCard)[0].label).toBe('Work');
      expect(getVCardEmail(parsedVCard)[0].email).toBe('test@test.com');
    });
    test('label Home', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addEmail('test@test.com', 'HOME');
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardEmail(parsedVCard)[0].label).toBe('Home');
      expect(getVCardEmail(parsedVCard)[0].email).toBe('test@test.com');
    });
    test('label PREF', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addEmail('test@test.com', 'PREF');
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardEmail(parsedVCard)[0].label).toBe('Work');
      expect(getVCardEmail(parsedVCard)[0].email).toBe('test@test.com');
    });
    test('label PREF & HOME', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addEmail('test@test.com', 'PREF;HOME');
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardEmail(parsedVCard)[0].label).toBe('Home');
      expect(getVCardEmail(parsedVCard)[0].email).toBe('test@test.com');
    });
    test('2 emails', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addEmail('test@test.com', 'PREF;HOME');
      vCard.addEmail('blabla@test.com', 'WORK');
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardEmail(parsedVCard)[0].label).toBe('Home');
      expect(getVCardEmail(parsedVCard)[0].email).toBe('test@test.com');
      // ensure accessor works well
      expect(getVCardEmail(parsedVCard)[1].label).toBe('Work');
      expect(getVCardEmail(parsedVCard)[1].email).toBe('blabla@test.com');
    });
  });
  describe('Phone number support', () => {
    test('empty list', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardPhoneNumber(parsedVCard)).toBe(undefined);
    });

    test('default label is Work', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addPhoneNumber('666');
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardPhoneNumber(parsedVCard)[0].label).toBe('Work');
      expect(getVCardPhoneNumber(parsedVCard)[0].phone).toBe('666');
    });
    test('label Home', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addPhoneNumber('666', 'HOME');
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardPhoneNumber(parsedVCard)[0].label).toBe('Home');
      expect(getVCardPhoneNumber(parsedVCard)[0].phone).toBe('666');
    });
    test('label PREF', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addPhoneNumber('666', 'PREF');
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardPhoneNumber(parsedVCard)[0].label).toBe('Work');
      expect(getVCardPhoneNumber(parsedVCard)[0].phone).toBe('666');
    });
    test('label PREF & HOME', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addPhoneNumber('666', 'PREF;HOME');
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardPhoneNumber(parsedVCard)[0].label).toBe('Home');
      expect(getVCardPhoneNumber(parsedVCard)[0].phone).toBe('666');
    });
    test('2 phone number', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addPhoneNumber('666', 'PREF;HOME');
      vCard.addPhoneNumber('777', 'WORK');
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardPhoneNumber(parsedVCard)[0].label).toBe('Home');
      expect(getVCardPhoneNumber(parsedVCard)[0].phone).toBe('666');
      // ensure accessor works well
      expect(getVCardPhoneNumber(parsedVCard)[1].label).toBe('Work');
      expect(getVCardPhoneNumber(parsedVCard)[1].phone).toBe('777');
    });
  });
  describe('address support', () => {
    test('empty list', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardAddresses(parsedVCard)).toBe(undefined);
    });

    test('default label is Work', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addAddress(
        'home',
        'bis',
        'street',
        'city',
        'region',
        'zip',
        'country',
      );
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardAddresses(parsedVCard)[0].label).toBe('Work');
      expect(getVCardAddresses(parsedVCard)[0].adr).toBe(
        'home bis street city region zip country',
      );
    });
    test('label is Home', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addAddress(
        'home',
        'bis',
        'street',
        'city',
        'region',
        'zip',
        'country',
        'HOME',
      );
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardAddresses(parsedVCard)[0].label).toBe('Home');
      expect(getVCardAddresses(parsedVCard)[0].adr).toBe(
        'home bis street city region zip country',
      );
    });
    test('2 addresses', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addAddress(
        'home',
        'bis',
        'street',
        'city',
        'region',
        'zip',
        'country',
        'HOME',
      );
      vCard.addAddress(
        'home is my address',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'WORK',
      );

      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardAddresses(parsedVCard)[0].label).toBe('Home');
      expect(getVCardAddresses(parsedVCard)[0].adr).toBe(
        'home bis street city region zip country',
      );

      expect(getVCardAddresses(parsedVCard)[1].label).toBe('Work');
      expect(getVCardAddresses(parsedVCard)[1].adr).toBe('home is my address');
    });
  });

  describe('Social support', () => {
    test('empty list', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardSocialUrls(parsedVCard)).toBe(undefined);
    });
    test('default simple', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addSocial('facebook.com/test', 'facebook');
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardSocialUrls(parsedVCard)?.[0]?.label).toBe('facebook');
      expect(getVCardSocialUrls(parsedVCard)?.[0]?.url).toBe(
        'facebook.com/test',
      );
    });
    test('default simple with 2 accounts', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addSocial('facebook.com/test', 'facebook');
      vCard.addSocial('x.com/test', 'twitter');
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardSocialUrls(parsedVCard)?.[0].label).toBe('facebook');
      expect(getVCardSocialUrls(parsedVCard)?.[0].url).toBe(
        'facebook.com/test',
      );
      expect(getVCardSocialUrls(parsedVCard)?.[1].label).toBe('twitter');
      expect(getVCardSocialUrls(parsedVCard)?.[1].url).toBe('x.com/test');
    });
    test('default unsupported', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addSocial('pornhub.com/test', 'pornhub');
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardSocialUrls(parsedVCard)).toBe(undefined);
    });
  });

  describe('Url support', () => {
    test('empty list', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardUrls(parsedVCard)).toBe(undefined);
    });
    test('default simple', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addURL('facebook.com/test');
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardUrls(parsedVCard)?.[0]).toBe('facebook.com/test');
    });
    test('default simple with 2 accounts', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addURL('azzapp.com');
      vCard.addURL('azzapp.com/purchase');
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardUrls(parsedVCard)?.[0]).toBe('azzapp.com');
      expect(getVCardUrls(parsedVCard)?.[1]).toBe('azzapp.com/purchase');
    });
    test('unsupported url in socials shall be in url', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addURL('azzapp.com');
      vCard.addURL('azzapp.com/purchase');
      vCard.addSocial('linuxfr.org', 'linuxfr');
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardUrls(parsedVCard)?.[0]).toBe('azzapp.com');
      expect(getVCardUrls(parsedVCard)?.[1]).toBe('azzapp.com/purchase');
      expect(getVCardUrls(parsedVCard)?.[2]).toBe('linuxfr.org');
      expect(getVCardSocialUrls(parsedVCard)).toBe(undefined);
    });
  });

  describe('name / lastname support', () => {
    test('no default', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardFirstName(parsedVCard)).toBe(undefined);
      expect(getVCardLastName(parsedVCard)).toBe(undefined);
    });
    test('valid value', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      vCard.addName('firstname', 'lastname');
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardFirstName(parsedVCard)).toBe('firstname');
      expect(getVCardLastName(parsedVCard)).toBe('lastname');
    });
  });
  describe('image support', () => {
    test('no default', () => {
      // create vCard like an offline vcard
      const vCard = new VCard();
      // reparse it
      const parsedVCard = parse(vCard.getOutput());

      // ensure accessor works well
      expect(getVCardImage(parsedVCard)).toBe(undefined);
    });
  });
});
