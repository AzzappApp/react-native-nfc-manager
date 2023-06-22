import { idResolver } from './utils';
import type { ContactCardResolvers } from './__generated__/types';

export const ContactCard: ContactCardResolvers = {
  id: card => idResolver('contactCard')({ id: card.profileId ?? '' }), // relay needs an id + one contact card per profile + manage default contact card case
};
