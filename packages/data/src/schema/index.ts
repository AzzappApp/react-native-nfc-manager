import * as CardCoverResolvers from './CardCoverResolvers';
import * as CardModuleResolvers from './CardModuleResolvers';
import * as CardResolvers from './CardResolvers';
import * as ContactCardResolvers from './ContactCardResolvers';
import * as CoverTemplateResolvers from './CoverTemplateResolvers';
import * as InterestResolvers from './InterestResolvers';
import * as MediaResolvers from './MediaResolvers';
import * as MutationResolvers from './mutations';
import { Node } from './NodeResolvers';
import * as PostResolvers from './PostResolvers';
import * as ProfileResolvers from './ProfileResolvers';
import * as QueryResolvers from './QueryResolvers';
import * as UserResolvers from './UserResolvers';
import * as ViewerResolvers from './ViewerResolvers';
import type { Resolvers } from './__generated__/types';

const resolvers: Resolvers = {
  ...MutationResolvers,
  ...MediaResolvers,
  ...CardCoverResolvers,
  ...CardResolvers,
  ...CardModuleResolvers,
  ...CoverTemplateResolvers,
  ...PostResolvers,
  ...ProfileResolvers,
  ...QueryResolvers,
  ...UserResolvers,
  ...ViewerResolvers,
  ...InterestResolvers,
  ...ContactCardResolvers,
  Node,
};

export default resolvers;
