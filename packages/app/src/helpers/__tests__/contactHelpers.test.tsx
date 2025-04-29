import { buildVCard } from '#helpers/contactHelpers';
import type { ContactType } from '#helpers/contactTypes';

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
  webCard: null,
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
});
