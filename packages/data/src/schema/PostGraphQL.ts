import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { connectionDefinitions, globalIdField } from 'graphql-relay';
import { getUserById } from '../domains/User';
import { MediaGraphQL } from './commonsTypes';
import NodeGraphQL from './NodeGraphQL';
import UserGraphQL from './UserGraphQL';
import type { Post } from '../domains/Post';
import type { GraphQLContext } from './GraphQLContext';

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
    },
    allowComments: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: 'Does this post allow comments',
    },
    allowLikes: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: 'Does this post allow likes',
    },
  }),
});

export const { connectionType: PostConnectionGraphQL } = connectionDefinitions({
  nodeType: PostGraphQL,
});

export default PostGraphQL;
