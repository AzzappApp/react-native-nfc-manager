import {
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import type { Media } from '../domains/UserCard';
import type { GraphQLContext } from './GraphQLContext';

export const MediaGraphQL = new GraphQLObjectType<Media, GraphQLContext>({
  name: 'Media',
  description: 'User Card media module media',
  fields: () => ({
    kind: {
      type: new GraphQLNonNull(MediaKindGraphQL),
    },
    source: {
      type: new GraphQLNonNull(GraphQLString),
    },
  }),
});

export const MediaKindGraphQL = new GraphQLEnumType({
  name: 'MediaKind',
  values: {
    video: { value: 'video' },
    picture: { value: 'picture' },
  },
});
