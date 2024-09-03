import * as CardModuleResolvers from './CardModuleResolvers';
import * as CardStyleResolvers from './CardStyleResolvers';
import * as CardTemplateResolvers from './CardTemplateResolver';
import * as CardTemplateTypeResolvers from './CardTemplateTypeResolver';
import * as ColorPaletteResolvers from './ColorPaletteResolvers';
import * as ContactCardResolvers from './ContactCardResolvers';
import * as CoverTemplateResolvers from './CoverTemplateResolvers';
import * as CoverTemplateTagResolvers from './CoverTemplateTagResolvers';
import * as CoverTemplateTypeResolvers from './CoverTemplateTypeResolvers';
import * as MediaResolvers from './MediaResolvers';
import * as ModuleBackgroundResolvers from './ModuleBackgroundResolvers';
import { Node } from './NodeResolvers';
import * as PaymentResolvers from './PaymentResolvers';
import * as PostResolvers from './PostResolvers';
import * as ProfileResolvers from './ProfileResolvers';
import * as QueryResolvers from './QueryResolvers';
import * as StatisticResolvers from './StatisticResolvers';
import * as UserResolvers from './UserResolvers';
import * as UserSubscriptionResolvers from './UserSubscriptionResolvers';
import * as WebCardResolvers from './WebCardResolvers';

const resolvers = {
  ...CardModuleResolvers,
  ...CardStyleResolvers,
  ...ColorPaletteResolvers,
  ...ContactCardResolvers,
  ...CoverTemplateResolvers,
  ...CoverTemplateTagResolvers,
  ...CoverTemplateTypeResolvers,
  ...MediaResolvers,
  ...ModuleBackgroundResolvers,
  ...PostResolvers,
  ...ProfileResolvers,
  ...WebCardResolvers,
  ...QueryResolvers,
  ...UserResolvers,
  ...CardTemplateResolvers,
  ...CardTemplateTypeResolvers,
  ...StatisticResolvers,
  ...UserSubscriptionResolvers,
  ...PaymentResolvers,
  Node,
};

export default resolvers;
