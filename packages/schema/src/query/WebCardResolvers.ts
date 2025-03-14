import {
  connectionFromArraySlice,
  cursorToOffset,
  fromGlobalId,
} from 'graphql-relay';
import {
  getCompanyActivitiesByWebCardCategory,
  getWebCardPosts,
  getLikedPosts,
  getFollowerProfiles,
  getFollowingsWebCard,
  getFollowingsPosts,
  getWebCardProfiles,
  countWebCardProfiles,
  getWebCardPendingOwnerProfile,
  getLastSubscription,
  getFilterCoverTemplateTypes,
  getCoverTemplatesByTypesAndTag,
  countDeletedWebCardProfiles,
  searchContactsByWebcardId,
  getContactCountWithWebcardId,
  getAllOwnerProfilesByWebcardId,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { getPreviewVideoForModule } from '@azzapp/shared/cloudinaryHelpers';
import { profileHasAdminRight } from '@azzapp/shared/profileHelpers';
import { webCardRequiresSubscription } from '@azzapp/shared/subscriptionHelpers';
import { buildCoverAvatarUrl } from '#externals';
import { getSessionInfos } from '#GraphQLContext';
import {
  activeSubscriptionsForUserLoader,
  cardModuleByWebCardLoader,
  companyActivityLoader,
  companyActivityTypeLoader,
  followingsLoader,
  labelLoader,
  profileByWebCardIdAndUserIdLoader,
  webCardCategoryLoader,
  webCardOwnerLoader,
  webCardStatisticsLoader,
} from '#loaders';
import {
  connectionFromDateSortedItems,
  connectionFromSortedArray,
  cursorToDate,
  emptyConnection,
} from '#helpers/connectionsHelpers';
import { labelResolver } from '#helpers/localeHelpers';
import {
  getWebCardProfile,
  hasWebCardProfileRight,
  type ProtectedResolver,
} from '#helpers/permissionsHelpers';
import fromGlobalIdWithType, {
  idResolver,
  maybeFromGlobalIdWithType,
} from '#helpers/relayIdHelpers';
import type {
  CompanyActivityResolvers,
  CompanyActivityTypeResolvers,
  WebCardCategoryResolvers,
  WebCardResolvers,
} from '#/__generated__/types';

const getActivityName = async (companyActivityId: string, locale: string) => {
  const activity = companyActivityId
    ? await companyActivityLoader.load(companyActivityId)
    : null;
  const activityName = activity?.id
    ? ((await labelLoader.load([activity.id, locale])) ??
      (await labelLoader.load([activity.id, DEFAULT_LOCALE])))
    : null;
  return activityName?.value;
};

export const WebCard: ProtectedResolver<WebCardResolvers> = {
  id: idResolver('WebCard'),
  alreadyPublished: async webCard => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return false;
    }
    return webCard.alreadyPublished;
  },
  cardColors: webCard => webCard.cardColors,
  cardIsPrivate: async webCard => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return false;
    }
    return webCard.cardIsPrivate;
  },
  cardIsPublished: async webCard => webCard.cardIsPublished,
  cardStyle: webCard => webCard.cardStyle,
  commonInformation: async webCard => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return null;
    }
    return webCard.commonInformation;
  },
  companyName: async webCard => {
    if (
      !webCard.coverIsPredefined &&
      !(await hasWebCardProfileRight(webCard.id))
    ) {
      return null;
    }
    return webCard.companyName;
  },
  coverBackgroundColor: webCard => webCard.coverBackgroundColor,
  coverDynamicLinks: webCard => webCard.coverDynamicLinks,
  coverId: async webCard => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      //TODO: schema error the field was marked as non null
      // so we need to return a fake id, until we can change the schema
      return 'fake-cover-id';
    }
    return webCard.coverId;
  },
  coverTexts: webCard => webCard.coverTexts,
  firstName: async webCard => {
    if (
      !webCard.coverIsPredefined &&
      !(await hasWebCardProfileRight(webCard.id))
    ) {
      return null;
    }
    return webCard.firstName;
  },
  lastName: async webCard => {
    if (
      !webCard.coverIsPredefined &&
      !(await hasWebCardProfileRight(webCard.id))
    ) {
      return null;
    }
    return webCard.lastName;
  },
  lastUserNameUpdate: async webCard => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return null;
    }
    return webCard.lastUserNameUpdate;
  },
  isMultiUser: async webCard => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return false;
    }
    return webCard.isMultiUser;
  },
  nbPosts: webCard => webCard.nbPosts,
  locale: async webCard => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return null;
    }
    return webCard.locale;
  },
  nbFollowers: webCard => webCard.nbFollowers,
  nbFollowings: webCard => webCard.nbFollowings,
  nbLikes: async webCard => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return 0;
    }
    return webCard.nbLikes;
  },
  nbPostsLiked: async webCard => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return 0;
    }
    return webCard.nbPostsLiked;
  },
  nbWebCardViews: async webCard => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return 0;
    }
    return webCard.nbWebCardViews;
  },
  userName: webCard => webCard.userName || '',
  // TODO: should it be protected?
  webCardKind: webCard => webCard.webCardKind,
  // TODO: should it be protected?
  webCardCategory: async webCard => {
    return webCard.webCardCategoryId
      ? webCardCategoryLoader.load(webCard.webCardCategoryId)
      : null;
  },
  // TODO: should it be protected?
  companyActivity: async webCard => {
    return webCard.companyActivityId
      ? companyActivityLoader.load(webCard.companyActivityId)
      : null;
  },
  coverMedia: async (webCard, _) => {
    return webCard.coverMediaId
      ? {
          assetKind: 'cover',
          previewPositionPercentage: webCard.coverPreviewPositionPercentage,
          media: webCard.coverMediaId,
        }
      : null;
  },
  hasCover: webCard => !!webCard.coverMediaId,
  cardModules: async webCard => {
    const { userId } = getSessionInfos();
    const profile = userId
      ? await profileByWebCardIdAndUserIdLoader.load({
          userId,
          webCardId: webCard.id,
        })
      : null;

    if (!webCard.cardIsPublished && !profile) {
      return [];
    }

    const modules = await cardModuleByWebCardLoader.load(webCard.id);
    return modules.filter(module => module.visible || profile !== null);
  },
  requiresSubscription: async (webCard, { newWebCardKind }) => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return false;
    }

    return webCardRequiresSubscription({
      webCardKind: newWebCardKind ?? webCard.webCardKind,
      isMultiUser: webCard.isMultiUser,
    });
  },
  isWebSubscription: async webCard => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return false;
    }
    const owner = await webCardOwnerLoader.load(webCard.id);
    const subscriptions = owner
      ? await activeSubscriptionsForUserLoader.load(owner.id)
      : null;

    const subscription = subscriptions?.find(
      sub => sub.issuer === 'web' && sub.status === 'active',
    );

    return subscription != null;
  },
  isPremium: async webCard => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return false;
    }
    const owner = await webCardOwnerLoader.load(webCard.id);
    //cannot use the loader here (when IAP sub), can't find a way to for revalidation in api route.
    //Got a bug where the subscription is canceled however still active in the result set
    const subscriptions = owner
      ? await activeSubscriptionsForUserLoader.load(owner.id)
      : null;
    return !!subscriptions?.[0];
  },
  isFollowing: async (webCard, { webCardId: gqlWebCardId }) => {
    if (!gqlWebCardId) {
      return false;
    }
    const maybeFollowingWebCardId = maybeFromGlobalIdWithType(
      gqlWebCardId,
      'WebCard',
    );

    return maybeFollowingWebCardId
      ? followingsLoader.load([maybeFollowingWebCardId, webCard.id])
      : false;
  },
  posts: async (webCard, args) => {
    // TODO we should use a bookmark instead of offset, perhaps by using createdAt as a bookmark
    let { after, first } = args;
    after = after ?? null;
    first = first ?? 100;

    const offset = after ? cursorToOffset(after) : 0;
    return connectionFromArraySlice(
      await getWebCardPosts(webCard.id, first, offset),
      { after, first },
      {
        sliceStart: offset,
        arrayLength: webCard.nbPosts,
      },
    );
  },
  statsSummary: async webCard => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return null;
    }
    //get data for the last 30 day
    return webCardStatisticsLoader.load(webCard.id);
  },
  likedPosts: async (webCard, args) => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return emptyConnection;
    }
    const limit = args.first ?? 100;
    const offset = args.after ? cursorToDate(args.after) : null;
    const posts = await getLikedPosts(webCard.id, limit + 1, offset);
    const sizedPosts = posts.slice(0, limit);
    return connectionFromDateSortedItems(sizedPosts, {
      getDate: post => post.createdAt,
      hasNextPage: posts.length > limit,
      hasPreviousPage: offset !== null,
    });
  },
  owner: async webCard => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return null;
    }
    return webCardOwnerLoader.load(webCard.id);
  },
  followers: async (webCard, args) => {
    const first = args.first ?? 50;
    const offset = args.after ? cursorToDate(args.after) : null;

    const followersWebCard = await getFollowerProfiles(webCard.id, {
      limit: first + 1,
      after: offset,
      userName: args.userName,
    });
    const sizedWebCard = followersWebCard.slice(0, first);
    return connectionFromDateSortedItems(
      sizedWebCard.map(p => ({
        ...p.webCard,
        followCreatedAt: p.followCreatedAt,
      })),
      {
        getDate: post => post.followCreatedAt,
        // approximations that should be good enough, and avoid a query
        hasNextPage: followersWebCard.length > first,
        hasPreviousPage: offset !== null,
      },
    );
  },
  followings: async (webCard, args) => {
    const first = args.first ?? 50;
    const offset = args.after ? cursorToDate(args.after) : null;

    const followingsWebCard = await getFollowingsWebCard(webCard.id, {
      limit: first + 1,
      after: offset,
      userName: args.userName,
    });

    const sizedWebCard = followingsWebCard.slice(0, first);
    return connectionFromDateSortedItems(
      sizedWebCard.map(p => ({
        ...p.webCard,
        followCreatedAt: p.followCreatedAt,
      })),
      {
        getDate: follow => follow.followCreatedAt,
        // approximations that should be good enough, and avoid a query
        hasNextPage: followingsWebCard.length > first,
        hasPreviousPage: offset !== null,
      },
    );
  },
  followingsPosts: async (webCard, args) => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return emptyConnection;
    }
    const limit = args.first ?? 100;
    const offset = args.after ? cursorToDate(args.after) : null;

    const posts = await getFollowingsPosts(webCard.id, limit + 1, offset);

    return connectionFromDateSortedItems(posts.slice(0, limit), {
      getDate: post => post.createdAt,
      // approximations that should be good enough, and avoid a query
      hasNextPage: posts.length > limit,
      hasPreviousPage: offset !== null,
    });
  },
  nbProfiles: async (webCard, _) => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return 1;
    }
    return countWebCardProfiles(webCard.id);
  },
  nbDeletedProfiles: async (webCard, _) => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return 1;
    }
    return countDeletedWebCardProfiles(webCard.id);
  },
  profilePendingOwner: async webCard => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return null;
    }
    return getWebCardPendingOwnerProfile(webCard.id);
  },
  profiles: async (webCard, { first, after, search, withDeleted }) => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return emptyConnection;
    }
    const limit = first ?? 100;
    const offset = after ? cursorToOffset(after) : 0;
    const profiles = await getWebCardProfiles(webCard.id, {
      withDeleted,
      limit,
      after: offset,
      search: search ?? null, //cannot be undefined
    });
    const result = profiles.slice(0, limit);
    const count = await countWebCardProfiles(webCard.id, withDeleted);
    return connectionFromArraySlice(
      result,
      { after, first },
      {
        sliceStart: offset,
        arrayLength:
          //TODO: need to find a better way don't want to fetch all and slice after or
          // fetching the full size. maybe reproduce the connectionFromDateSortedItems
          count,
      },
    );
  },
  searchContacts: async (
    webCard,
    { first, after, search, withDeleted, ownerProfileId: oid },
  ) => {
    const ownerProfileId = oid ? fromGlobalIdWithType(oid, 'Profile') : oid;
    const webCardProfile = await getWebCardProfile(webCard.id);
    if (!webCardProfile || !profileHasAdminRight(webCardProfile.profileRole)) {
      return emptyConnection;
    }
    const limit = first ?? 100;
    const offset = after ? cursorToOffset(after) : 0;
    const result = await searchContactsByWebcardId({
      webcardId: webCard.id,
      limit,
      offset,
      search: search ?? null, //cannot be undefined
      ownerProfileId,
      withDeleted,
    });
    const contacts = result.contacts.slice(0, limit);
    return connectionFromArraySlice(
      contacts,
      { after, first },
      {
        sliceStart: offset,
        arrayLength: result.count,
      },
    );
  },
  nbContacts: async (webCard, { ownerProfileId }) => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return 1;
    }
    const oid = ownerProfileId
      ? fromGlobalIdWithType(ownerProfileId, 'Profile')
      : ownerProfileId;
    return getContactCountWithWebcardId(webCard.id, false, oid);
  },
  contactsOwnerPofiles: async (webCard, { withDeleted, ownerProfileId }) => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return [];
    }
    const oid = ownerProfileId
      ? fromGlobalIdWithType(ownerProfileId, 'Profile')
      : ownerProfileId;
    return getAllOwnerProfilesByWebcardId(webCard.id, !!withDeleted, oid);
  },
  nbDeletedContacts: async (webCard, { ownerProfileId }) => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return 1;
    }
    const oid = ownerProfileId
      ? fromGlobalIdWithType(ownerProfileId, 'Profile')
      : ownerProfileId;
    return getContactCountWithWebcardId(webCard.id, true, oid);
  },
  nextChangeUsernameAllowedAt: async webCard => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return null;
    }
    // Convert lastUpdate to a Date object
    const lastUpdateDate = new Date(webCard.lastUserNameUpdate);
    // Get the time MINIMUM_DAYS_BETWEEN_CHANGING_USERNAME days ago
    //TODO: update in case of premium/vip specific settings
    const nextChangeDate = new Date(lastUpdateDate);
    nextChangeDate.setDate(
      nextChangeDate.getDate() + USERNAME_CHANGE_FREQUENCY_DAY,
    );
    return nextChangeDate;
  },
  coverAvatarUrl: async webCard => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return null;
    }
    return buildCoverAvatarUrl(webCard);
  },
  updatedAt: async webCard => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return new Date().toISOString();
    }
    return webCard.updatedAt.toISOString();
  },
  subscription: async webCard => {
    const { userId } = getSessionInfos();
    if (!userId || !(await hasWebCardProfileRight(webCard.id))) {
      return null;
    }
    const owner = await webCardOwnerLoader.load(webCard.id);
    if (!owner) {
      return null;
    }

    const subscription = await getLastSubscription(owner.id);

    return subscription ?? null;
  },
  logo: async webCard =>
    webCard.logoId && (await hasWebCardProfileRight(webCard.id))
      ? {
          media: webCard.logoId,
          assetKind: 'logo',
        }
      : null,
  coverTemplateTypes: async (webCard, args) => {
    if (!(await hasWebCardProfileRight(webCard.id))) {
      return emptyConnection;
    }
    const limit = args.first ?? 10;
    const offset = args.after ? cursorToOffset(args.after) : 0;

    const tagId = args.tagId ? fromGlobalId(args.tagId).id : null;

    const coverTemplatesTypes = await getFilterCoverTemplateTypes(
      limit + 1,
      offset,
      tagId,
    );

    const coverTemplates = await getCoverTemplatesByTypesAndTag(
      coverTemplatesTypes.map(t => t.id),
      tagId,
      webCard.companyActivityId,
    );

    return connectionFromSortedArray(
      coverTemplatesTypes.map(type => ({
        ...type,
        coverTemplates: coverTemplates.filter(
          template => template.typeId === type.id,
        ),
      })),
      {
        offset,
        hasNextPage: coverTemplatesTypes.length > limit,
      },
    );
  },
  moduleVideoPreview: (_, args) => {
    return getPreviewVideoForModule({
      module: args.module,
      variant: args.variant,
      colorScheme: args.colorScheme,
      locale: args.locale,
      portraitHeight: args.portraitHeight,
      portraitWidth: args.portraitWidth,
      landscapeHeight: args.landscapeHeight,
      landscapeWidth: args.landscapeWidth,
      pixelRatio: args.pixelRatio,
    });
  },
  companyActivityLabel: async webCard => {
    if (webCard.companyActivityLabel && webCard.companyActivityLabel !== '') {
      return webCard.companyActivityLabel;
    } else if (webCard.companyActivityId) {
      const { locale } = getSessionInfos();
      const activityName = await getActivityName(
        webCard.companyActivityId,
        locale,
      );
      return activityName || null;
    }
    return null;
  },
  coverIsPredefined: async webCard => webCard.coverIsPredefined,
  coverIsLogoPredefined: async webCard => webCard.coverIsLogoPredefined,
};

export const WebCardCategory: WebCardCategoryResolvers = {
  id: idResolver('WebCardCategory'),
  label: labelResolver,
  medias: webCardCategory => webCardCategory.medias,
  companyActivities: async (webCardCategory, _) => {
    return getCompanyActivitiesByWebCardCategory(webCardCategory.id);
  },
};

export const CompanyActivity: CompanyActivityResolvers = {
  id: idResolver('CompanyActivity'),
  label: labelResolver,
  companyActivityType: async companyActivity => {
    return companyActivity.companyActivityTypeId
      ? companyActivityTypeLoader.load(companyActivity.companyActivityTypeId)
      : null;
  },
};

export const CompanyActivityType: CompanyActivityTypeResolvers = {
  id: idResolver('CompanyActivityType'),
  label: labelResolver,
};

const USERNAME_CHANGE_FREQUENCY_DAY = parseInt(
  process.env.USERNAME_CHANGE_FREQUENCY_DAY ?? '1',
  10,
);
