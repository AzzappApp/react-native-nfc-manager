import {
  type ContactCard,
  type CommonInformation,
  serializeContactCard,
} from '@azzapp/shared/contactCardHelpers';
import { hmacWithPassword } from '@azzapp/shared/crypto';
import env from './env';

export const serializeAndSignContactCard = async (
  userName: string,
  profileId: string,
  webCardId: string,
  card: ContactCard,
  commonInformation?: CommonInformation | null,
) => {
  const serializedContactCard = serializeContactCard(
    profileId,
    webCardId,
    card,
    commonInformation,
  );

  const signature = await hmacWithPassword(
    env.CONTACT_CARD_SIGNATURE_SECRET,
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

export const CONTACT_CARD_SIGNATURE_SECRET = env.CONTACT_CARD_SIGNATURE_SECRET;
