import { connectionFromArray } from 'graphql-relay';
import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import {
  db,
  getPostCommentsByDate,
  getPostReaction,
  PostTable,
} from '#domains';
import {
  cursorToDate,
  connectionFromDateSortedItems,
} from '#helpers/connectionsHelpers';
import { idResolver } from './utils';
import type { Media } from '#domains';
import type {
  PostCommentResolvers,
  PostResolvers,
} from './__generated__/types';

export const Post: PostResolvers = {
  id: idResolver('Post'),
  author: async (post, _, { profileLoader }) => {
    const author = await profileLoader.load(post.authorId);
    if (author) {
      return author;
    }
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  },
  media: async (post, _, { mediaLoader }) => {
    return mediaLoader
      .loadMany(post.medias)
      .then(
        medias =>
          (
            medias.filter(
              media => media && !(media instanceof Error),
            ) as Media[]
          )[0]!,
      )
      .catch(err => {
        throw err;
      });
  },
  content: async post => {
    return post.content ?? '';
  },
  viewerPostReaction: async (post, _, { auth }) => {
    if (auth.isAnonymous) {
      return null;
    }
    const profileId = getProfileId(auth);
    if (!profileId) {
      return null;
    }
    const reaction = await getPostReaction(profileId, post.id);
    if (reaction) {
      return reaction.reactionKind;
    }
    return null;
  },
  previewComment: async (post, _) => {
    const comments = await getPostCommentsByDate(post.id, 1);
    if (comments.length > 0) {
      return comments[0];
    }
    return null;
  },
  comments: async (post, args) => {
    const { after, first } = args;
    const limit = first ?? 15;

    const offset = after ? cursorToDate(after) : null;

    const postComments = await getPostCommentsByDate(
      post.id,
      limit + 1,
      offset,
    );
    if (postComments?.length > 0) {
      //sort should be done on request side, we will used updated at to have the last updated cover
      const sizedComments = postComments.slice(0, limit);
      return connectionFromDateSortedItems(sizedComments, {
        getDate: post => post.createdAt,
        hasNextPage: postComments.length > limit,
        hasPreviousPage: offset !== null,
      });
    }
    return connectionFromArray([], args);
  },
  relatedPosts: async (_post, args) => {
    // TODO dummy implementation just to test frontend
    return connectionFromArray(await db.select().from(PostTable), args);
  },
};

export const PostComment: PostCommentResolvers = {
  id: idResolver('PostComment'),
  author: async (post, _, { profileLoader }) => {
    const author = await profileLoader.load(post.profileId);
    if (author) {
      return author;
    }
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  },
};
