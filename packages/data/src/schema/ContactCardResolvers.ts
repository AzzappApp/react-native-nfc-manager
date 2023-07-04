import { serializeContactCard } from '@azzapp/shared/contactCardHelpers';
import { hmacWithPassword } from '@azzapp/shared/crypto';
import { idResolver } from './utils';
import type { ContactCardResolvers } from './__generated__/types';

export const ContactCard: ContactCardResolvers = {
  id: card => idResolver('contactCard')({ id: card.profileId ?? '' }), // relay needs an id + one contact card per profile + manage default contact card case
  serializedContactCard: async (card, _, { profileLoader }) => {
    const profile = await profileLoader.load(card.profileId ?? '');

    const serializedContactCard = serializeContactCard(
      profile?.userName ?? '',
      card,
    );

    const signature = await hmacWithPassword(
      process.env.CONTACT_CARD_SIGNATURE_SECRET ?? '',
      serializedContactCard,
      {
        salt: profile?.userName ?? '',
      },
    );

    return {
      signature: signature.digest,
      data: serializedContactCard,
    };
  },
};
