import VCard from 'vcard-creator';
import { parseContactCard } from './contactCardHelpers';
import { buildUserUrl } from './urlHelpers';
import type { ContactCard } from './contactCardHelpers';

/**
 * Generates a vCard from a serialized contact card
 * @param contactCardData The serialized contact card
 * @returns The vCard
 */
export const buildVCard = (
  userName: string,
  contactCardData: string,
  additionalData?: Pick<ContactCard, 'socials' | 'urls'> | null,
) => {
  const contactCard = parseContactCard(contactCardData);

  const vcard = new VCard();

  vcard.addUID(contactCard.profileId);

  vcard.addName(contactCard.lastName ?? '', contactCard.firstName ?? '');

  vcard.addCompany(contactCard.company ?? '');

  vcard.addJobtitle(contactCard.title ?? '');

  contactCard.emails.forEach(email => {
    vcard.addEmail(
      email[1],
      email[0] === 'Main'
        ? 'type=PREF'
        : `type=${email[0].toLocaleUpperCase()}`,
    );
  });

  contactCard.phoneNumbers.forEach(phone => {
    vcard.addPhoneNumber(
      phone[1],
      phone[0] === 'Main'
        ? 'type=PREF'
        : phone[0] === 'Mobile'
        ? 'type=CELL'
        : `type=${phone[0].toLocaleUpperCase()}`,
    );
  });

  vcard.addURL(buildUserUrl(userName), 'type=azzapp');
  additionalData?.urls?.forEach(url => {
    vcard.addURL(url.address, '');
  });

  contactCard.addresses.forEach(address => {
    vcard.addAddress(address[0], address[1].replace(/;/g, '\\;'));
  });

  if (contactCard.birthday && !isNaN(Date.parse(contactCard.birthday)))
    vcard.addBirthday(contactCard.birthday.split('T')[0]);

  additionalData?.socials?.forEach(social => {
    vcard.addSocial(
      `https://${social.url.replace(/^https?:\/\//, '')}`,
      social.label,
    );
  });

  return {
    vCard: vcard,
    contact: {
      profileId: contactCard.profileId,
      webCardId: contactCard.webCardId,
      lastName: contactCard.lastName,
      firstName: contactCard.firstName,
      company: contactCard.company,
    },
  };
};
