import VCard from 'vcard-creator';
import { parseContactCard } from './contactCardHelpers';
import { buildUserUrl } from './urlHelpers';
import type { CommonInformation } from './contactCardHelpers';

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

export const buildVCardFromSerializedContact = async (
  userName: string | null | undefined,
  contactCardData: string,
  additionalData?: VCardAdditionnalData,
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
    vcard.addEmail(email[1], emailLabelToVCardLabel(email[0]));
  });

  contactCard.phoneNumbers.forEach(phone => {
    vcard.addPhoneNumber(phone[1], phoneLabelToVCardLabel(phone[0]));
  });

  if (userName) {
    vcard.addURL(buildUserUrl(userName), 'type=azzapp WebCard');
  }
  additionalData?.urls?.forEach(url => {
    vcard.addURL(url.address, '');
  });

  contactCard.addresses.forEach(address => {
    const type = addressLabelToVCardLabel(address[0]);

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
      title: contactCard.title,
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
