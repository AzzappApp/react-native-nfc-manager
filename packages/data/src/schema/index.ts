import * as CardCoverResolvers from './CardCoverResolvers';
import * as CardModuleResolvers from './CardModuleResolvers';
import * as CardStyleResolvers from './CardStyleResolvers';
import * as CardTemplateResolvers from './CardTemplateResolver';
import * as CardTemplateTypeResolvers from './CardTemplateTypeResolver';
import * as ColorPaletteResolvers from './ColorPaletteResolvers';
import * as ContactCardResolvers from './ContactCardResolvers';
import * as CoverTemplateResolvers from './CoverTemplateResolvers';
import * as MediaResolvers from './MediaResolvers';
import * as MutationResolvers from './mutations';
import { Node } from './NodeResolvers';
import * as PostResolvers from './PostResolvers';
import * as ProfileResolvers from './ProfileResolvers';
import * as QueryResolvers from './QueryResolvers';
import * as StatisticResolvers from './StatisticResolvers';
import * as UserResolvers from './UserResolvers';
import * as ViewerResolvers from './ViewerResolvers';
import * as WebCardResolvers from './WebCardResolvers';
import type { Resolvers } from './__generated__/types';

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
  ...ViewerResolvers,
  ...CardTemplateResolvers,
  ...CardTemplateTypeResolvers,
  ...StatisticResolvers,
  Node,
};

export default resolvers;
