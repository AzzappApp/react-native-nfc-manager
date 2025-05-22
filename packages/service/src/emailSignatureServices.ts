import { hmacWithPassword } from '@azzapp/shared/crypto';
import { serializeEmailSignature } from '@azzapp/shared/emailSignatureHelpers';
import env from './env';
import type {
  CommonInformation,
  ContactCard,
} from '@azzapp/shared/contactCardHelpers';

export const serializeAndSignEmailSignature = async (
  userName: string,
  profileId: string,
  webCardId: string,
  card: ContactCard,
  commonInformation: CommonInformation | null | undefined,
  avatarUrl: string | null,
) => {
  const serialized = serializeEmailSignature(
    profileId,
    webCardId,
    card,
    commonInformation,
    avatarUrl,
  );

  const signature = await hmacWithPassword(
    env.CONTACT_CARD_SIGNATURE_SECRET,
    serialized,
    {
      salt: `${userName}`,
    },
  );

  return {
    signature: signature.digest,
    data: serialized,
  };
};

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
