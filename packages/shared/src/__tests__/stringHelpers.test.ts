import {
  isValidEmail,
  isValidPassword,
  isNotFalsyString,
  isValidUserName,
  isValidHex,
  formatDuration,
  formatDisplayName,
  isValidUrl,
  formatPhoneNumberUri,
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
      expect(isValidUserName('123456789')).toBe(false);
    });
    test('should not contains special caracters', () => {
      expect(isValidUserName('aze&é')).toBe(false);
    });
    test('should be URI encoding compatible', () => {
      expect(isValidUserName('aze ]%')).toBe(false);
    });
    test('should be a valid username', () => {
      expect(isValidUserName('1aze')).toBe(true);
      expect(isValidUserName('se_test')).toBe(true);
      expect(isValidUserName('zer23sdf')).toBe(true);
      expect(isValidUserName('superTester23_______')).toBe(true);
    });
    test('should be a invalid username', () => {
      expect(isValidUserName('se._test')).toBe(false); //dot is not a valid caracters from https://github.com/AzzappApp/azzapp/issues/272
    });
  });
  describe('isValidHex', () => {
    test('should be a valid hex', () => {
      // valid strings
      expect(isValidHex('#8c0dba')).toBe(true);
      expect(isValidHex('aabbcc')).toBe(true);
      expect(isValidHex('#ABC', true)).toBe(true);
      expect(isValidHex('123', true)).toBe(true);
    });
    test('should not be a valid hex', () => {
      expect(isValidHex('#123', false)).toBe(false);
      // out of [0-F] range
      expect(isValidHex('#eeffhh')).toBe(false);
      // wrong length
      expect(isValidHex('#12')).toBe(false);
      expect(isValidHex('#12345')).toBe(false);
      // empty
      expect(isValidHex('')).toBe(false);
      expect(isValidHex('#12345', true)).toBe(false);
    });
  });
  describe('formatDuration', () => {
    test('should return formatted duration in minutes and seconds', () => {
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(300)).toBe('5:00');
    });

    test('should return formatted duration with leading zero for seconds less than 10', () => {
      expect(formatDuration(62)).toBe('1:02');
      expect(formatDuration(120)).toBe('2:00');
    });

    test('should return formatted duration with only seconds', () => {
      expect(formatDuration(45)).toBe('0:45');
      expect(formatDuration(5)).toBe('0:05');
    });
  });

  describe('formatDisplayName', () => {
    test('should return formatted name when both firstName and lastName have truthy string values', () => {
      expect(formatDisplayName('John', 'Doe')).toBe('John Doe');
    });

    test('should return firstName when it has a truthy string value and lastName is falsy', () => {
      expect(formatDisplayName('John', null)).toBe('John');
      expect(formatDisplayName('John', undefined)).toBe('John');
      expect(formatDisplayName('John', '')).toBe('John');
    });

    test('should return lastName when it has a truthy string value and firstName is falsy', () => {
      expect(formatDisplayName(null, 'Doe')).toBe('Doe');
      expect(formatDisplayName(undefined, 'Doe')).toBe('Doe');
      expect(formatDisplayName('', 'Doe')).toBe('Doe');
    });

    test('should return null when both firstName and lastName are falsy', () => {
      expect(formatDisplayName(null, null)).toBe(undefined);
      expect(formatDisplayName(undefined, undefined)).toBe(undefined);
      expect(formatDisplayName('', '')).toBe(undefined);
    });
  });
});

describe('isValidUrl', () => {
  // Returns true for a valid URL with http protocol
  test('should return true for a valid URL with http protocol', () => {
    const url = 'http://www.example.com';
    const result = isValidUrl(url);
    expect(result).toBe(true);
  });

  // Returns true for a valid URL with https protocol
  test('should return true for a valid URL with https protocol', () => {
    const url = 'https://www.example.com';
    const result = isValidUrl(url);
    expect(result).toBe(true);
  });

  // Returns true for a valid URL with www subdomain
  test('should return true for a valid URL with www subdomain', () => {
    const url = 'http://www.example.com';
    const result = isValidUrl(url);
    expect(result).toBe(true);
  });

  // Returns false for an empty string
  test('should return false for an empty string', () => {
    const url = '';
    const result = isValidUrl(url);
    expect(result).toBe(false);
  });

  // Returns false for a URL without a protocol
  test('should return false for a URL without a protocol', () => {
    const url = 'www.example.com';
    const result = isValidUrl(url);
    expect(result).toBe(false);
  });

  // Returns false for a URL with an invalid protocol
  test('should return false for a URL with an invalid protocol', () => {
    const url = 'ftp://www.example.com';
    const result = isValidUrl(url);
    expect(result).toBe(false);
  });
});

describe('formatPhoneNumberUri', () => {
  test('should return phone number uri from correct number', () => {
    const uri = formatPhoneNumberUri('0612345678');
    expect(uri).toBe('tel:0612345678');
  });
  test('should return phone number uri from bad number', () => {
    const uri = formatPhoneNumberUri('bad number');
    expect(uri).toBe('tel:bad number');
  });
  test('should return correct phone number uri with countryCode', () => {
    const uri = formatPhoneNumberUri('0612345678', 'FR');
    expect(uri).toBe('tel:+33612345678');
  });
});
