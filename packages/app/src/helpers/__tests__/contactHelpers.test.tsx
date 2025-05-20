import { buildExpoContact, buildVCard } from '#helpers/contactHelpers';
import type { ContactType } from '#helpers/contactHelpers';

jest.mock('expo-file-system/next', () => {
  return {
    File: class MockExpoFile {
      uri: string;
      name: string;
      type: string;
      size: number;
      lastModified: number;
      constructor(uri: string) {
        this.uri = uri;
        this.name = 'mocked-file.jpg';
        this.type = 'image/jpeg';
        this.size = 1234;
        this.lastModified = Date.now();
      }
    },
    Paths: {
      DocumentDirectory: '/mocked/document/directory',
      CacheDirectory: '/mocked/cache/directory',
    },
  };
});

const contactMock: ContactType = {
  addresses: [],
  avatar: null,
  logo: null,
  birthday: null,
  company: '',
  meetingDate: new Date('2012-12-21'),
  emails: [],
  firstName: '',
  id: '',
  lastName: '',
  phoneNumbers: [],
  socials: null,
  title: '',
  urls: null,
  meetingPlace: null,
};

describe('contactHelpers', () => {
  test('buildVCard empty contact', async () => {
    const vCard = await buildVCard(contactMock);
    expect(vCard).toMatchSnapshot();
  });
  test('buildVCard contact with social', async () => {
    const contact: ContactType = {
      ...contactMock,
      socials: [
        {
          url: 'facebook.com/test',
          label: 'facebook',
        },
      ],
    };
    const vCard = await buildVCard(contact);
    expect(vCard).toMatchSnapshot();
    const facebook = vCard
      .getProperties()
      .find(({ key }) => key === 'X-SOCIALPROFILE;type=facebook');
    expect(facebook?.value).toEqual('https://facebook.com/test');
  });

  test('buildVCard empty contact', async () => {
    const contact: ContactType = {
      addresses: [],
      avatar: null,
      logo: null,
      birthday: null,
      company: '',
      meetingDate: new Date('2012-12-21'),
      emails: [],
      firstName: '',
      id: '',
      lastName: '',
      phoneNumbers: [],
      socials: null,
      title: '',
      urls: null,
      meetingPlace: null,
    };
    const vCard = await buildVCard(contact);
    expect(vCard).toMatchSnapshot();
  });

  test('buildVCard full featured contact', async () => {
    const contact: ContactType = {
      addresses: [
        { address: 'monaco', label: 'Default' },
        { address: 'paris', label: 'Work' },
      ],
      avatar: null,
      logo: null,
      birthday: '2012-12-21',
      company: 'azzapp',
      contactProfile: null,
      meetingDate: new Date('2012-12-21'),
      emails: [
        { address: 'mail@azzap.com', label: 'Home' },
        { address: 'mailWork@azzap.com', label: 'Work' },
        { address: 'mailEMail@azzap.com', label: 'Work' },
      ],
      firstName: 'azz',
      id: '',
      lastName: 'app',
      phoneNumbers: [
        { label: 'Home', number: '1' },
        { label: 'Work', number: '2' },
      ],
      socials: [
        { label: 'home', url: 'https://web.azzapp.com' },
        { label: 'work', url: 'https://facebook.com/azzapp' },
      ],
      title: 'dev',
      urls: [{ url: 'https://url.com' }, { url: 'https://url2.com' }],
      webCard: null,
      meetingPlace: null,
    } as ContactType;
    const vCard = await buildVCard(contact);
    expect(vCard).toMatchSnapshot();
  });

  test('buildVCard with avatar', async () => {
    const contact: ContactType = {
      addresses: [],
      avatar: { id: 'avatarId', uri: 'http://avatar.com' },
      logo: null,
      birthday: null,
      company: '',
      meetingDate: new Date('2012-12-21'),
      emails: [],
      firstName: '',
      id: '',
      lastName: '',
      phoneNumbers: [],
      socials: null,
      title: '',
      urls: null,
      meetingPlace: null,
    };
    const vCard = await buildVCard(contact);
    expect(vCard).toMatchSnapshot();
  });

  test('buildVCard with logo', async () => {
    const contact: ContactType = {
      addresses: [],
      avatar: null,
      logo: { id: 'logoId', uri: 'http://logo.com' },
      birthday: null,
      company: '',
      meetingDate: new Date('2012-12-21'),
      emails: [],
      firstName: '',
      id: '',
      lastName: '',
      phoneNumbers: [],
      socials: null,
      title: '',
      urls: null,
      meetingPlace: null,
    };
    const vCard = await buildVCard(contact);
    expect(vCard).toMatchSnapshot();
  });

  test('buildVCard with logo and avatar', async () => {
    const contact: ContactType = {
      addresses: [],
      avatar: { id: 'avatarId', uri: 'http://avatar.com' },
      logo: { id: 'logoId', uri: 'http://logo.com' },
      birthday: null,
      company: '',
      meetingDate: new Date('2012-12-21'),
      emails: [],
      firstName: '',
      id: '',
      lastName: '',
      phoneNumbers: [],
      socials: null,
      title: '',
      urls: null,
      meetingPlace: null,
    };
    const vCard = await buildVCard(contact);
    expect(vCard).toMatchSnapshot();
  });

  test('buildExpoContact generate correctly empty emails', async () => {
    const result = await buildExpoContact({
      emails: [],
      firstName: 'John',
      lastName: 'Doe',
      meetingDate: new Date('2012-12-21'),
    });
    expect(result.emails?.length).toBe(0);
  });

  test('buildExpoContact generate correctly emails', async () => {
    const result = await buildExpoContact({
      emails: [{ address: 'a@a.com', label: 'Work' }],
      firstName: 'John',
      lastName: 'Doe',
      meetingDate: new Date('2012-12-21'),
    });
    expect(result.emails?.length).toBe(1);
    expect(result.emails?.[0].email).toBe('a@a.com');
    expect(result.emails?.[0].label).toBe('Work');
  });

  test('buildExpoContact generate correct avatar uri', async () => {
    const result = await buildExpoContact({
      firstName: 'John',
      lastName: 'Doe',
      meetingDate: new Date('2012-12-21'),
      avatar: {
        uri: 'https://example.com/avatar.jpg',
      },
    });
    console.log('result', result);
    expect(result.imageAvailable).toBe(true);
    expect(result.image?.uri).toBe('https://example.com/avatar.jpg');
  });
});
