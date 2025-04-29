import { buildVCard } from '#helpers/contactHelpers';
import type { ContactType } from '#helpers/contactTypes';

describe('ShareContact', () => {
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
      webCard: null,
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
      webCard: null,
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
      webCard: null,
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
      webCard: null,
      meetingPlace: null,
    };
    const vCard = await buildVCard(contact);
    expect(vCard).toMatchSnapshot();
  });
});
