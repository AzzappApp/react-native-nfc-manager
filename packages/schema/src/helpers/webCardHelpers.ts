import {
  deleteRedirection,
  getRedirectWebCardByUserName,
  getWebCardByUserName,
} from '@azzapp/data';

export const isUserNameAvailable = async (userName: string) => {
  const profile = await getWebCardByUserName(userName);
  const redirection = await getRedirectWebCardByUserName(userName);
  if (redirection.length === 0 && !profile) {
    return { available: true, userName };
  } else if (redirection.length > 0 && !profile) {
    //check if redirection is passed
    const currentRedirection = redirection[0];
    if (currentRedirection.expiresAt < new Date()) {
      await deleteRedirection(redirection[0].fromUserName);
      return { available: true, userName };
    }
  }
  return { available: false, userName };
};
