import serializeAndSignContactCard from '@azzapp/shared/serializeAndSignContactCard';

import { idResolver } from './utils';
import type { ContactCardResolvers } from './__generated__/types';

export const ContactCard: ContactCardResolvers = {
  id: profile => idResolver('ContactCard')({ id: profile.id }),
  firstName: profile => profile.contactCard?.firstName ?? null,
  lastName: profile => profile.contactCard?.lastName ?? null,
  title: profile => profile.contactCard?.title ?? null,
  company: profile => profile.contactCard?.company ?? null,
  emails: profile => profile.contactCard?.emails ?? null,
  phoneNumbers: profile => profile.contactCard?.phoneNumbers ?? null,
  public: profile => !profile.contactCardIsPrivate,
  isDisplayedOnWebCard: profile =>
    profile.contactCardDisplayedOnWebCard ?? false,
  serializedContactCard: profile =>
    serializeAndSignContactCard(
      profile.id,
      profile.userName ?? '',
      profile.contactCard ?? {},
    ),
};
