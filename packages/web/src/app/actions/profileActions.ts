'use server';

import {
  getFollowingsCount,
  getFollowerProfilesCount,
  getProfilesPosts,
  getProfilesPostsCount,
  getPostComments,
  getProfilesPostsWithTopComment,
} from '@azzapp/data/domains';

export const loadProfilePosts = async (
  profileId: string,
  limit: number,
  offset: number,
) => {
  return getProfilesPosts(profileId, limit, offset);
};

export const loadProfilePostsWithTopComment = async (
  profileId: string,
  limit: number,
  offset: number,
) => {
  return getProfilesPostsWithTopComment(profileId, limit, offset);
};

export const loadPostComments = async (
  profileId: string,
  limit: number,
  after?: Date,
) => {
  return getPostComments(profileId, limit, after);
};

export const loadProfilesPostsCount = async (profileId: string) => {
  return getProfilesPostsCount(profileId);
};

export const loadFollowingCount = async (profileId: string) => {
  return getFollowingsCount(profileId);
};

export const loadFollowerProfilesCount = async (profileId: string) => {
  return getFollowerProfilesCount(profileId);
};
