import { GenericClient } from 'google-wallet/lib/cjs/generic';
import env from '#env';

export const generateGooglePassInfos = (profileId: string) => {
  const objectSuffix = 'contactCard_object';
  const issuerId = env.GOOGLE_PASS_ISSUER_ID ?? '';
  const objectId = `${objectSuffix}.${profileId}`;

  const credentials = JSON.parse(
    Buffer.from(env.GOOGLE_PASS_CREDENTIALS, 'base64').toString(),
  );

  const genericClient = new GenericClient(credentials);

  return {
    issuerId,
    objectId,
    passId: `${issuerId}.${objectId}`,
    genericClient,
  };
};
