import { hmacWithPassword } from '@azzapp/shared/crypto';
import env from './env';

export const serializeAndSignEmailSignatureLinkParams = async (
  webCardUserName: string,
  contactCardAccessId: string,
  key: string,
) => {
  const serialized = JSON.stringify([contactCardAccessId, key]);
  const signature = await hmacWithPassword(
    env.CONTACT_CARD_SIGNATURE_SECRET,
    serialized,
    {
      salt: `${webCardUserName}`,
    },
  );

  return {
    serialized,
    signature: signature.digest,
  };
};
