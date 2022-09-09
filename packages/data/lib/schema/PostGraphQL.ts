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
import { getUserPosts } from '../domains/Post';
import { getUserById } from '../domains/User';
import { emptyConnection } from '../helpers/graphqlHelpers';
import MediaGraphQL from './MediaGraphQL';
import NodeGraphQL from './NodeGraphQL';
import UserGraphQL from './UserGraphQL';
import type { Post } from '../domains/Post';
import type { GraphQLContext } from './GraphQLContext';
import type { ConnectionArguments } from 'graphql-relay';

const PostGraphQL = new GraphQLObjectType<Post, GraphQLContext>({
  name: 'Post',
  description: 'Represent a Azzapp publication',
  interfaces: [NodeGraphQL],
  fields: () => ({
    id: globalIdField('Post', post => post.postId),
    author: {
      type: new GraphQLNonNull(UserGraphQL),
      description: 'The author of the publication',
      resolve(post) {
        return getUserById(post.authorId);
      },
    },
    postDate: {
      type: new GraphQLNonNull(GraphQLFloat),
      description: 'The date of the publication',
    },
    media: {
      type: new GraphQLNonNull(MediaGraphQL),
      description: 'The media of the publication',
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
      async resolve(post, args: ConnectionArguments) {
        const result = await getUserPosts(post.authorId, 1000);
        if (result) {
          return connectionFromArray(
            result.rows
              .map(({ doc }) => doc)
              .filter(({ postId }) => postId !== post.postId),
            args,
          );
        }
        return emptyConnection;
      },
    },
  }),
});

export const { connectionType: PostConnectionGraphQL } = connectionDefinitions({
  nodeType: PostGraphQL,
});

export default PostGraphQL;
