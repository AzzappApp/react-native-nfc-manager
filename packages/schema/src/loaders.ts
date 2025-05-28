import ExpiryMap from 'expiry-map';
import {
  getEntitiesByIds,
  getLastProfileListStatisticsFor,
  getLastWebCardListStatisticsFor,
  getLocalizationMessagesByKeys,
  getWebCardsOwnerUsers,
  getCardModulesByWebCards,
  isFollowing,
  getContactsByUser,
  getUserSubscriptions,
  getContactCountPerOwner,
  getNbNewContactsForUser,
  getProfilesByUserAndWebCards,
  getContactEnrichmentByContactId,
  getContactEnrichmentsByContactIds,
} from '@azzapp/data';
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

export const cardStyleLoader = createDataLoader(
  createEntitiesBatchLoadFunction('CardStyle'),
);

export const cardTemplateLoader = createDataLoader(
  createEntitiesBatchLoadFunction('CardTemplate'),
);

export const cardTemplateTypeLoader = createDataLoader(
  createEntitiesBatchLoadFunction('CardTemplateType'),
);

export const colorPaletteLoader = createDataLoader(
  createEntitiesBatchLoadFunction('ColorPalette'),
);

export const coverTemplateLoader = createDataLoader(
  createEntitiesBatchLoadFunction('CoverTemplate'),
);

export const coverTemplateTypeLoader = createDataLoader(
  createEntitiesBatchLoadFunction('CoverTemplateType'),
);

export const mediaLoader = createDataLoader(
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

export const profileLoader = createSessionDataLoader(
  'ProfileLoader',
  createEntitiesBatchLoadFunction('Profile'),
);

export const webCardLoader = createSessionDataLoader(
  'WebCardLoader',
  createEntitiesBatchLoadFunction('WebCard'),
);

export const contactLoader = createSessionDataLoader(
  'ContactLoader',
  createEntitiesBatchLoadFunction('Contact'),
);

export const enrichmentByContactLoader = createSessionDataLoader(
  'ContactEnrichmentLoader',
  async (keys: readonly string[]) => {
    if (keys.length === 0) {
      return [];
    }
    if (keys.length === 1) {
      const enrichment = await getContactEnrichmentByContactId(keys[0]);
      return enrichment ? [enrichment] : [null];
    }
    return getContactEnrichmentsByContactIds(keys as string[]);
  },
);

export const moduleBackgroundLoader = createDataLoader(
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

export const cardModuleLoader = createSessionDataLoader(
  'CardModuleLoader',
  createEntitiesBatchLoadFunction('CardModule'),
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
  async (keys: ReadonlyArray<{ userId: string; webCardId: string }>) => {
    if (keys.length === 0) {
      return [];
    }
    return getProfilesByUserAndWebCards(
      keys.map(({ userId, webCardId }) => [userId, webCardId]),
    );
  },
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

export const profileInUserContactLoader = createSessionDataLoader(
  'ProfileInUserContactLoader',

  async (keys: ReadonlyArray<{ userId: string; profileId: string }>) => {
    const profileIdsByUser = keys.reduce(
      (accumulator, key) => {
        if (accumulator[key.userId]) {
          accumulator[key.userId].push(key.profileId);
        } else {
          accumulator[key.userId] = [key.profileId];
        }

        return accumulator;
      },
      {} as Record<string, string[]>,
    );

    const contacts = await Promise.all(
      Object.entries(profileIdsByUser).map(([userId, profileIds]) =>
        getContactsByUser(userId, profileIds),
      ),
    ).then(contactsByUsers => {
      return contactsByUsers.reduce(
        (accumulator, currentValue) => [...accumulator, ...currentValue],
        [],
      );
    });

    const contactsByProfile = contacts.reduce(
      (accumulator: Record<string, string>, currentValue) => {
        if (currentValue.profileId) {
          accumulator[currentValue.profileId] = currentValue.id;
        }

        return accumulator;
      },
      {},
    );

    return keys.map(({ profileId }) => contactsByProfile[profileId] || null);
  },
  {
    cacheKeyFn: key => `${key.userId}-${key.profileId}`,
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
          await getLocalizationMessagesByKeys(keys, locale),
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

export const subscriptionsForUserLoader = createSessionDataLoader(
  'subscriptionsForUserLoader',
  async (keys: readonly string[]) => {
    if (keys.length === 0) {
      return [];
    }

    const userSubscriptions = await getUserSubscriptions({
      userIds: keys as string[],
    });
    return keys.map(k => userSubscriptions.filter(u => u.userId === k) ?? null);
  },
);

export const contactCountForProfileLoader = createSessionDataLoader(
  'contactCountForProfileLoader',
  async (keys: readonly string[]) => {
    if (keys.length === 0) {
      return [];
    }

    const contacts = await getContactCountPerOwner(keys as string[]);
    return keys.map(
      k => contacts.find(u => u.ownerProfileId === k)?.count ?? 0,
    );
  },
);

export const newContactsCountForUserLoader = createSessionDataLoader(
  'newContactsCountForProfileLoader',
  async (keys: readonly string[]) => {
    if (keys.length === 0) {
      return [];
    }

    const count = await getNbNewContactsForUser(keys[0]);
    return [count];
  },
);
