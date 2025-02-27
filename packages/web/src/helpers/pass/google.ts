import { GenericClient } from 'google-wallet/lib/cjs/generic';

export const generateGooglePassInfos = (profileId: string) => {
  const objectSuffix = 'contactCard_object';
  const issuerId = process.env.GOOGLE_PASS_ISSUER_ID ?? '';
  const objectId = `${objectSuffix}.${profileId}`;

  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_PASS_CREDENTIALS ?? '', 'base64').toString(),
  );

  const genericClient = new GenericClient(credentials);

  return {
    issuerId,
    objectId,
    passId: `${issuerId}.${objectId}`,
    genericClient,
  };
};
