import {
  GraphQLBoolean,
  GraphQLFloat,
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
import { db } from '../domains';
import MediaGraphQL from './MediaGraphQL';
import NodeGraphQL from './NodeGraphQL';
import UserGraphQL from './UserGraphQL';
import type { Post } from '../domains';
import type { GraphQLContext } from './GraphQLContext';
import type { ConnectionArguments, Connection } from 'graphql-relay';

const PostGraphQL = new GraphQLObjectType<Post, GraphQLContext>({
  name: 'Post',
  description: 'Represent a Azzapp publication',
  interfaces: [NodeGraphQL],
  fields: () => ({
    id: globalIdField('Post'),
    author: {
      type: new GraphQLNonNull(UserGraphQL),
      description: 'The author of the publication',
      resolve(post, _, { userLoader }) {
        return userLoader.load(post.authorId);
      },
    },
    postDate: {
      type: new GraphQLNonNull(GraphQLFloat),
      description: 'The date of the publication',
    },
    media: {
      type: new GraphQLNonNull(MediaGraphQL),
      description: 'The media of the publication',
      resolve(post, _, { mediasLoader }) {
        // TODO handle null case ?
        return mediasLoader.load(post.id).then(medias => medias?.[0]);
      },
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
