export const generateShareProfileLink = (username: string) => {
  return `azzapp.com/${username}`;
};

export const generateSharePostLink = (username: string, postId: string) => {
  return `azzapp.com/${username}/${postId}`;
};
