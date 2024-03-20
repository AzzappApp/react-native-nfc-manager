export const generateShareProfileLink = (username: string) => {
  return `${process.env.NEXT_PUBLIC_URL}${username}`;
};

export const generateSharePostLink = (username: string, postId: string) => {
  return `${process.env.NEXT_PUBLIC_URL}${username}/post/${postId}`;
};
