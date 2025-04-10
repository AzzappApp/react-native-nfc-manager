import { buildVCardFromAzzappContact } from '#helpers/contactHelpers';
import type { ContactType } from '#helpers/contactListHelpers';

describe('ShareContact', () => {
  test('buildVCardFromAzzappContact empty contact', async () => {
    const contact: ContactType = {
      addresses: [],
      avatar: null,
      logo: null,
      birthday: null,
      company: '',
      contactProfile: null,
      createdAt: new Date('2012-12-21'),
      emails: [],
      firstName: '',
      id: '',
      lastName: '',
      phoneNumbers: [],
      socials: null,
      title: '',
      urls: null,
      webCard: null,
      meetingPlace: null,
    };
    const vCard = await buildVCardFromAzzappContact(contact);
    expect(vCard).toMatchSnapshot();
  });
  test('buildVCardFromAzzappContact full featured contact', async () => {
    const contact: ContactType = {
      addresses: [
        { address: 'monaco', label: 'default' },
        { address: 'paris', label: 'work' },
      ],
      avatar: null,
      logo: null,
      birthday: '2012-12-21',
      company: 'azzapp',
      contactProfile: null,
      createdAt: new Date('2012-12-21'),
      emails: [
        { address: 'mail@azzap.com', label: 'home' },
        { address: 'mailWork@azzap.com', label: 'work' },
        { email: 'mailEMail@azzap.com', label: 'work' },
      ],
      firstName: 'azz',
      id: '',
      lastName: 'app',
      phoneNumbers: [
        { label: 'home', number: '1' },
        { label: 'work', number: '2' },
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
    const vCard = await buildVCardFromAzzappContact(contact);
    expect(vCard).toMatchSnapshot();
  });
  test('buildVCardFromAzzappContact birthday in date', async () => {
    const contact: ContactType = {
      addresses: [],
      avatar: null,
      logo: null,
      birthday: null,
      company: '',
      contactProfile: null,
      createdAt: new Date('2012-12-21'),
      emails: [],
      firstName: '',
      id: '',
      lastName: '',
      phoneNumbers: [],
      socials: null,
      title: '',
      urls: null,
      webCard: null,
      dates: [
        {
          label: 'birthday',
          year: 2012,
          month: 2,
          day: 12,
        },
      ],
      meetingPlace: null,
    } as ContactType;
    const vCard = await buildVCardFromAzzappContact(contact);
    expect(vCard).toMatchSnapshot();
  });
  test('buildVCardFromAzzappContact with avatar', async () => {
    const contact: ContactType = {
      addresses: [],
      avatar: { id: 'avatarId', uri: 'http://avatar.com' },
      logo: null,
      birthday: null,
      company: '',
      contactProfile: null,
      createdAt: new Date('2012-12-21'),
      emails: [],
      firstName: '',
      id: '',
      lastName: '',
      phoneNumbers: [],
      socials: null,
      title: '',
      urls: null,
      webCard: null,
      meetingPlace: null,
    };
    const vCard = await buildVCardFromAzzappContact(contact);
    expect(vCard).toMatchSnapshot();
  });
  test('buildVCardFromAzzappContact with logo', async () => {
    const contact: ContactType = {
      addresses: [],
      avatar: null,
      logo: { id: 'logoId', uri: 'http://logo.com' },
      birthday: null,
      company: '',
      contactProfile: null,
      createdAt: new Date('2012-12-21'),
      emails: [],
      firstName: '',
      id: '',
      lastName: '',
      phoneNumbers: [],
      socials: null,
      title: '',
      urls: null,
      webCard: null,
      meetingPlace: null,
    };
    const vCard = await buildVCardFromAzzappContact(contact);
    expect(vCard).toMatchSnapshot();
  });
  test('buildVCardFromAzzappContact with logo and avatar', async () => {
    const contact: ContactType = {
      addresses: [],
      avatar: { id: 'avatarId', uri: 'http://avatar.com' },
      logo: { id: 'logoId', uri: 'http://logo.com' },
      birthday: null,
      company: '',
      contactProfile: null,
      createdAt: new Date('2012-12-21'),
      emails: [],
      firstName: '',
      id: '',
      lastName: '',
      phoneNumbers: [],
      socials: null,
      title: '',
      urls: null,
      webCard: null,
      meetingPlace: null,
    };
    const vCard = await buildVCardFromAzzappContact(contact);
    expect(vCard).toMatchSnapshot();
  });
});
