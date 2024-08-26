import { DEFAULT_DATETIME_VALUE, cols } from './database';
import { createId } from './helpers/createId';
import type { CardStyle as CardStyleData } from '@azzapp/shared/cardHelpers';
import type {
  CardModuleBlockTextData,
  CardModuleCarouselData,
  CardModuleHorizontalPhotoData,
  CardModulePhotoWithTextAndTitleData,
  CardModuleSimpleButtonData,
  CardModuleSimpleTextData,
  CardModuleSocialLinksData,
  CardModuleLineDividerData,
  MODULE_KIND_BLOCK_TEXT,
  MODULE_KIND_CAROUSEL,
  MODULE_KIND_HORIZONTAL_PHOTO,
  MODULE_KIND_LINE_DIVIDER,
  MODULE_KIND_SCHEDULE,
  MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE,
  MODULE_KIND_SIMPLE_BUTTON,
  MODULE_KIND_SIMPLE_TEXT,
  MODULE_KIND_SIMPLE_TITLE,
  MODULE_KIND_SOCIAL_LINKS,
  MODULE_KIND_WEB_CARDS_CAROUSEL,
  MODULE_KIND_PARALLAX,
  MODULE_KIND_VIDEO,
  MODULE_KIND_IMAGEGRID,
} from '@azzapp/shared/cardModuleHelpers';
import type {
  CommonInformation,
  ContactCard,
} from '@azzapp/shared/contactCardHelpers';
import type { InferSelectModel } from 'drizzle-orm';

// #region CardModule
export const CardModuleTable = cols.table(
  'CardModule',
  {
    id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
    webCardId: cols.cuid('webCardId').notNull(),
    kind: cols
      .enum('kind', [
        'blockText',
        'carousel',
        'horizontalPhoto',
        'imageGrid',
        'lineDivider',
        'parallax',
        'photoWithTextAndTitle',
        'schedule',
        'simpleButton',
        'simpleText',
        'simpleTitle',
        'socialLinks',
        'video',
        'webCardsCarousel',
      ])
      .notNull(),
    data: cols.json('data').$type<any>().notNull(),
    position: cols.int('position').notNull(),
    visible: cols.boolean('visible').default(true).notNull(),
  },
  table => {
    return {
      webCardIdIdx: cols.index('CardModule_webCardId_idx').on(table.webCardId),
    };
  },
);

export type CardModuleBase = Omit<
  InferSelectModel<typeof CardModuleTable>,
  'data' | 'kind'
>;

export type CardModuleBlockText = CardModuleBase & {
  kind: typeof MODULE_KIND_BLOCK_TEXT;
  data: CardModuleBlockTextData;
};

export type CardModuleCarousel = CardModuleBase & {
  kind: typeof MODULE_KIND_CAROUSEL;
  data: CardModuleCarouselData;
};

export type CardModuleHorizontalPhoto = CardModuleBase & {
  kind: typeof MODULE_KIND_HORIZONTAL_PHOTO;
  data: CardModuleHorizontalPhotoData;
};

export type CardModuleLineDivider = CardModuleBase & {
  kind: typeof MODULE_KIND_LINE_DIVIDER;
  data: CardModuleLineDividerData;
};

export type CardModuleSchedule = CardModuleBase & {
  kind: typeof MODULE_KIND_SCHEDULE;
  data: unknown;
};

export type CardModuleParrallax = CardModuleBase & {
  kind: typeof MODULE_KIND_PARALLAX;
  data: unknown;
};

export type CardModuleVideo = CardModuleBase & {
  kind: typeof MODULE_KIND_VIDEO;
  data: unknown;
};

export type CardModuleImageGrid = CardModuleBase & {
  kind: typeof MODULE_KIND_IMAGEGRID;
  data: unknown;
};

export type CardModulePhotoWithTextAndTitle = CardModuleBase & {
  kind: typeof MODULE_KIND_PHOTO_WITH_TEXT_AND_TITLE;
  data: CardModulePhotoWithTextAndTitleData;
};

export type CardModuleSimpleButton = CardModuleBase & {
  kind: typeof MODULE_KIND_SIMPLE_BUTTON;
  data: CardModuleSimpleButtonData;
};

export type CardModuleSimpleText = CardModuleBase & {
  kind: typeof MODULE_KIND_SIMPLE_TEXT | typeof MODULE_KIND_SIMPLE_TITLE;
  data: CardModuleSimpleTextData;
};

export type CardModuleSocialLinks = CardModuleBase & {
  kind: typeof MODULE_KIND_SOCIAL_LINKS;
  data: CardModuleSocialLinksData;
};

export type CardModuleWebCardsCarousel = CardModuleBase & {
  kind: typeof MODULE_KIND_WEB_CARDS_CAROUSEL;
  data: unknown;
};

export type CardModule =
  | CardModuleBlockText
  | CardModuleCarousel
  | CardModuleHorizontalPhoto
  | CardModuleImageGrid
  | CardModuleLineDivider
  | CardModuleParrallax
  | CardModulePhotoWithTextAndTitle
  | CardModuleSchedule
  | CardModuleSimpleButton
  | CardModuleSimpleText
  | CardModuleSocialLinks
  | CardModuleVideo
  | CardModuleWebCardsCarousel;

// #endregion

// #region CardStyle
export const CardStyleTable = cols.table('CardStyle', {
  id: cols.cuid('id').primaryKey().notNull().$defaultFn(createId),
  fontFamily: cols.defaultVarchar('fontFamily').notNull(),
  fontSize: cols.smallint('fontSize').notNull(),
  titleFontFamily: cols.defaultVarchar('titleFontFamily').notNull(),
  titleFontSize: cols.smallint('titleFontSize').notNull(),
  borderRadius: cols.smallint('borderRadius').notNull(),
  borderWidth: cols.smallint('borderWidth').notNull(),
  borderColor: cols.color('borderColor').notNull(),
  buttonColor: cols.color('buttonColor').notNull(),
  buttonRadius: cols.smallint('buttonRadius').notNull(),
  gap: cols.smallint('gap').notNull(),
  enabled: cols.boolean('enabled').default(true).notNull(),
});

export type CardStyle = InferSelectModel<typeof CardStyleTable>;
// #endregion

// #region CardTemplate
export const CardTemplateTable = cols.table('CardTemplate', {
  id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
  cardStyleId: cols.cuid('cardStyleId').notNull(),
  cardTemplateTypeId: cols.cuid('cardTemplateTypeId'),
  previewMediaId: cols.mediaId('previewMediaId'),
  modules: cols.json('modules').$type<CardModuleTemplate[]>().notNull(),
  businessEnabled: cols.boolean('businessEnabled').default(true).notNull(),
  personalEnabled: cols.boolean('personalEnabled').default(true).notNull(),
});

export type CardTemplate = InferSelectModel<typeof CardTemplateTable>;
export type CardModuleTemplate = Pick<CardModule, 'data' | 'kind'>;
// #endregion

// #region CardTemplateType
export const CardTemplateTypeTable = cols.table('CardTemplateType', {
  id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
  webCardCategoryId: cols.cuid('webCardCategoryId').notNull(),
  enabled: cols.boolean('enabled').default(true).notNull(),
});

export type CardTemplateType = InferSelectModel<typeof CardTemplateTypeTable>;
// #endregion

// #region ColorPalette
export const ColorPaletteTable = cols.table('ColorPalette', {
  id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
  primary: cols.color('primary').notNull(),
  dark: cols.color('dark').notNull(),
  light: cols.color('light').notNull(),
  enabled: cols.boolean('enabled').default(true).notNull(),
});

export type ColorPalette = InferSelectModel<typeof ColorPaletteTable>;
// #endregion

// #region CompanyActivity
export const CompanyActivityTable = cols.table('CompanyActivity', {
  id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
  cardTemplateTypeId: cols.cuid('cardTemplateTypeId'),
  companyActivityTypeId: cols.cuid('companyActivityTypeId'),
});

export const CompanyActivityTypeTable = cols.table('CompanyActivityType', {
  id: cols.cuid('id').primaryKey().notNull().$defaultFn(createId),
});

export const WebCardCategoryCompanyActivityTable = cols.table(
  'WebCardCategoryCompanyActivity',
  {
    webCardCategoryId: cols.cuid('categoryId').notNull(),
    companyActivityId: cols.cuid('companyActivityId').notNull(),
    order: cols.int('order').notNull(),
  },
  table => {
    return {
      pk: cols.primaryKey({
        columns: [table.companyActivityId, table.webCardCategoryId],
      }),
    };
  },
);

export type CompanyActivity = InferSelectModel<typeof CompanyActivityTable>;
export type CompanyActivityType = InferSelectModel<
  typeof CompanyActivityTypeTable
>;
// #endregion

// #region CoverTemplatePreview
export const CoverTemplatePreviewTable = cols.table(
  'CoverTemplatePreview',
  {
    mediaId: cols.mediaId('mediaId').notNull(),
    coverTemplateId: cols.cuid('coverTemplateId').notNull(),
    companyActivityId: cols.cuid('companyActivityId').notNull(),
  },
  table => {
    return {
      coverTemplatePreviewCoverTemplateIdCompanyActivityId: cols.primaryKey({
        columns: [table.coverTemplateId, table.companyActivityId],
      }),
    };
  },
);

export type CoverTemplatePreview = InferSelectModel<
  typeof CoverTemplatePreviewTable
>;
// #endregion

// #region CoverTemplate
export const CoverTemplateTable = cols.table('CoverTemplate', {
  id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
  name: cols.defaultVarchar('name').notNull(),
  order: cols.int('order').notNull().default(1),
  tags: cols.json('tags').$type<string[]>().notNull(),
  typeId: cols.cuid('typeId').notNull(),
  lottieId: cols.cuid('lottieId').notNull(),
  mediaCount: cols.int('mediaCount').notNull(),
  previewId: cols.cuid('previewId').notNull(),
  colorPaletteId: cols.cuid('colorPaletteId').notNull(),
  enabled: cols.boolean('enabled').default(true).notNull(),
  params: cols.json('params').$type<CoverTemplateParams>(),
  backgroundColor: cols.defaultVarchar('backgroundColor'),
});

export type CoverTextType = 'custom' | 'firstName' | 'mainName';

export type CoverText = {
  text: CoverTextType;
  customText?: string;
  fontFamily: string;
  color: string;
  fontSize: number;
  width: number;
  rotation: number;
  position: {
    x: number;
    y: number;
  };
  animation?: string;
  startPercentageTotal: number;
  endPercentageTotal: number;
};

export type CoverOverlay = {
  media?: {
    id?: string;
  };
  borderWidth: number;
  borderColor?: string;
  borderRadius: number;
  bounds: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
  filter?: string;
  rotation: number;
  animation?: string;
  startPercentageTotal: number;
  endPercentageTotal: number;
};

export type SocialLinks = {
  links: Array<string | undefined>;
  color: string;
  position: { x: number; y: number };
  size: number;
};

export type CoverTemplateParams = {
  textLayers: CoverText[];
  overlayLayers: CoverOverlay[];
  linksLayer: SocialLinks;
};

export type CoverTemplate = InferSelectModel<typeof CoverTemplateTable>;
// #endregion

// #region CoverTemplateTag
export const CoverTemplateTagTable = cols.table('CoverTemplateTag', {
  id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
  order: cols.int('order').notNull().default(0),
  enabled: cols.boolean('enabled').default(true).notNull(),
});

export type CoverTemplateTag = InferSelectModel<typeof CoverTemplateTagTable>;
// #endregion

//#region CoverTemplateType
export const CoverTemplateTypeTable = cols.table('CoverTemplateType', {
  id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
  order: cols.int('order').notNull().default(0),
  enabled: cols.boolean('enabled').default(true).notNull(),
});

export type CoverTemplateType = InferSelectModel<typeof CoverTemplateTypeTable>;
//#endregion

// #region Follows
export const FollowTable = cols.table(
  'Follow',
  {
    followerId: cols.cuid('followerId').notNull(),
    followingId: cols.cuid('followingId').notNull(),
    createdAt: cols
      .dateTime('createdAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),
  },
  table => {
    return {
      followFollowerIdFollowingId: cols.primaryKey({
        columns: [table.followerId, table.followingId],
      }),
      followingIdKey: cols
        .index('Follow_followingId_key')
        .on(table.followingId),
    };
  },
);

export type Follow = InferSelectModel<typeof FollowTable>;
//#endregion

// #region LocalizationMessage
export const LocalizationMessageTable = cols.table(
  'LocalizationMessage',
  {
    key: cols.defaultVarchar('key').notNull(),
    locale: cols.defaultVarchar('locale').notNull(),
    target: cols.defaultVarchar('target').notNull(),
    value: cols.text('value').notNull(),
  },
  table => {
    return {
      localizationMessageId: cols.primaryKey({
        columns: [table.key, table.locale, table.target],
      }),
      targetKey: cols.index('LocalizationMessage_key').on(table.target),
    };
  },
);

export type LocalizationMessage = InferSelectModel<
  typeof LocalizationMessageTable
>;
//#endregion

// #region Media
export const MediaTable = cols.table('Media', {
  id: cols.mediaId('id').notNull().primaryKey(),
  kind: cols.enum('kind', ['image', 'video']).notNull(),
  height: cols.double('height').notNull(),
  width: cols.double('width').notNull(),
  refCount: cols.int('refCount').default(0).notNull(),
  createdAt: cols
    .dateTime('createdAt')
    .notNull()
    .default(DEFAULT_DATETIME_VALUE),
});

export type Media = InferSelectModel<typeof MediaTable>;
//#endregion

// #region ModuleBackground
export const ModuleBackgroundTable = cols.table('ModuleBackground', {
  id: cols.mediaId('id').notNull().primaryKey(),
  resizeMode: cols
    .enum('resizeMode', ['cover', 'contain', 'center', 'repeat', 'stretch'])
    .default('cover'),
  order: cols.int('order').notNull(),
  enabled: cols.boolean('enabled').default(true).notNull(),
});

export type ModuleBackground = InferSelectModel<typeof ModuleBackgroundTable>;
//#endregion

// #region PaymentMean
export const PaymentMeanTable = cols.table(
  'PaymentMean',
  {
    id: cols.defaultVarchar('id').primaryKey().notNull(), //stored with payment
    userId: cols.cuid('userId').notNull(),
    webCardId: cols.defaultVarchar('webCardId').notNull(),
    maskedCard: cols.defaultVarchar('maskedCard').notNull(),
    status: cols
      .enum('status', ['pending', 'active', 'inactive'])
      .notNull()
      .default('pending'),
    createdAt: cols
      .dateTime('createdAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),
  },
  table => {
    return {
      indexes: {
        userId: cols
          .index('PaymentMean_userId_webCardId_idx')
          .on(table.userId, table.webCardId),
      },
    };
  },
);

export type PaymentMean = InferSelectModel<typeof PaymentMeanTable>;
//#endregion

// #region Payment
export const PaymentTable = cols.table(
  'Payment',
  {
    id: cols.cuid('id').primaryKey().notNull().$defaultFn(createId),
    amount: cols.int('amount').notNull(),
    taxes: cols.int('taxes').notNull(),
    currency: cols.defaultVarchar('currency').notNull().default('EUR'),
    status: cols.enum('status', ['paid', 'failed']).notNull(),
    paymentMeanId: cols.defaultVarchar('paymentMeanId').notNull(),
    rebillManagerId: cols.defaultVarchar('rebillManagerId'),
    transactionId: cols.defaultVarchar('transactionId'),
    paymentProviderResponse: cols.text('paymentProviderResponse'),
    createdAt: cols
      .dateTime('createdAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),
    updatedAt: cols
      .dateTime('updatedAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE)
      .$onUpdate(() => new Date()),
    invoiceId: cols.defaultVarchar('invoiceId'),
    invoicePdfUrl: cols.defaultVarchar('invoiceUrl'),
    subscriptionId: cols.cuid('subscriptionId').notNull(),
    webCardId: cols.cuid('webCardId').notNull(),
  },
  table => {
    return {
      subscriptionIdIdx: cols
        .index('subscriptionId_idx')
        .on(table.subscriptionId),
      webCardIdIdx: cols.index('webCardId_idx').on(table.webCardId),
    };
  },
);

export type Payment = InferSelectModel<typeof PaymentTable>;
//#endregion

// #region PostComment
export const PostCommentTable = cols.table(
  'PostComment',
  {
    id: cols.cuid('id').notNull().primaryKey().$defaultFn(createId),
    webCardId: cols.cuid('webCardId').notNull(),
    postId: cols.cuid('postId').notNull(),
    comment: cols.text('comment').notNull(),
    createdAt: cols
      .dateTime('createdAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),
    deleted: cols.boolean('deleted').notNull().default(false),
    deletedBy: cols.cuid('deletedBy'),
    deletedAt: cols.dateTime('deletedAt'),
  },
  table => {
    return {
      postIdIdx: cols.index('PostComment_postId_idx').on(table.postId),
    };
  },
);

export type PostComment = InferSelectModel<typeof PostCommentTable>;
//#endregion

// #region PostReaction
export const PostReactionTable = cols.table(
  'PostReaction',
  {
    webCardId: cols.cuid('webCardId').notNull(),
    postId: cols.cuid('postId').notNull(),
    reactionKind: cols.enum('reactionKind', ['like']).notNull(),
    createdAt: cols
      .dateTime('createdAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),
  },
  table => {
    return {
      // TODO : not sure about this one : do we want to support several reactions on the same post (like and dislike) ?
      // We could imagine to user the last one but do we need to keep an historic of reactions ?
      postReactionPostIdReactionKindProfileId: cols.primaryKey({
        columns: [table.postId, table.webCardId, table.reactionKind],
      }),
      webCardIdKey: cols
        .index('PostReaction_webCardId_key')
        .on(table.webCardId),
    };
  },
);

export type PostReaction = InferSelectModel<typeof PostReactionTable>;
//#endregion

// #region Post
export const PostTable = cols.table(
  'Post',
  {
    id: cols.cuid('id').primaryKey().notNull().$defaultFn(createId),
    webCardId: cols.cuid('webCardId').notNull(),
    content: cols.text('content'),
    allowComments: cols.boolean('allowComments').notNull(),
    allowLikes: cols.boolean('allowLikes').notNull(),
    medias: cols.json('medias').$type<string[]>().notNull(),
    counterReactions: cols.int('counterReactions').default(0).notNull(),
    counterComments: cols.int('counterComments').default(0).notNull(),
    createdAt: cols
      .dateTime('createdAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),
    updatedAt: cols
      .dateTime('updatedAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE)
      .$onUpdate(() => new Date()),
    deleted: cols.boolean('deleted').notNull().default(false),
    deletedBy: cols.cuid('deletedBy'),
    deletedAt: cols.dateTime('deletedAt'),
  },
  table => {
    return {
      authorIdIdx: cols.index('Post_webCardId_idx').on(table.webCardId),
    };
  },
);

export type Post = InferSelectModel<typeof PostTable>;
//#endregion

// #region Profile

export const ProfileTable = cols.table(
  'Profile',
  {
    id: cols.cuid('id').primaryKey().notNull().$defaultFn(createId),
    userId: cols.cuid('userId').notNull(),
    webCardId: cols.cuid('webCardId').notNull(),
    profileRole: cols
      .varchar('profileRole', {
        length: 6,
        enum: ['owner', 'admin', 'editor', 'user'],
      })
      .notNull()
      .default('owner'),
    invited: cols.boolean('invited').default(false).notNull(),
    invitedBy: cols.cuid('invitedBy'),
    inviteSent: cols.boolean('inviteSent').default(false).notNull(),
    promotedAsOwner: cols.boolean('promotedAsOwner').default(false).notNull(),
    avatarId: cols.mediaId('avatarId'),
    logoId: cols.mediaId('logoId'),
    /* Contact cards infos */
    contactCard: cols.json('contactCard').$type<ContactCard>(),
    contactCardIsPrivate: cols
      .boolean('contactCardIsPrivate')
      .default(true)
      .notNull(),
    contactCardDisplayedOnWebCard: cols
      .boolean('contactCardDisplayedOnWebCard')
      .default(false)
      .notNull(),
    createdAt: cols
      .dateTime('createdAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),
    lastContactCardUpdate: cols
      .dateTime('lastContactCardUpdate')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE)
      .$onUpdate(() => new Date()),
    nbContactCardScans: cols.int('nbContactCardScans').default(0).notNull(),
    deleted: cols.boolean('deleted').default(false).notNull(),
    deletedAt: cols.dateTime('deletedAt'),
    deletedBy: cols.cuid('deletedBy'),
  },
  table => {
    return {
      profileKey: cols
        .uniqueIndex('Profile_user_webcard_key')
        .on(table.userId, table.webCardId),
      webCardKey: cols
        .index('Profile_webCardId_key')
        .on(table.webCardId, table.profileRole),
      promotedAsOwnerKey: cols
        .index('Profile_promotedAsOwner_key')
        .on(table.webCardId, table.promotedAsOwner),
    };
  },
);

export type Profile = InferSelectModel<typeof ProfileTable>;
//#endregion

// #region ProfileStatistics
export const ProfileStatisticTable = cols.table(
  'ProfileStatistic',
  {
    profileId: cols.cuid('profileId').notNull(),
    day: cols.date('day').notNull(),
    contactCardScans: cols.int('contactCardScans').default(0).notNull(),
  },
  table => {
    return {
      id: cols.primaryKey({ columns: [table.profileId, table.day] }),
    };
  },
);

export type ProfileStatistic = InferSelectModel<typeof ProfileStatisticTable>;
//#endregion

// #region RedirectWebCard
export const RedirectWebCardTable = cols.table('RedirectWebCard', {
  fromUserName: cols.defaultVarchar('fromUserName').primaryKey().notNull(),
  toUserName: cols.defaultVarchar('toUserName').notNull(),
  createdAt: cols
    .dateTime('createdAt')
    .notNull()
    .default(DEFAULT_DATETIME_VALUE),
  expiresAt: cols
    .dateTime('expiresAt')
    .notNull()
    .default(DEFAULT_DATETIME_VALUE),
});

export type RedirectWebCard = InferSelectModel<typeof RedirectWebCardTable>;
//#endregion

// #region Report
export const ReportTable = cols.table(
  'Report',
  {
    targetId: cols.defaultVarchar('targetId').notNull(),
    userId: cols.defaultVarchar('userId').notNull(),
    targetType: cols
      .enum('targetType', ['webCard', 'post', 'comment'])
      .notNull(),
    createdAt: cols
      .dateTime('createdAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),
    treatedBy: cols.defaultVarchar('treatedBy'),
    treatedAt: cols.dateTime('treatedAt'),
  },
  table => {
    return {
      id: cols.primaryKey({
        columns: [table.targetId, table.userId, table.targetType],
      }),
      targetTypeKey: cols
        .index('Report_targetType_key')
        .on(table.targetType, table.createdAt, table.treatedBy),
    };
  },
);

export type Report = InferSelectModel<typeof ReportTable>;

export type ReportTargetType = Report['targetType'];
//#endregion

// #region Transaction
export const TransactionTable = cols.table(
  'Transaction',
  {
    id: cols.cuid('id').primaryKey().notNull().$defaultFn(createId),
    userId: cols.cuid('userId').notNull(),
    receipt: cols.json('receipt').$type<any>().notNull(), //TODO type to defined
    createdAt: cols.dateTime('createdAt').notNull(),
  },
  table => {
    return {
      userIdIdx: cols.index('Transaction_userId_idx').on(table.userId),
    };
  },
);

export type Transaction = InferSelectModel<typeof TransactionTable>;
//#endregion

// #region User

export const UserTable = cols.table(
  'User',
  {
    id: cols.cuid('id').primaryKey().$defaultFn(createId),
    email: cols.defaultVarchar('email'),
    password: cols.defaultVarchar('password'),
    phoneNumber: cols.defaultVarchar('phoneNumber'),
    createdAt: cols
      .dateTime('createdAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),
    updatedAt: cols
      .dateTime('updatedAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE)
      .$onUpdate(() => new Date()),
    roles: cols.json('roles').$type<string[]>(),
    invited: cols.boolean('invited').default(false).notNull(),
    locale: cols.defaultVarchar('locale'),
    emailConfirmed: cols.boolean('emailConfirmed').default(false).notNull(),
    phoneNumberConfirmed: cols
      .boolean('phoneNumberConfirmed')
      .default(false)
      .notNull(),
    deleted: cols.boolean('deleted').default(false).notNull(),
    deletedAt: cols.dateTime('deletedAt'),
    deletedBy: cols.cuid('deletedBy'),
    note: cols.text('note'),
  },
  table => {
    return {
      emailKey: cols.uniqueIndex('User_email_key').on(table.email),
      phoneNumberKey: cols
        .uniqueIndex('User_phoneNumber_key')
        .on(table.phoneNumber),
    };
  },
);
export type User = InferSelectModel<typeof UserTable>;
//#endregion

// #region UserSubscription
export const UserSubscriptionTable = cols.table(
  'UserSubscription',
  {
    id: cols.cuid('id').primaryKey().notNull().$defaultFn(createId),
    userId: cols.cuid('userId').notNull(),
    webCardId: cols.cuid('webCardId'),
    subscriptionId: cols.text('subscriptionId').notNull(),
    subscriptionPlan: cols.enum('subscriptionPlan', [
      'web.monthly',
      'web.yearly',
      'web.lifetime',
    ]),
    totalSeats: cols.int('totalSeats').default(0).notNull(),
    freeSeats: cols.int('freeSeats').default(0).notNull(),
    revenueCatId: cols.text('revenueCatId'),
    issuer: cols.enum('issuer', ['apple', 'google', 'web']).notNull(), //web should be user over revenue cat
    startAt: cols.dateTime('startAt').notNull(),
    endAt: cols.dateTime('endAt').notNull(),
    subscriberEmail: cols.defaultVarchar('subscriberEmail'),
    subscriberPhoneNumber: cols.defaultVarchar('subscriberPhoneNumber'),
    subscriberName: cols.defaultVarchar('subscriberName'),
    subscriberAddress: cols
      .defaultVarchar('subscriberAddress')
      .notNull()
      .default(''),
    subscriberVatNumber: cols.defaultVarchar('subscriberVatNumber'),
    subscriberZip: cols.defaultVarchar('subscriberZip'),
    subscriberCity: cols.defaultVarchar('subscriberCity'),
    subscriberCountry: cols.defaultVarchar('subscriberCountry'),
    subscriberCountryCode: cols.defaultVarchar('subscriberCountryCode'),
    paymentMeanId: cols.defaultVarchar('paymentMeanId'),
    amount: cols.int('amount'),
    taxes: cols.int('taxes'),
    rebillManagerId: cols.defaultVarchar('rebillManagerId'),
    status: cols
      .enum('status', ['active', 'canceled', 'waiting_payment'])
      .notNull()
      .default('active'),
    lastPaymentError: cols.boolean('lastPaymentError').default(false),
    canceledAt: cols.dateTime('canceledAt'),
    invalidatedAt: cols.dateTime('invalidatedAt'),
  },
  table => {
    return {
      userIdWebCardIDIdx: cols
        .index('userId_webCardId_idx')
        .on(table.userId, table.webCardId),
      statusExpirationDate: cols
        .index('status_expiration_date')
        .on(table.status, table.endAt, table.invalidatedAt),
    };
  },
);

export type UserSubscription = InferSelectModel<typeof UserSubscriptionTable>;
//#endregion

// #region WebCardCategory
export const WebCardCategoryTable = cols.table('WebCardCategory', {
  id: cols.cuid('id').primaryKey().notNull().$defaultFn(createId),
  webCardKind: cols.enum('webCardKind', ['personal', 'business']).notNull(),
  cardTemplateTypeId: cols.cuid('cardTemplateTypeId'),
  medias: cols.json('medias').$type<string[]>().notNull(),
  order: cols.int('order').notNull(),
  enabled: cols.boolean('enabled').default(true).notNull(),
});

export type WebCardCategory = InferSelectModel<typeof WebCardCategoryTable>;
//#endregion

// #region WebCard

export const WebCardTable = cols.table(
  'WebCard',
  {
    /* Profile infos */
    id: cols.cuid('id').primaryKey().notNull().$defaultFn(createId),
    userName: cols.defaultVarchar('userName').notNull(),
    lastUserNameUpdate: cols
      .dateTime('lastUserNameUpdate')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),
    webCardKind: cols.enum('webCardKind', ['personal', 'business']).notNull(),
    webCardCategoryId: cols.cuid('webCardCategoryId'),
    firstName: cols.defaultVarchar('firstName'),
    lastName: cols.defaultVarchar('lastName'),
    logoId: cols.mediaId('logoId'),
    commonInformation: cols
      .json('commonInformation')
      .$type<CommonInformation>(),
    companyName: cols.defaultVarchar('companyName'),
    companyActivityId: cols.cuid('companyActivityId'),
    createdAt: cols
      .dateTime('createdAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),
    updatedAt: cols
      .dateTime('updatedAt')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE)
      .$onUpdate(() => new Date()),
    isMultiUser: cols.boolean('isMultiUser').default(false).notNull(),

    /* Cards infos */
    locale: cols.defaultVarchar('locale'),
    cardColors: cols.json('cardColors').$type<{
      primary: string;
      light: string;
      dark: string;
      otherColors: string[];
    } | null>(),
    cardStyle: cols.json('cardStyle').$type<CardStyleData>(),
    cardIsPrivate: cols.boolean('cardIsPrivate').default(false).notNull(),
    cardIsPublished: cols.boolean('cardIsPublished').default(false).notNull(),
    alreadyPublished: cols.boolean('alreadyPublished').default(false).notNull(),
    lastCardUpdate: cols
      .dateTime('lastCardUpdate')
      .notNull()
      .default(DEFAULT_DATETIME_VALUE),

    /* Covers infos */
    coverId: cols.cuid('coverId').notNull().default(''), // this is used to identify that local cover is different from the last one
    coverMediaId: cols.mediaId('coverMediaId'),
    coverTexts: cols.json('coverTexts').$type<string[]>(),
    coverBackgroundColor: cols.defaultVarchar('coverBackgroundColor'),
    coverDynamicLinks: cols
      .json('coverDynamicLinks')
      .$type<CoverDynamicLinks>()
      .notNull()
      .default({
        links: [],
        color: '../000000',
        size: 24,
        position: {
          x: 0,
          y: 0,
        },
        rotation: 0,
        shadow: false,
      }),

    /* Social medias infos */
    nbFollowers: cols.int('nbFollowers').default(0).notNull(),
    nbFollowings: cols.int('nbFollowings').default(0).notNull(),
    nbPosts: cols.int('nbPosts').default(0).notNull(),
    nbPostsLiked: cols.int('nbPostsLiked').default(0).notNull(), // this is the informations postLiked
    nbLikes: cols.int('nbLikes').default(0).notNull(), //this is the stats TotalLikes (number of likes received)
    nbWebCardViews: cols.int('nbWebCardViews').default(0).notNull(),

    /* Deletion infos */
    deleted: cols.boolean('deleted').default(false).notNull(),
    deletedAt: cols.dateTime('deletedAt'),
    deletedBy: cols.cuid('deletedBy'),
  },
  table => {
    return {
      userNameKey: cols.uniqueIndex('WebCard_userName_key').on(table.userName),
      webCardSearch: cols.fulltextIndex('WebCard_search').on(table.userName),
    };
  },
);

export type WebCard = InferSelectModel<typeof WebCardTable>;

export type CoverDynamicLinks = {
  links: Array<{
    link: string;
    position: number;
    socialId: string;
  }>;
  color: string;
  size: number;
  position: {
    x: number;
    y: number;
  };
  rotation: number;
  shadow: boolean;
};
//#endregion

// #region WebCardStatistics
export const WebCardStatisticTable = cols.table(
  'WebCardStatistic',
  {
    webCardId: cols.cuid('webCardId').notNull(),
    day: cols.date('day').notNull(),
    webCardViews: cols.int('webCardViews').default(0).notNull(),
    likes: cols.int('likes').default(0).notNull(),
  },
  table => {
    return {
      id: cols.primaryKey({ columns: [table.webCardId, table.day] }),
    };
  },
);

export type WebCardStatistic = InferSelectModel<typeof WebCardStatisticTable>;
//#endregion
