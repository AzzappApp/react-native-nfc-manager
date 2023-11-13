import VCard from 'vcard-creator';
import { parseContactCard } from './contactCardHelpers';

/**
 * Generates a vCard from a serialized contact card
 * @param contactCardData The serialized contact card
 * @returns The vCard
 */
export const buildVCard = (contactCardData: string) => {
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
  contactCard.urls.forEach(url => {
    vcard.addURL(url[1], url[0]);
  });

  contactCard.addresses.forEach(address => {
    vcard.addAddress(address[0], address[1].replace(/;/g, '\\;'));
  });

  if (contactCard.birthday) vcard.addBirthday(contactCard.birthday);

  contactCard.socials.forEach(social => {
    vcard.addSocial(social[1], social[0]);
  });

  return vcard;
};
