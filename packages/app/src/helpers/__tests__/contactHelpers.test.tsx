import { buildExpoContact, buildVCard } from '#helpers/contactHelpers';
import type { contactHelpersShareContactData_contact$data } from '#relayArtifacts/contactHelpersShareContactData_contact.graphql';
import type { useOnInviteContactDataQuery_contact$data } from '#relayArtifacts/useOnInviteContactDataQuery_contact.graphql';

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

const contactMock: contactHelpersShareContactData_contact$data = {
  addresses: [],
  avatar: null,
  logo: null,
  birthday: null,
  company: '',
  meetingDate: '2012-12-21',
  emails: [],
  firstName: '',
  id: '',
  lastName: '',
  phoneNumbers: [],
  socials: null,
  title: '',
  urls: null,
  enrichment: null,
  note: null,
  ' $fragmentType': 'contactHelpersShareContactData_contact',
};

describe('contactHelpers', () => {
  test('buildVCard empty contact', async () => {
    const vCard = await buildVCard(contactMock);
    expect(vCard).toMatchSnapshot();
  });
  test('buildVCard contact with social', async () => {
    const contact: contactHelpersShareContactData_contact$data = {
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
    const contact: contactHelpersShareContactData_contact$data = contactMock;
    const vCard = await buildVCard(contact);
    expect(vCard).toMatchSnapshot();
  });

  test('buildVCard full featured contact', async () => {
    const contact: contactHelpersShareContactData_contact$data = {
      ...contactMock,
      addresses: [
        { address: 'monaco', label: 'Default' },
        { address: 'paris', label: 'Work' },
      ],
      avatar: null,
      logo: null,
      birthday: '2012-12-21',
      company: 'azzapp',
      meetingDate: '2012-12-21',
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
    };
    const vCard = await buildVCard(contact);
    expect(vCard).toMatchSnapshot();
  });

  test('buildVCard full featured contact AND enriched data', async () => {
    const contact: contactHelpersShareContactData_contact$data = {
      ...contactMock,
      addresses: [
        { address: 'monaco', label: 'Default' },
        { address: 'paris', label: 'Work' },
      ],
      avatar: null,
      logo: null,
      birthday: '2012-12-21',
      company: 'azzapp',
      meetingDate: '2012-12-21',
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
      enrichment: {
        fields: {
          addresses: [
            { address: 'overloaded', label: 'Default' },
            { address: 'overloaded', label: 'Work' },
          ],
          avatar: null,
          birthday: '2012-12-21',
          company: 'overloaded',
          emails: [
            { address: 'overloaded@azzapp.com', label: 'Home' },
            { address: 'overloaded2&azzapp.com', label: 'Work' },
          ],
          logo: {
            id: 'logoId',
            uri: 'http://overloaded.com',
          },
          phoneNumbers: [
            { label: 'Home', number: '0001' },
            { label: 'Work', number: '0002' },
          ],
          socials: [
            { label: 'home', url: 'https://overloadedazzapp.com' },
            { label: 'work', url: 'https://overloadedfacebook.com/azzapp' },
          ],
          title: 'overloadedTitle',
          urls: [{ url: 'https://overloadedurl.com' }],
        },
      },
    };
    const vCard = await buildVCard(contact);
    expect(vCard).toMatchSnapshot();
  });

  test('buildVCard with avatar', async () => {
    const contact: contactHelpersShareContactData_contact$data = {
      ...contactMock,
      avatar: { id: 'avatarId', uri: 'http://avatar.com' },
    };
    const vCard = await buildVCard(contact);
    expect(vCard).toMatchSnapshot();
  });

  test('buildVCard with logo', async () => {
    const contact: contactHelpersShareContactData_contact$data = {
      ...contactMock,
      logo: { id: 'logoId', uri: 'http://logo.com' },
    };
    const vCard = await buildVCard(contact);
    expect(vCard).toMatchSnapshot();
  });

  test('buildVCard with logo and avatar', async () => {
    const contact: contactHelpersShareContactData_contact$data = {
      ...contactMock,
      avatar: { id: 'avatarId', uri: 'http://avatar.com' },
      logo: { id: 'logoId', uri: 'http://logo.com' },
    };
    const vCard = await buildVCard(contact);
    expect(vCard).toMatchSnapshot();
  });

  const defaultExpoContact: useOnInviteContactDataQuery_contact$data = {
    emails: [],
    firstName: 'John',
    lastName: 'Doe',
    addresses: [],
    avatar: null,
    birthday: null,
    company: '',
    contactProfile: null,
    enrichment: null,
    id: '',
    logo: null,
    meetingDate: null,
    note: null,
    phoneNumbers: [],
    socials: null,
    title: '',
    urls: null,
    ' $fragmentType': 'useOnInviteContactDataQuery_contact',
  };

  test('buildExpoContact generate correctly empty emails', async () => {
    const result = await buildExpoContact(defaultExpoContact);
    expect(result.emails?.length).toBe(0);
  });

  test('buildExpoContact generate correctly emails', async () => {
    const result = await buildExpoContact({
      ...defaultExpoContact,
      emails: [{ address: 'a@a.com', label: 'Work' }],
    });
    expect(result.emails?.length).toBe(1);
    expect(result.emails?.[0].email).toBe('a@a.com');
    expect(result.emails?.[0].label).toBe('Work');
  });

  test('buildExpoContact generate correct avatar uri', async () => {
    const result = await buildExpoContact({
      ...defaultExpoContact,
      avatar: {
        uri: 'https://example.com/avatar.jpg',
        id: '',
      },
    });
    expect(result.imageAvailable).toBe(true);
    expect(result.image?.uri).toBe('https://example.com/avatar.jpg');
  });
  test('buildExpoContact generate correct contact with enrichment', async () => {
    const result = await buildExpoContact({
      ...defaultExpoContact,
      firstName: 'John',
      lastName: 'Doe',
      avatar: {
        uri: 'https://example.com/avatar.jpg',
        id: '',
      },
      company: 'Company',
      enrichment: {
        fields: {
          avatar: {
            uri: 'https://example.com/enriched.jpg',
            id: '',
          },
          company: 'Enriched Company',
          addresses: null,
          birthday: null,
          emails: null,
          logo: null,
          phoneNumbers: null,
          socials: null,
          title: null,
          urls: null,
        },
      },
    });
    expect(result.imageAvailable).toBe(true);
    expect(result.image?.uri).toBe('https://example.com/enriched.jpg');
    expect(result.company).toBe('Enriched Company');
  });
});
