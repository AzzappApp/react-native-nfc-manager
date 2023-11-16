import serializeAndSignContactCard from '@azzapp/shared/serializeAndSignContactCard';
import type { ContactCardResolvers } from './__generated__/types';

export const ContactCard: ContactCardResolvers = {
  firstName: profile => profile.contactCard?.firstName ?? null,
  lastName: profile => profile.contactCard?.lastName ?? null,
  title: profile => profile.contactCard?.title ?? null,
  company: profile => profile.contactCard?.company ?? null,
  emails: profile => profile.contactCard?.emails ?? null,
  phoneNumbers: profile => profile.contactCard?.phoneNumbers ?? null,
  urls: profile => profile.contactCard?.urls ?? null,
  addresses: profile => profile.contactCard?.addresses ?? null,
  birthday: profile => profile.contactCard?.birthday ?? null,
  socials: profile =>
    profile.contactCard?.socials?.filter(social => social.url) ?? null, // we want to ignore socials without a url (e.g. registered before adding social network type selector)
  isPrivate: profile => !profile.contactCardIsPrivate,
  displayedOnWebCard: profile => profile.contactCardDisplayedOnWebCard ?? false,
  serializedContactCard: profile =>
    serializeAndSignContactCard(
      profile.id,
      profile.userName ?? '',
      profile.contactCard ?? {},
    ),
};
