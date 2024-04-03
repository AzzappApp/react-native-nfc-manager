import { makeExecutableSchema } from '@graphql-tools/schema';
import { applyMiddleware } from 'graphql-middleware';
import { applyDirectiveSchemaTransform, directivesTypeDefs } from '#directives';
import permissions from '#permission';
import { typeDefs } from '#/__generated__/types';
import * as CardCoverResolvers from './CardCoverResolvers';
import * as CardModuleResolvers from './CardModuleResolvers';
import * as CardStyleResolvers from './CardStyleResolvers';
import * as CardTemplateResolvers from './CardTemplateResolver';
import * as CardTemplateTypeResolvers from './CardTemplateTypeResolver';
import * as ColorPaletteResolvers from './ColorPaletteResolvers';
import * as ContactCardResolvers from './ContactCardResolvers';
import * as CoverTemplateResolvers from './CoverTemplateResolvers';
import { createGraphQLContext } from './GraphQLContext';
import * as MediaResolvers from './MediaResolvers';
import * as MutationResolvers from './mutations';
import { Node } from './NodeResolvers';
import * as PostResolvers from './PostResolvers';
import * as ProfileResolvers from './ProfileResolvers';
import * as QueryResolvers from './QueryResolvers';
import * as StatisticResolvers from './StatisticResolvers';
import * as UserResolvers from './UserResolvers';
import * as UserSubscriptionResolvers from './UserSubscriptionResolvers';
import * as WebCardResolvers from './WebCardResolvers';
import type { Resolvers } from './__generated__/types';
import type { GraphQLContext } from './GraphQLContext';

const resolvers: Resolvers = {
  ...CardCoverResolvers,
  ...CardModuleResolvers,
  ...CardStyleResolvers,
  ...ColorPaletteResolvers,
  ...ContactCardResolvers,
  ...CoverTemplateResolvers,
  ...MediaResolvers,
  ...MutationResolvers,
  ...PostResolvers,
  ...ProfileResolvers,
  ...WebCardResolvers,
  ...QueryResolvers,
  ...UserResolvers,
  ...CardTemplateResolvers,
  ...CardTemplateTypeResolvers,
  ...StatisticResolvers,
  ...UserSubscriptionResolvers,
  Node,
};

const buildSchema = () => {
  return makeExecutableSchema({
    typeDefs: [directivesTypeDefs, typeDefs],
    resolvers,
  });
};

const schema = applyMiddleware(
  applyDirectiveSchemaTransform(buildSchema()),
  permissions,
);

export { schema, createGraphQLContext };

export type { GraphQLContext };
