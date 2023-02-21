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
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    width: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
    height: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
  }),
});

export const MediaKindGraphQL = new GraphQLEnumType({
  name: 'MediaKind',
  values: {
    video: { value: 'video' },
    image: { value: 'image' },
  },
});

export const ProfileKind = new GraphQLEnumType({
  name: 'ProfileKind',
  values: {
    business: { value: 'business' },
    personal: { value: 'personal' },
    product: { value: 'product' },
  },
});
