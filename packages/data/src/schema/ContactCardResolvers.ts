import serializeAndSignContactCard from '@azzapp/shared/serializeAndSignContactCard';
import type { ContactCardResolvers } from './__generated__/types';

export const ContactCard: ContactCardResolvers = {
  firstName: profile => profile.contactCard?.firstName ?? null,
  lastName: profile => profile.contactCard?.lastName ?? null,
  title: profile => profile.contactCard?.title ?? null,
  company: profile => profile.contactCard?.company ?? null,
  emails: profile => profile.contactCard?.emails ?? null,
  phoneNumbers: profile => profile.contactCard?.phoneNumbers ?? null,
  isPrivate: profile => !profile.contactCardIsPrivate,
  displayedOnWebCard: profile => profile.contactCardDisplayedOnWebCard ?? false,
  serializedContactCard: profile =>
    serializeAndSignContactCard(
      profile.id,
      profile.userName ?? '',
      profile.contactCard ?? {},
    ),
};
