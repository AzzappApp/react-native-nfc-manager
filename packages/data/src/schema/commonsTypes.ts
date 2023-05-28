import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import localizedLabelResolver from '#helpers/localizationHelper';
import type { GraphQLContext } from './GraphQLContext';
import type { Interest } from '@prisma/client';

export const ProfileKindGraphQL = new GraphQLEnumType({
  name: 'ProfileKind',
  values: {
    business: { value: 'business' },
    personal: { value: 'personal' },
    product: { value: 'product' },
  },
});

export const ReactionKind = new GraphQLEnumType({
  name: 'ReactionKind',
  values: {
    like: { value: 'like' },
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

export const TextAlignmentGraphQL = new GraphQLEnumType({
  name: 'TextAlignment',
  values: {
    left: { value: 'left' },
    center: { value: 'center' },
    right: { value: 'right' },
    justify: { value: 'justify' },
  },
});
