import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { connectionDefinitions, globalIdField } from 'graphql-relay';
import { GraphQLDateTime } from 'graphql-scalars';
import NodeGraphQL from './NodeGraphQL';
import ProfileGraphQL from './ProfileGraphQL';
import type { PostComment } from '#domains';
import type { GraphQLContext } from './GraphQLContext';

const PostCommentGraphQL = new GraphQLObjectType<PostComment, GraphQLContext>({
  name: 'PostComment',
  description: 'Represent a Azzapp publication',
  interfaces: [NodeGraphQL],
  fields: () => ({
    id: globalIdField('PostComment'),
    author: {
      type: new GraphQLNonNull(ProfileGraphQL),
      description: 'The author of the publication',
      resolve(post, _, { profileLoader }) {
        return profileLoader.load(post.profileId);
      },
    },
    comment: {
      type: new GraphQLNonNull(GraphQLString),
    },
    createdAt: {
      type: new GraphQLNonNull(GraphQLDateTime),
      description: 'Creation date ot the post',
    },
  }),
});

export const { connectionType: PostCommentConnectionGraphQL } =
  connectionDefinitions({
    nodeType: PostCommentGraphQL,
  });

export default PostCommentGraphQL;
