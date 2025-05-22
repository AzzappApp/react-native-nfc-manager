import VCard from 'vcard-creator';
import { buildWebUrl } from './urlHelpers';
import type { CommonInformation, ContactCard } from './contactCardHelpers';

/**
 * Helpers to help generate correct VCards
 * @param label label to parse
 * @returns label to display in the VCard
 */
export const addressLabelToVCardLabel = (label: string) => {
  if (label === 'Home') return 'type=HOME';
  if (label === 'Work') return 'type=WORK';
  return 'type=PREF';
};

export const phoneLabelToVCardLabel = (label: string) => {
  return label === 'Main'
    ? 'type=PREF'
    : label === 'Mobile'
      ? 'type=CELL'
      : `type=${label.toLocaleUpperCase()}`;
};

export const emailLabelToVCardLabel = (label: string) => {
  return label === 'Main' ? 'type=PREF' : `type=${label.toLocaleUpperCase()}`;
};

/**
 * Generates a vCard from a serialized contact card
 * @param contactCardData The serialized contact card
 * @returns The vCard
 */

export type VCardAdditionnalData =
  | (Pick<CommonInformation, 'socials' | 'urls'> & {
      avatar?: { base64: string; type: string } | null;
    })
  | null;

export const buildVCardFromContactCard = async (
  userName: string | null | undefined,
  profileId: string,
  contactCard: ContactCard,
  avatar?: { base64: string; type: string } | null,
) => {
  const vcard = new VCard();

  vcard.addUID(profileId);

  vcard.addName(contactCard.lastName ?? '', contactCard.firstName ?? '');

  vcard.addCompany(contactCard.company ?? '');

  vcard.addJobtitle(contactCard.title ?? '');

  if (avatar) {
    vcard.addPhoto(avatar.base64, avatar.type);
  }

  contactCard.emails?.forEach(email => {
    vcard.addEmail(email.address, emailLabelToVCardLabel(email.label));
  });

  contactCard.phoneNumbers?.forEach(phone => {
    vcard.addPhoneNumber(phone.number, phoneLabelToVCardLabel(phone.label));
  });

  if (userName) {
    vcard.addURL(buildWebUrl(userName), 'type=azzapp WebCard');
  }
  contactCard?.urls?.forEach(url => {
    vcard.addURL(url.address, '');
  });

  contactCard.addresses?.forEach(address => {
    const type = addressLabelToVCardLabel(address.label);

    vcard.addAddress(
      address.label,
      address.address.replace(/;/g, '\\;'),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      type ?? address.label,
    );
  });

  if (contactCard.birthday && !isNaN(Date.parse(contactCard.birthday.birthday)))
    vcard.addBirthday(contactCard.birthday.birthday.split('T')[0]);

  contactCard?.socials?.forEach(social => {
    vcard.addSocial(
      `https://${social.url.replace(/^https?:\/\//, '')}`,
      social.label,
    );
  });

  return {
    vCard: vcard,
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
