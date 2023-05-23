import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import {
  connectionDefinitions,
  connectionFromArray,
  forwardConnectionArgs,
  globalIdField,
} from 'graphql-relay';
import { GraphQLDateTime } from 'graphql-scalars';
import { getProfileId } from '@azzapp/auth/viewer';
import { db, getPostComments, getPostReaction } from '#domains';
import {
  cursorToDate,
  connectionFromDateSortedItems,
} from '#helpers/connectionsHelpers';
import { ReactionKind } from './commonsTypes';
import MediaGraphQL from './MediaGraphQL';
import NodeGraphQL from './NodeGraphQL';
import PostCommentGraphQL, {
  PostCommentConnectionGraphQL,
} from './PostCommentGraphQL';
import ProfileGraphQL from './ProfileGraphQL';
import type { Post, Media, PostComment } from '#domains';
import type { GraphQLContext } from './GraphQLContext';
import type { ConnectionArguments, Connection } from 'graphql-relay';

const PostGraphQL = new GraphQLObjectType<Post, GraphQLContext>({
  name: 'Post',
  description: 'Represent a Azzapp publication',
  interfaces: [NodeGraphQL],
  fields: () => ({
    id: globalIdField('Post'),
    author: {
      type: new GraphQLNonNull(ProfileGraphQL),
      description: 'The author of the publication',
      resolve(post, _, { profileLoader }) {
        return profileLoader.load(post.authorId);
      },
    },
    media: {
      type: new GraphQLNonNull(MediaGraphQL),
      description: 'The media of the publication',
      resolve: (post, _, { mediaLoader }): Promise<Media[]> =>
        mediaLoader
          .loadMany(post.medias as string[])
          .then(
            medias =>
              medias.filter(media => media && !(media instanceof Error))[0],
          ) as any,
    },
    content: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The text content of the publication',
      resolve(post) {
        return post.content ?? '';
      },
    },
    allowComments: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: 'Does this post allow comments',
    },
    allowLikes: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: 'Does this post allow likes',
    },
    viewerPostReaction: {
      type: ReactionKind,
      description: 'Reaction of the viewer on this post',
      async resolve(post, _, { auth }) {
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
    },
    counterReactions: {
      type: new GraphQLNonNull(GraphQLInt),
      //TODO: discuss the best strategy to handle this. Maintain a counter or count each time
      // some reference : https://medium.com/@morefree7/design-a-system-that-tracks-the-number-of-likes-ea69fdb41cf2
    },
    counterComments: {
      type: new GraphQLNonNull(GraphQLInt),
      //TODO: discuss the best strategy to handle this. Maintain a counter or count each time
      // some reference : https://medium.com/@morefree7/design-a-system-that-tracks-the-number-of-likes-ea69fdb41cf2
    },
    createdAt: {
      type: new GraphQLNonNull(GraphQLDateTime),
      description: 'Creation date ot the post',
    },
    previewComment: {
      type: PostCommentGraphQL,
      description:
        'Return the recommended comment for the post (for now the last one)',
      resolve: async (post, _): Promise<PostComment | null> => {
        const comments = await getPostComments(post.id, 1);
        if (comments.length > 0) {
          return comments[0];
        }
        return null;
      },
    },
    comments: {
      type: PostCommentConnectionGraphQL,
      description: 'Return a list of comments for the post',
      args: forwardConnectionArgs,
      resolve: async (
        post,
        args: ConnectionArguments,
      ): Promise<Connection<PostComment>> => {
        const { after, first } = args;
        const limit = first ?? 15;

        const offset = after ? cursorToDate(after) : null;

        //fetch one more item to know if there is a next page (avoid counting all the items, that could be a probleme on huge tables)
        const postComments = await getPostComments(post.id, limit + 1, offset);
        const hasNextPage = postComments.length > limit;
        return connectionFromDateSortedItems(postComments.slice(0, -1), {
          getDate: post => post.createdAt,
          hasNextPage,
          hasPreviousPage: offset !== null,
        });
      },
    },
    relatedPosts: {
      type: new GraphQLNonNull(PostConnectionGraphQL),
      args: forwardConnectionArgs,
      async resolve(
        post,
        args: ConnectionArguments,
      ): Promise<Connection<Post>> {
        // TODO dummy implementation just to test frontend
        return connectionFromArray(
          await db.selectFrom('Post').selectAll().execute(),
          args,
        );
      },
    },
  }),
});

export const { connectionType: PostConnectionGraphQL } = connectionDefinitions({
  nodeType: PostGraphQL,
});

export default PostGraphQL;
