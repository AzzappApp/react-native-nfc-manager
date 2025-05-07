import { hmacWithPassword } from '@azzapp/shared/crypto';
import type { ShareBackContact } from '@azzapp/shared/vCardHelpers';

export const getValuesFromSubmitData = (
  data: Record<string, unknown>,
): ShareBackContact => {
  return Object.entries(data)
    .filter(([, value]) => value)
    .reduce(
      (obj, [key, value]) => {
        obj[key] = value;
        return obj;
      },
      {} as Record<string, unknown>,
    );
};

export const generateSaltFromValues = (values: ShareBackContact): string => {
  return encodeURIComponent(Object.values(values).join(''));
};

export const shareBackSignature = async (
  secret: string,
  data: ShareBackContact,
): Promise<string> => {
  const salt = generateSaltFromValues(data);
  const dataStringify = JSON.stringify(data, null, 2);
  return (
    await hmacWithPassword(secret, dataStringify, {
      salt: salt ?? '',
    })
  ).digest;
};
