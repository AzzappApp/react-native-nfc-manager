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
import { db, getPostReaction } from '#domains';
import MediaGraphQL from './MediaGraphQL';
import { ReactionKind } from './mutations/commonsTypes';
import NodeGraphQL from './NodeGraphQL';
import ProfileGraphQL from './ProfileGraphQL';
import type { Post, Media } from '#domains';
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
    createdAt: {
      type: new GraphQLNonNull(GraphQLDateTime),
      description: 'Creation date ot the post',
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
