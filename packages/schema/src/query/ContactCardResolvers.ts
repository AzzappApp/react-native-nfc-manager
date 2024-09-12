import type { ContactCardResolvers } from '#/__generated__/types';

export const ContactCard: ContactCardResolvers = {
  socials: contactCard =>
    contactCard?.socials?.filter(social => social.url) ?? null, // we want to ignore socials without a url (e.g. registered before adding social network type selector)
};
