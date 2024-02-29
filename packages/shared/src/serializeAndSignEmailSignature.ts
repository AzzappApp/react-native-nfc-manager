import { hmacWithPassword } from './crypto';
import { serializeEmailSignature } from './emailSignatureHelpers';
import type { CommonInformation, ContactCard } from './contactCardHelpers';

const serializeAndSignEmailSignature = async (
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
    process.env.CONTACT_CARD_SIGNATURE_SECRET ?? '',
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

export default serializeAndSignEmailSignature;
