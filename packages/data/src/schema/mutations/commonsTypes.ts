import {
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import localizedLabelResolver from '#helpers/localizationHelper';
import type { GraphQLContext } from '#index';
import type { Interest } from '@prisma/client';

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

export const InterestGraphQL = new GraphQLObjectType<Interest, GraphQLContext>({
  name: 'Interest',
  description: 'Represent a subject of interest',
  fields: () => ({
    tag: {
      type: new GraphQLNonNull(GraphQLID),
    },
    label: {
      type: GraphQLString,
      resolve: localizedLabelResolver('labels'),
    },
  }),
});
