/**
 * This file defines all types for contacts management
 * Types shall be as close as possible from graphql information
 */
import type { ContactDetailsBody_webCard$key } from '#relayArtifacts/ContactDetailsBody_webCard.graphql';
import type { CoverRenderer_webCard$key } from '#relayArtifacts/CoverRenderer_webCard.graphql';

export type ContactAddressLabelType = 'Home' | 'Main' | 'Other' | 'Work';

export type ContactAddressType = {
  address: string;
  label: ContactAddressLabelType;
};

export type ContactMediaType = {
  id?: string | null;
  uri?: string | null;
};

export type ContactEmailLabelType = 'Home' | 'Main' | 'Other' | 'Work';

export type ContactEmailType = {
  address: string;
  label: ContactEmailLabelType;
};

export type ContactPhoneNumberLabelType =
  | 'Fax'
  | 'Home'
  | 'Main'
  | 'Mobile'
  | 'Other'
  | 'Work';

export type ContactPhoneNumberType = {
  number: string;
  label: ContactPhoneNumberLabelType;
};

// TODO - add fixed label support for socials
export type ContactSocialType = {
  label: string;
  url: string;
};

export type ContactUrlType = {
  url: string;
};

export type ContactMeetingPlaceType = {
  city: string | null;
  country: string | null;
  region: string | null;
  subregion: string | null;
};

export type ContactType = {
  id?: string;
  addresses?: ContactAddressType[] | null;
  avatar?: ContactMediaType | null;
  birthday?: string | null;
  company?: string;
  emails?: ContactEmailType[] | null;
  firstName?: string | null;
  lastName?: string | null;
  logo?: ContactMediaType | null;
  meetingPlace?: ContactMeetingPlaceType | null;
  meetingDate: Date;
  phoneNumbers?: ContactPhoneNumberType[] | null;
  socials?: ContactSocialType[] | null;
  title?: string | null;
  urls?: ContactUrlType[] | null;

  // azzapp contact information
  webCard?: ContactDetailsBody_webCard$key | CoverRenderer_webCard$key | null;
  webCardId?: string | null;
  profileId?: string | null;
  webCardUserName?: string | null;
  webCardPreview?: ContactMediaType | null;
  note?: string | null;
};
