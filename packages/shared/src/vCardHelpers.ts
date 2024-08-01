import VCard from 'vcard-creator';
import { parseContactCard } from './contactCardHelpers';
import { buildUserUrl } from './urlHelpers';
import type { CommonInformation } from './contactCardHelpers';

/**
 * Generates a vCard from a serialized contact card
 * @param contactCardData The serialized contact card
 * @returns The vCard
 */
export const buildVCardFromSerializedContact = async (
  userName: string,
  contactCardData: string,
  additionalData?:
    | (Pick<CommonInformation, 'socials' | 'urls'> & {
        avatar?: { base64: string; type: string } | null;
      })
    | null,
) => {
  const contactCard = parseContactCard(contactCardData);

  const vcard = new VCard();

  vcard.addUID(contactCard.profileId);

  vcard.addName(contactCard.lastName ?? '', contactCard.firstName ?? '');

  vcard.addCompany(contactCard.company ?? '');

  vcard.addJobtitle(contactCard.title ?? '');

  if (additionalData?.avatar) {
    vcard.addPhoto(additionalData.avatar.base64, additionalData.avatar.type);
  }

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

  vcard.addURL(buildUserUrl(userName), 'type=azzapp WebCard');
  additionalData?.urls?.forEach(url => {
    vcard.addURL(url.address, '');
  });

  contactCard.addresses.forEach(address => {
    let type = undefined;
    if (address[0] === 'Home') type = 'HOME';
    if (address[0] === 'Work') type = 'WORK';
    if (address[0] === 'Main') type = 'PREF;Main';

    vcard.addAddress(
      address[0],
      address[1].replace(/;/g, '\\;'),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      type ?? address[0],
    );
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

export type ShareBackContact = {
  lastName?: string;
  firstName?: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
};

/**
 * Generates a vCard from a share back contact
 * @param shareBackContact The share back contact
 * @returns The vCard
 */
export const buildVCardFromShareBackContact = (
  shareBackContact: ShareBackContact,
) => {
  const vcard = new VCard();
  vcard.addName(
    shareBackContact.lastName ?? '',
    shareBackContact.firstName ?? '',
  );
  vcard.addCompany(shareBackContact.company ?? '');
  vcard.addJobtitle(shareBackContact.title ?? '');
  vcard.addEmail(shareBackContact.email ?? '', 'type=PREF');
  vcard.addPhoneNumber(shareBackContact.phone ?? '', 'type=CELL');

  return vcard;
};
