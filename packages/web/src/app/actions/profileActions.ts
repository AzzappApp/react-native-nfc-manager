'use server';

import { headers } from 'next/headers';
import {
  getProfilesPosts,
  getProfilesPostsWithTopComment,
  getPostCommentsWithProfile,
  getPostByIdWithMedia,
  getProfileById,
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
  return getPostCommentsWithProfile(postId, limit, before);
};

export const loadPostById = async (id: string) => {
  // @TODO: make this function dynamic with a better mechanism than headers
  headers();
  return getPostByIdWithMedia(id);
};

export const loadProfileStats = async (profileId: string) => {
  // @TODO: make this function dynamic with a better mechanism than headers
  headers();
  const profile = await getProfileById(profileId);
  return {
    nbFollowers: profile.nbFollowers,
    nbFollowings: profile.nbFollowings,
    nbPosts: profile.nbPosts,
  };
};
