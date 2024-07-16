import {
  connectionFromArray,
  connectionFromArraySlice,
  cursorToOffset,
} from 'graphql-relay';
import {
  getCompanyActivitiesByWebCardCategory,
  getWebCardPosts,
  isFollowing,
  getLikedPosts,
  getFollowerProfiles,
  getFollowingsWebCard,
  getFollowingsPosts,
  getWebCardProfiles,
  countWebCardProfiles,
  getWebCardPendingOwnerProfile,
  getActivePaymentMeans,
  getWebCardPayments,
  getLastSubscription,
  getFilterCoverTemplateTypes,
  getCoverTemplatesByTypesAndTag,
} from '@azzapp/data';
import { webCardRequiresSubscription } from '@azzapp/shared/subscriptionHelpers';
import {
  connectionFromDateSortedItems,
  cursorToDate,
} from '#helpers/connectionsHelpers';
import { maybeFromGlobalIdWithType } from '#helpers/relayIdHelpers';
import { getLabel, idResolver } from './utils';
import type {
  CompanyActivityResolvers,
  CompanyActivityTypeResolvers,
  WebCardCategoryResolvers,
  WebCardResolvers,
} from './__generated__/types';

export const WebCard: WebCardResolvers = {
  id: idResolver('WebCard'),
  webCardCategory: async (webCard, _, { loaders }) => {
    return webCard.webCardCategoryId
      ? loaders.WebCardCategory.load(webCard.webCardCategoryId)
      : null;
  },
  companyActivity: async (webCard, _, { loaders }) => {
    return webCard.companyActivityId
      ? loaders.CompanyActivity.load(webCard.companyActivityId)
      : null;
  },
  coverMedia: async (webCard, _) => {
    return webCard.coverMediaId
      ? {
          assetKind: 'cover',
          media: webCard.coverMediaId,
        }
      : null;
  },
  hasCover: webCard => !!webCard.coverMediaId,
  cardModules: async (webCard, _, { auth, loaders }) => {
    const profile = auth.userId
      ? await loaders.profileByWebCardIdAndUserId.load({
          userId: auth.userId,
          webCardId: webCard.id,
        })
      : null;

    if (!webCard.cardIsPublished && !profile) {
      return [];
    }

    const modules = await loaders.cardModuleByWebCardLoader.load(webCard.id);
    return modules.filter(module => module.visible || profile !== null);
  },
  requiresSubscription: async (webCard, { newWebCardKind }, { loaders }) => {
    const modules = await loaders.cardModuleByWebCardLoader.load(webCard.id);

    return webCardRequiresSubscription(
      modules,
      newWebCardKind ?? webCard.webCardKind,
    );
  },
  isWebSubscription: async (webCard, _, { loaders }) => {
    const owner = await loaders.webCardOwners.load(webCard.id);
    const subscriptions = owner
      ? await loaders.activeSubscriptionsLoader.load(owner.id)
      : null;
    const isWebSubscription = subscriptions?.some(
      subscription =>
        subscription.issuer === 'web' && subscription.status === 'active',
    );
    return isWebSubscription ?? false;
  },
  isPremium: async (webCard, _, { loaders }) => {
    const owner = await loaders.webCardOwners.load(webCard.id);

    const subscription = owner
      ? await loaders.activeSubscriptionsLoader.load(owner.id)
      : null;

    return !!subscription?.length;
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
      ? isFollowing(maybeFollowingWebCardId, webCard.id)
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
  statsSummary: async (webCard, _args, { loaders }) => {
    //get data for the last 30 day
    return loaders.webCardStatistics.load(webCard.id);
  },
  likedPosts: async (webCard, args) => {
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
  owner: async (webCard, _args, { loaders }) => {
    return loaders.webCardOwners.load(webCard.id);
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
    const count = await countWebCardProfiles(webCard.id);
    return count;
  },
  profilePendingOwner: async webCard => {
    const pendingUser = await getWebCardPendingOwnerProfile(webCard.id);
    return pendingUser.length > 0 ? pendingUser[0] : null;
  },
  profiles: async (webCard, { first, after, search }) => {
    const limit = first ?? 100;
    const offset = after ? cursorToOffset(after) : 0;
    const profiles = await getWebCardProfiles(webCard.id, {
      limit,
      after: offset,
      search: search ?? null, //cannot be undefined
    });
    const result = profiles.slice(0, limit);
    const count = await countWebCardProfiles(webCard.id);
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
  nextChangeUsernameAllowedAt: async webCard => {
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
  coverAvatarUrl: async (webCard, _args, { buildCoverAvatarUrl }) => {
    return buildCoverAvatarUrl(webCard);
  },
  updatedAt: webCard => webCard.updatedAt.toISOString(),
  subscription: async (webCard, _, { auth }) => {
    if (!auth.userId) {
      return null;
    }

    const subscription = await getLastSubscription(auth.userId, webCard.id);

    return subscription ?? null;
  },
  paymentMeans: async (webCard, _args, { auth }) => {
    if (!auth.userId) {
      return null;
    }

    return getActivePaymentMeans(auth.userId, webCard.id);
  },
  payments: async (webCard, args) => {
    let { after, first } = args;
    after = after ?? null;
    first = first ?? 100;

    const offset = after ? cursorToOffset(after) : 0;

    return connectionFromArraySlice(
      await getWebCardPayments(webCard.id, first, offset),
      { after, first },
      {
        sliceStart: offset,
        arrayLength: await countWebCardProfiles(webCard.id),
      },
    );
  },
  logo: async webCard =>
    webCard.logoId
      ? {
          media: webCard.logoId,
          assetKind: 'logo',
        }
      : null,
  coverTemplateTypes: async (webCard, args) => {
    const limit = args.first ?? 10;
    const offset = args.after ? cursorToOffset(args.after) : 0;
    const coverTemplatesTypes = await getFilterCoverTemplateTypes(
      limit + 1,
      offset,
      args.tagId,
    );
    const coverTemplates = await getCoverTemplatesByTypesAndTag(
      coverTemplatesTypes.map(t => t.id),
      args.tagId,
      webCard.companyActivityId,
    );

    return connectionFromArray(
      coverTemplatesTypes.map(type => ({
        ...type,
        coverTemplates: coverTemplates.filter(
          template => template.typeId === type.id,
        ),
      })),
      { after: args.after, first: args.first },
    );
  },
};

export const WebCardCategory: WebCardCategoryResolvers = {
  id: idResolver('WebCardCategory'),
  label: getLabel,
  medias: webCardCategory => webCardCategory.medias,
  companyActivities: async (webCardCategory, _) => {
    return getCompanyActivitiesByWebCardCategory(webCardCategory.id);
  },
};

export const CompanyActivity: CompanyActivityResolvers = {
  id: idResolver('CompanyActivity'),
  label: getLabel,
  companyActivityType: async (companyActivity, _, { loaders }) => {
    return companyActivity.companyActivityTypeId
      ? loaders.CompanyActivityType.load(companyActivity.companyActivityTypeId)
      : null;
  },
};

export const CompanyActivityType: CompanyActivityTypeResolvers = {
  id: idResolver('CompanyActivityType'),
  label: getLabel,
};

const USERNAME_CHANGE_FREQUENCY_DAY = parseInt(
  process.env.USERNAME_CHANGE_FREQUENCY_DAY ?? '1',
  10,
);
