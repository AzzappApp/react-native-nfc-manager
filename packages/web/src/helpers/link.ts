import { buildWebUrl } from '@azzapp/shared/urlHelpers';

export const generateShareProfileLink = buildWebUrl;

export const generateSharePostLink = (username: string, postId: string) => {
  return `${buildWebUrl(username)}/post/${postId}`;
};
