import {
  getContactCardAccessById,
  updateContactCardAccessLastRead,
  getProfileWithWebCardById,
} from '@azzapp/data';
import { importPublicKey, verifyMessage } from '@azzapp/shared/crypto';
import ERRORS from '@azzapp/shared/errors';

export const verifyContactCardAccess = async (
  contactCardAccessId: string,
  key: string,
  webCardUserName: string,
) => {
  const contactCardAccess = await getContactCardAccessById(contactCardAccessId);

  if (!contactCardAccess || contactCardAccess.isRevoked) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  const cryptoKey = await importPublicKey(key);

  const isValid = await verifyMessage(
    cryptoKey,
    contactCardAccess.profileId,
    contactCardAccess.signature,
  );

  if (!isValid) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  await updateContactCardAccessLastRead(contactCardAccessId);

  const res = await getProfileWithWebCardById(contactCardAccess.profileId);
  if (!res) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  if (res.webCard?.userName?.toLowerCase() !== webCardUserName.toLowerCase()) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  return res;
};
