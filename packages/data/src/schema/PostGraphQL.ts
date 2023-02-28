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
import { db } from '#domains';
import MediaGraphQL from './MediaGraphQL';
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
    postDate: {
      type: new GraphQLNonNull(GraphQLFloat),
      description: 'The date of the publication',
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
