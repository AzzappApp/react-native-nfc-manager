import { serializeContactCard } from './contactCardHelpers';
import { hmacWithPassword } from './crypto';
import type { ContactCard } from 'contactCardHelpers';

export const serializeAndSignContactCard = async (
  profileId: string,
  userName: string,
  card: ContactCard,
) => {
  const serializedContactCard = serializeContactCard(userName, profileId, card);

  const signature = await hmacWithPassword(
    process.env.CONTACT_CARD_SIGNATURE_SECRET ?? '',
    serializedContactCard,
    {
      salt: userName ?? '',
    },
  );

  return {
    signature: signature.digest,
    data: serializedContactCard,
  };
};
