import {
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';

export const MediaInputGraphQL = new GraphQLInputObjectType({
  name: 'MediaInput',
  description: 'User Card media module media',
  fields: () => ({
    kind: {
      type: new GraphQLNonNull(MediaKindGraphQL),
    },
    source: {
      type: new GraphQLNonNull(GraphQLString),
    },
    ratio: {
      type: GraphQLFloat,
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
