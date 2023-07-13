import { serializeContactCard } from './contactCardHelpers';
import { hmacWithPassword } from './crypto';
import type { ContactCard } from 'contactCardHelpers';

export const serializeAndSignContactCard = async (
  userName: string,
  card: ContactCard,
) => {
  const serializedContactCard = serializeContactCard(userName, card);

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
