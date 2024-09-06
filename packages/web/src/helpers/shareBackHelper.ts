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

export const shareBackVCardFilename = (data: {
  firstName?: string;
  lastName?: string;
}): string => {
  let vCardFileName = [
    `${data.firstName?.trim() ? `${data.firstName.trim()}` : ''}`,
    `${data?.lastName?.trim() ? `${data.lastName.trim()}` : ''}`,
  ]
    .filter(Boolean)
    .join('-');
  if (!vCardFileName) {
    vCardFileName = 'azzapp-contact';
  }

  return `${vCardFileName}.vcf`;
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
