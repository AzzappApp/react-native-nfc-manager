import { serializeContactCard } from './contactCardHelpers';
import { hmacWithPassword } from './crypto';
import type { CommonInformation, ContactCard } from './contactCardHelpers';

const serializeAndSignContactCard = async (
  userName: string,
  profileId: string,
  webCardId: string,
  card: ContactCard,
  commonInformation?: CommonInformation | null,
) => {
  const serializedContactCard = serializeContactCard(
    userName,
    profileId,
    webCardId,
    card,
    commonInformation,
  );

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

export default serializeAndSignContactCard;
