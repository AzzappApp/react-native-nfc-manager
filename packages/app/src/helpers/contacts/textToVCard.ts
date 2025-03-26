import { writeAsStringAsync } from 'expo-file-system';
import { Paths } from 'expo-file-system/next';
import { isDefined } from '@azzapp/shared/isDefined';
import { SOCIAL_NETWORK_LINKS } from '@azzapp/shared/socialLinkHelpers';
import { createRandomFileName } from '#helpers/fileHelpers';
import type { vCard } from '@lepirlouit/vcard-parser';

const valueToString = (value: string[] | string): string => {
  if (Array.isArray(value)) {
    return value.reduce((acc, s) => acc + s + ' ', '').trim();
  }
  return value;
};

const typeToAzzappCasing = (value: string) => {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const VALID_PHONE_TYPE = ['WORK', 'FAX', 'HOME', 'MOBILE', 'MAIN', 'OTHER'];

const metaValueToPhoneType = (
  meta: { type?: string[]; value?: string[]; charset?: string[] } | undefined,
): string => {
  if (meta?.type?.[0]) {
    if (VALID_PHONE_TYPE.includes(meta?.type?.[0])) {
      return typeToAzzappCasing(meta?.type?.[0]);
    }
  } else if (meta) {
    const key = Object.keys(meta).find(key =>
      VALID_PHONE_TYPE.includes(key.toUpperCase()),
    );

    if (key) {
      return typeToAzzappCasing(key);
    }
  }
  return 'Work';
};

const VALID_EMAIL_TYPE = ['WORK', 'HOME', 'MAIN', 'OTHER'];
const metaValueToEmailType = (
  meta: { type?: string[]; value?: string[]; charset?: string[] } | undefined,
): string => {
  if (meta?.type?.[0]) {
    if (VALID_EMAIL_TYPE.includes(meta?.type?.[0])) {
      return typeToAzzappCasing(meta?.type?.[0]);
    }
  } else if (meta) {
    const key = Object.keys(meta).find(key =>
      VALID_EMAIL_TYPE.includes(key.toUpperCase()),
    );

    if (key) {
      return typeToAzzappCasing(key);
    }
  }

  return 'Work'; // default strategy
};

const VALID_ADDRESS_TYPE = ['WORK', 'HOME', 'MAIN', 'OTHER'];
const metaValueToAddressType = (
  meta: { type?: string[]; value?: string[]; charset?: string[] } | undefined,
): string => {
  if (meta?.type?.[0]) {
    if (VALID_ADDRESS_TYPE.includes(meta?.type?.[0])) {
      return typeToAzzappCasing(meta?.type?.[0]);
    }
  } else if (meta) {
    const key = Object.keys(meta).find(key =>
      VALID_ADDRESS_TYPE.includes(key.toUpperCase()),
    );

    if (key) {
      return typeToAzzappCasing(key);
    }
  }
  return 'Work';
};

const metaValueToSocialType = (
  meta: { type?: string[]; value?: string[]; charset?: string[] } | undefined,
): string | undefined => {
  if (meta?.type?.[0] && SOCIAL_NETWORK_LINKS) {
    return SOCIAL_NETWORK_LINKS.find(
      socialLink => socialLink.id === meta?.type?.[0].toLowerCase(),
    )?.id;
  }
  return undefined;
};

export const getVCardBirthday = (vcard: vCard) => {
  return valueToString(vcard?.bday?.[0]?.value);
};
export const getVCardCompany = (vcard: vCard) => {
  return valueToString(vcard.org?.[0]?.value);
};

export const getVCardFirstName = (vcard: vCard) => {
  return valueToString(vcard.n?.[0]?.value?.[0]);
};
export const getVCardLastName = (vcard: vCard) => {
  return valueToString(vcard.n?.[0]?.value?.[1]);
};

export const getVCardTitle = (vcard: vCard) => {
  return valueToString(vcard.title?.[0]?.value);
};

export const getVCardPhoneNumber = (vcard: vCard) => {
  return vcard.tel?.map(tel => ({
    phone: valueToString(tel.value),
    label: metaValueToPhoneType(tel.meta),
  }));
};

export const getVCardEmail = (vcard: vCard) => {
  return vcard.email?.map(email => ({
    email: valueToString(email.value),
    label: metaValueToEmailType(email.meta),
  }));
};

export const getVCardAddresses = (vcard: vCard) => {
  return vcard.adr?.map(adr => ({
    adr: valueToString(adr.value),
    label: metaValueToAddressType(adr.meta),
  }));
};

export const getVCardSocialUrls = (vcard: vCard) => {
  const socials = vcard['X-SOCIALPROFILE']
    ?.map(profile => {
      const label = metaValueToSocialType(profile.meta);
      if (label === undefined) {
        return undefined;
      }
      const url = valueToString(profile.value);
      return {
        url,
        label,
      };
    })
    .filter(isDefined);
  return socials && socials.length > 0 ? socials : undefined;
};

export const getVCardUrls = (vcard: vCard) => {
  let urls = vcard.url?.map(url => {
    return valueToString(url.value);
  });

  vcard['X-SOCIALPROFILE']?.forEach(profile => {
    const type = metaValueToSocialType(profile.meta);
    if (type === undefined) {
      urls.push(valueToString(profile.value));
    }
  });
  urls = urls?.filter(isDefined);
  return urls && urls.length > 0 ? urls : undefined;
};

export const getVCardImage = (vcard: vCard) => {
  const firstPhoto = vcard.photo?.[0];
  if (firstPhoto.value && typeof firstPhoto.value === 'string') {
    const base64Data = firstPhoto.value as string;
    let extension;
    if (firstPhoto.meta?.type?.[0] === 'JPEG') {
      extension = 'jpg';
    } else if (firstPhoto.meta?.type?.[0] === 'PNG') {
      extension = 'png';
    }
    if (!extension) {
      // cannot identify extension, do not import image
      return undefined;
    }
    const outPath = Paths.cache.uri + createRandomFileName(extension);
    writeAsStringAsync(outPath, base64Data, {
      encoding: 'base64',
    });
    return outPath;
  }
  return undefined;
};
