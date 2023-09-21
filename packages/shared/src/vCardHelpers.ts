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
      email.email,
      email.label === 'Main'
        ? 'type=PREF'
        : `type=${email.label.toLocaleUpperCase()}`,
    );
  });

  contactCard.phones.forEach(phone => {
    vcard.addPhoneNumber(
      phone.number,
      phone.label === 'Main'
        ? 'type=PREF'
        : phone.label === 'Mobile'
        ? 'type=CELL'
        : `type=${phone.label.toLocaleUpperCase()}`,
    );
  });
  contactCard.urls.forEach(url => {
    vcard.addURL(url.url, url.label);
  });

  contactCard.adresses.forEach(address => {
    vcard.addAddress(address.label, address.address);
  });

  vcard.addBirthday(contactCard.birthday);

  contactCard.socials.forEach(social => {
    vcard.addSocial(social, '');
  });

  return vcard;
};
