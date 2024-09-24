import ExpiryMap from 'expiry-map';
import {
  getEntitiesByIds,
  getLastProfileListStatisticsFor,
  getLastWebCardListStatisticsFor,
  getLocalizationMessagesByKeys,
  getWebCardsOwnerUsers,
  getCardModulesByWebCards,
  activeUserSubscription,
  getActiveUserSubscriptionForWebCard,
  getProfileByUserAndWebCard,
  isFollowing,
} from '@azzapp/data';
import { ENTITY_TARGET } from '@azzapp/i18n';
import {
  createDataLoader,
  createSessionDataLoader,
} from '#helpers/dataLoadersHelpers';
import type {
  LocalizationMessage,
  CardModule,
  Entity,
  EntityToType,
} from '@azzapp/data';
import type DataLoader from 'dataloader';

export type EntityLoader = {
  [T in Entity]: DataLoader<string, EntityToType<T> | null>;
};

const createEntitiesBatchLoadFunction =
  <T extends Entity>(entity: T) =>
  (ids: readonly string[]) =>
    getEntitiesByIds(entity, ids);

export const cardModuleLoader = createSessionDataLoader(
  'CardModuleLoader',
  createEntitiesBatchLoadFunction('CardModule'),
);

export const cardStyleLoader = createSessionDataLoader(
  'CardStyleLoader',
  createEntitiesBatchLoadFunction('CardStyle'),
);

export const cardTemplateLoader = createSessionDataLoader(
  'CardTemplateLoader',
  createEntitiesBatchLoadFunction('CardTemplate'),
);

export const cardTemplateTypeLoader = createSessionDataLoader(
  'CardTemplateTypeLoader',
  createEntitiesBatchLoadFunction('CardTemplateType'),
);

export const colorPaletteLoader = createSessionDataLoader(
  'ColorPaletteLoader',
  createEntitiesBatchLoadFunction('ColorPalette'),
);

export const companyActivityLoader = createSessionDataLoader(
  'CompanyActivityLoader',
  createEntitiesBatchLoadFunction('CompanyActivity'),
);

export const companyActivityTypeLoader = createSessionDataLoader(
  'CompanyActivityTypeLoader',
  createEntitiesBatchLoadFunction('CompanyActivityType'),
);

export const coverTemplateLoader = createSessionDataLoader(
  'CoverTemplateLoader',
  createEntitiesBatchLoadFunction('CoverTemplate'),
);

export const coverTemplateTypeLoader = createSessionDataLoader(
  'CoverTemplateTypeLoader',
  createEntitiesBatchLoadFunction('CoverTemplateType'),
);

export const coverTemplateTagLoader = createSessionDataLoader(
  'CoverTemplateTagLoader',
  createEntitiesBatchLoadFunction('CoverTemplateTag'),
);

export const mediaLoader = createSessionDataLoader(
  'MediaLoader',
  createEntitiesBatchLoadFunction('Media'),
);

export const postCommentLoader = createSessionDataLoader(
  'PostCommentLoader',
  createEntitiesBatchLoadFunction('PostComment'),
);

export const postLoader = createSessionDataLoader(
  'PostLoader',
  createEntitiesBatchLoadFunction('Post'),
);

export const webCardCategoryLoader = createSessionDataLoader(
  'WebCardCategoryLoader',
  createEntitiesBatchLoadFunction('WebCardCategory'),
);

export const profileLoader = createSessionDataLoader(
  'ProfileLoader',
  createEntitiesBatchLoadFunction('Profile'),
);

export const webCardLoader = createSessionDataLoader(
  'WebCardLoader',
  createEntitiesBatchLoadFunction('WebCard'),
);

export const moduleBackgroundLoader = createSessionDataLoader(
  'ModuleBackgroundLoader',
  createEntitiesBatchLoadFunction('ModuleBackground'),
);

export const userLoader = createSessionDataLoader(
  'UserLoader',
  createEntitiesBatchLoadFunction('User'),
);

export const paymentLoader = createSessionDataLoader(
  'PaymentLoader',
  createEntitiesBatchLoadFunction('Payment'),
);

export const paymentMeanLoader = createSessionDataLoader(
  'PaymentMeanLoader',
  createEntitiesBatchLoadFunction('PaymentMean'),
);

export const webCardStatisticsLoader = createSessionDataLoader(
  'WebCardStatisticsLoader',
  async (keys: readonly string[]) => {
    const stats = await getLastWebCardListStatisticsFor(keys as string[], 30);
    return keys.map(key => stats[key] ?? []);
  },
);

export const profileStatisticsLoader = createSessionDataLoader(
  'ProfileStatisticsLoader',
  async (keys: readonly string[]) => {
    const stats = await getLastProfileListStatisticsFor(keys as string[], 30);
    return keys.map(key => stats[key] ?? []);
  },
);

export const webCardOwnerLoader = createSessionDataLoader(
  'WebCardOwnerLoader',
  async (keys: readonly string[]) => {
    return getWebCardsOwnerUsers(keys);
  },
);

export const profileByWebCardIdAndUserIdLoader = createSessionDataLoader(
  'ProfileByWebCardIdAndUserIdLoader',
  async (keys: ReadonlyArray<{ userId: string; webCardId: string }>) =>
    Promise.all(
      keys.map(key => getProfileByUserAndWebCard(key.userId, key.webCardId)),
    ),
  {
    cacheKeyFn: key => `${key.userId}-${key.webCardId}`,
  },
);

export const followingsLoader = createSessionDataLoader(
  'FollowingsLoader',
  async (keys: ReadonlyArray<[follower: string, following: string]>) => {
    return Promise.all(keys.map(key => isFollowing(key[0], key[1])));
  },
  {
    cacheKeyFn: key => key.join('-'),
  },
);

export const labelLoader = createDataLoader<
  [string, string],
  LocalizationMessage | null,
  string
>(
  async keys => {
    const labelsByLocale = keys.reduce(
      (acc, [id, locale]) => {
        if (!acc[locale]) {
          acc[locale] = [];
        }
        acc[locale].push(id);
        return acc;
      },
      {} as Record<string, string[]>,
    );
    const labelsWithLocale: Record<
      string,
      Array<LocalizationMessage | null>
    > = Object.fromEntries(
      await Promise.all(
        Object.entries(labelsByLocale).map(async ([locale, keys]) => [
          locale,
          await getLocalizationMessagesByKeys(keys, locale, ENTITY_TARGET),
        ]),
      ),
    );

    return keys.map(([key, locale]) => {
      return labelsWithLocale[locale].find(l => l?.key === key) ?? null;
    });
  },
  {
    cacheKeyFn: ([key, locale]) => `${key}-${locale}`,
    cacheMap: new ExpiryMap(1000 * 60 * 60), // 1 hour,
  },
);

export const cardModuleByWebCardLoader = createSessionDataLoader<
  string,
  CardModule[]
>('CardModuleByWebCardLoader', async keys => {
  if (keys.length === 0) {
    return [];
  }
  const modules = await getCardModulesByWebCards(keys as string[]);

  return keys.map(key => modules[key] ?? []);
});

export const activeSubscriptionsLoader = createSessionDataLoader(
  'ActiveSubscriptionsLoader',
  async (keys: readonly string[]) => {
    if (keys.length === 0) {
      return [];
    }
    const subscriptions = (
      await activeUserSubscription(keys as string[])
    ).filter(subscription => !!subscription);

    return keys.map(k =>
      subscriptions.filter(subscription => subscription.userId === k),
    );
  },
);

export const activeSubscriptionsForWebCardLoader = createSessionDataLoader(
  'ActiveSubscriptionsForWebCardLoader',
  async (keys: ReadonlyArray<{ userId: string; webCardId: string }>) => {
    if (keys.length === 0) {
      return [];
    }
    const webCardIds = keys.map(k => k.webCardId);
    const userIds = keys.map(k => k.userId);

    const userSubscriptions = await getActiveUserSubscriptionForWebCard(
      userIds,
      webCardIds,
    );

    return keys.map(
      k =>
        userSubscriptions.find(
          u =>
            (k.webCardId && u.webCardId === k.webCardId) ||
            u.userId === k.userId,
        ) ?? null,
    );
  },
  { cacheKeyFn: ({ userId, webCardId }) => `${userId}-${webCardId}` },
);
