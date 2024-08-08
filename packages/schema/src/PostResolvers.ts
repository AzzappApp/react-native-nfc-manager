import { eq, and } from 'drizzle-orm';
import { connectionFromArray, cursorToOffset } from 'graphql-relay';
import {
  db,
  getPostCommentsByDate,
  getPostLikesWebcard,
  getPostReaction,
  PostTable,
  WebCardTable,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import {
  cursorToDate,
  connectionFromDateSortedItems,
  connectionFromSortedArray,
} from '#helpers/connectionsHelpers';
import { maybeFromGlobalIdWithType } from '#helpers/relayIdHelpers';
import { idResolver } from './utils';
import type {
  PostCommentResolvers,
  PostResolvers,
} from './__generated__/types';

export const Post: PostResolvers = {
  id: idResolver('Post'),
  webCard: async (post, _args, { loaders }) => {
    const webCard = await loaders.WebCard.load(post.webCardId);
    if (webCard) {
      return webCard;
    }
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  },
  media: async post => ({
    media: post.medias[0],
    assetKind: 'post',
  }),
  content: async post => {
    return post.content ?? '';
  },
  postReaction: async (post, { webCardId: gqlWebCardId }) => {
    if (!gqlWebCardId) {
      return null;
    }
    const webCardId = maybeFromGlobalIdWithType(gqlWebCardId, 'WebCard');
    const reaction = webCardId
      ? await getPostReaction(webCardId, post.id)
      : null;
    if (reaction) {
      return reaction.reactionKind;
    }
    return null;
  },
  previewComment: async (post, _) => {
    if (post.allowComments) {
      const comments = await getPostCommentsByDate(post.id, 1);
      if (comments.length > 0) {
        return comments[0];
      }
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
    return connectionFromArray(
      await db
        .select()
        .from(PostTable)
        .innerJoin(WebCardTable, eq(WebCardTable.id, PostTable.webCardId))
        .where(
          and(
            eq(WebCardTable.cardIsPublished, true),
            eq(PostTable.deleted, false),
          ),
        )
        .then(results => results.map(result => result.Post)),
      args,
    );
  },
  reactions: async (post, { first, after }) => {
    const limit = first ?? 100;
    const offset = after ? cursorToOffset(after) : 0;

    const webcards = await getPostLikesWebcard(post.id, {
      limit: limit + 1,
      offset,
    });

    return connectionFromSortedArray(webcards.slice(0, limit), {
      offset,
      hasNextPage: webcards.length > limit,
    });
  },
};

export const PostComment: PostCommentResolvers = {
  id: idResolver('PostComment'),
  webCard: async (post, _args, { loaders }) => {
    const author = await loaders.WebCard.load(post.webCardId);
    if (author) {
      return author;
    }
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  },
};
