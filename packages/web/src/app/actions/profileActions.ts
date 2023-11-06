'use server';

import { headers } from 'next/headers';
import {
  getProfilesPosts,
  getProfilesPostsWithTopComment,
  getPostCommentsWithWebCard,
  getPostByIdWithMedia,
  getPostById,
  getWebCardById,
} from '@azzapp/data/domains';

export const loadProfilePosts = async (
  profileId: string,
  limit: number,
  offset: number,
) => {
  // @TODO: make this function dynamic with a better mechanism than headers
  headers();
  return getProfilesPosts(profileId, limit, offset);
};

export const loadProfilePostsWithTopComment = async (
  profileId: string,
  limit: number,
  offset = 0,
) => {
  // @TODO: make this function dynamic with a better mechanism than headers
  headers();
  return getProfilesPostsWithTopComment(profileId, limit, offset);
};

export const loadPostCommentsWithProfile = async (
  postId: string,
  limit: number,
  before?: Date,
) => {
  // @TODO: make this function dynamic with a better mechanism than headers
  headers();
  const post = await getPostById(postId);
  if (!post?.allowComments) return [];

  return getPostCommentsWithWebCard(postId, limit, before);
};

export const loadPostById = async (id: string) => {
  // @TODO: make this function dynamic with a better mechanism than headers
  headers();
  return getPostByIdWithMedia(id);
};

export const loadWebCardStats = async (webCardId: string) => {
  // @TODO: make this function dynamic with a better mechanism than headers
  headers();
  const webCard = await getWebCardById(webCardId);
  return {
    nbFollowers: webCard.nbFollowers,
    nbFollowings: webCard.nbFollowings,
    nbPosts: webCard.nbPosts,
  };
};
