import type { WebCard } from '@azzapp/data';
import type { ContactCard } from '@azzapp/shared/contactCardHelpers';

export const mergeContactCardWithCommonInfos = (
  webCard: WebCard,
  contactCard?: ContactCard | null,
): ContactCard => {
  return {
    ...contactCard,
    addresses: (webCard?.isMultiUser
      ? (webCard?.commonInformation?.addresses ?? [])
      : []
    ).concat(contactCard?.addresses || []),
    company:
      (webCard?.isMultiUser ? webCard?.commonInformation?.company : null) ??
      contactCard?.company,
    phoneNumbers: (webCard?.isMultiUser
      ? (webCard?.commonInformation?.phoneNumbers ?? [])
      : []
    ).concat(contactCard?.phoneNumbers || []),
    emails: (webCard?.isMultiUser
      ? (webCard?.commonInformation?.emails ?? [])
      : []
    ).concat(contactCard?.emails || []),
    urls: (webCard?.isMultiUser
      ? (webCard?.commonInformation?.urls ?? [])
      : []
    ).concat(contactCard?.urls || []),
    socials: (webCard?.isMultiUser
      ? (webCard?.commonInformation?.socials ?? [])
      : []
    ).concat(contactCard?.socials || []),
  };
};
