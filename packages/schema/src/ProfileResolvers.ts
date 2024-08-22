import {
  connectionFromArray,
  connectionFromArraySlice,
  cursorToOffset,
} from 'graphql-relay';
import { toString } from 'qrcode';
import {
  getColorPalettes,
  getCardTemplateTypes,
  getRecommendedWebCards,
  getCardStylesRandomOrder,
  getCoverTemplateTags,
  getCoverTemplateTypes,
  getModuleBackgrounds,
  searchPosts,
  searchWebCards,
  getCardTemplatesForWebCardKind,
} from '@azzapp/data';
import { shuffle } from '@azzapp/shared/arrayHelpers';
import { serializeContactCard } from '@azzapp/shared/contactCardHelpers';
import ERRORS from '@azzapp/shared/errors';
import serializeAndSignContactCard from '@azzapp/shared/serializeAndSignContactCard';
import { simpleHash } from '@azzapp/shared/stringHelpers';
import { buildUserUrlWithContactCard } from '@azzapp/shared/urlHelpers';
import {
  connectionFromDateSortedItems,
  cursorToDate,
  emptyConnection,
} from '#helpers/connectionsHelpers';
import { searchPexelsPhotos, searchPexelsVideos } from '#helpers/pexelsClient';
import { idResolver } from './utils';
import type { Loaders } from '#GraphQLContext';
import type { PexelsSearchResult } from '#helpers/pexelsClient';
import type { ProfileResolvers } from './__generated__/types';
import type { Photo, Video } from 'pexels';

export const Profile: ProfileResolvers = {
  id: idResolver('Profile'),
  user: async (userProfile, _, { loaders }) => {
    const user = await loaders.User.load(userProfile.userId);

    if (!user) throw new Error(ERRORS.GRAPHQL_ERROR);
    return user;
  },
  avatar: async profile =>
    profile.avatarId
      ? {
          media: profile.avatarId,
          assetKind: 'contactCard',
        }
      : null,
  logo: async profile =>
    profile.logoId
      ? {
          media: profile.logoId,
          assetKind: 'logo',
        }
      : null,
  statsSummary: async (profile, _args, { loaders }) => {
    //get data for the last 30 day
    return loaders.profileStatistics.load(profile.id);
  },
  serializedContactCard: async (profile, _, { loaders }) => {
    const webCard = await loaders.WebCard.load(profile.webCardId);
    return serializeContactCard(
      profile.id,
      profile.webCardId,
      profile.contactCard ?? {},
      webCard?.commonInformation,
    );
  },
  contactCardUrl: async (profile, _, { loaders }) => {
    const webCard = await loaders.WebCard.load(profile.webCardId);
    if (!webCard) throw new Error(ERRORS.GRAPHQL_ERROR);

    const { data, signature } = await serializeAndSignContactCard(
      webCard?.userName ?? '',
      profile.id,
      profile.webCardId,
      profile.contactCard ?? {},
      webCard?.commonInformation,
    );

    const url = buildUserUrlWithContactCard(
      webCard?.userName ?? '',
      data,
      signature,
    );

    return url;
  },
  contactCardQrCode: async (profile, { width }, { loaders }) => {
    const webCard = await loaders.WebCard.load(profile.webCardId);
    if (!webCard) throw new Error(ERRORS.GRAPHQL_ERROR);

    const { data, signature } = await serializeAndSignContactCard(
      webCard?.userName ?? '',
      profile.id,
      profile.webCardId,
      profile.contactCard ?? {},
      webCard?.commonInformation,
    );

    const url = buildUserUrlWithContactCard(
      webCard?.userName ?? '',
      data,
      signature,
    );

    const result = await toString(url, {
      errorCorrectionLevel: 'L',
      width,
      type: 'svg',
      color: {
        dark: '#000',
        light: '#0000',
      },
      margin: 0,
    });

    return result;
  },
  webCard: async (profile, _, { loaders }) => {
    const webCard = await loaders.WebCard.load(profile.webCardId);

    if (!webCard) throw new Error(ERRORS.GRAPHQL_ERROR);
    return webCard;
  },
  trendingWebCards: async (_, args) => {
    // TODO dummy implementation just to test frontend
    const first = args.first ?? 50;
    const offset = args.after ? cursorToDate(args.after) : null;
    const webCards = await searchWebCards({
      limit: first + 1,
      after: offset,
    });
    return connectionFromDateSortedItems(webCards, {
      getDate: card => card.createdAt,
      hasNextPage: webCards.length > first,
      hasPreviousPage: offset !== null,
    });
  },
  trendingPosts: async (_, args) => {
    // TODO dummy implementation just to test frontend
    const first = args.first ?? 50;
    const offset = args.after ? cursorToDate(args.after) : null;
    const webCards = await searchPosts({
      limit: first + 1,
      after: offset,
    });
    return connectionFromDateSortedItems(webCards, {
      getDate: card => card.createdAt,
      hasNextPage: webCards.length > first,
      hasPreviousPage: offset !== null,
    });
  },
  recommendedWebCards: async (
    profile,
    { ...args },
    { auth: { userId }, loaders },
  ) => {
    if (!userId || profile.userId !== userId) {
      return connectionFromArray([], args);
    }

    // TODO dummy implementation just to test frontend
    const recommendedWebCards = await getRecommendedWebCards(profile.webCardId);
    recommendedWebCards.forEach(webCard => {
      loaders.WebCard.prime(webCard.id, webCard);
    });

    return connectionFromArray(recommendedWebCards, args);
  },
  searchPosts: async (_, { first, after, search }) => {
    first = first ?? 50;
    const offset = after ? cursorToDate(after) : null;
    const posts = await searchPosts({
      limit: first + 1,
      after: offset,
      search,
    });
    return connectionFromDateSortedItems(posts, {
      getDate: card => card.createdAt,
      hasNextPage: posts.length > first,
      hasPreviousPage: offset !== null,
    });
  },
  searchWebCards: async (_, { first, after, search }) => {
    first = first ?? 50;
    const offset = after ? cursorToDate(after) : null;
    const webCards = await searchWebCards({
      limit: first + 1,
      after: offset,
      search,
    });
    return connectionFromDateSortedItems(webCards, {
      getDate: card => card.createdAt,
      hasNextPage: webCards.length > first,
      hasPreviousPage: offset !== null,
    });
  },
  moduleBackgrounds: async () => getModuleBackgrounds(),
  coverTemplateTags: () => {
    return getCoverTemplateTags();
  },
  coverTemplateTypes: () => {
    return getCoverTemplateTypes(true);
  },
  cardTemplates: async (
    profile,
    { cardTemplateTypeId, after, first },
    { auth: { userId }, loaders },
  ) => {
    const webCard = profile?.webCardId
      ? await loaders.WebCard.load(profile.webCardId)
      : null;
    if (!userId || profile.userId !== userId) {
      return emptyConnection;
    }
    let typeId = cardTemplateTypeId;
    if (cardTemplateTypeId == null) {
      if (webCard?.companyActivityId) {
        const compActivity = await loaders.CompanyActivity.load(
          webCard.companyActivityId,
        );
        if (compActivity) {
          typeId = compActivity.cardTemplateTypeId;
        }
      }
    }
    if (typeId == null) {
      if (webCard?.webCardCategoryId) {
        const webCardCategory = await loaders.WebCardCategory.load(
          webCard.webCardCategoryId,
        );
        if (webCardCategory) {
          typeId = webCardCategory.cardTemplateTypeId;
        }
      }
    }
    const limit = first ?? 20;
    const cardTemplates = await getCardTemplatesForWebCardKind(
      webCard?.webCardKind ?? 'business',
      typeId,
      profile.webCardId,
      after,
      limit + 1,
    );
    if (cardTemplates.length > 0) {
      const sizedCardTemplate = cardTemplates.slice(0, limit);
      return {
        edges: sizedCardTemplate.map(cardTemplate => ({
          node: cardTemplate,
          cursor: cardTemplate.cursor,
        })),
        pageInfo: {
          hasNextPage: cardTemplates.length > limit,
          hasPreviousPage: false,
          startCursor: cardTemplates[0]?.cursor,
          endCursor: sizedCardTemplate[sizedCardTemplate.length - 1].cursor,
        },
      };
    }
    return emptyConnection;
  },
  cardTemplateTypes: async () => getCardTemplateTypes(),
  cardStyles: async (profile, { after, first }, { auth: { userId } }) => {
    if (!userId || profile.userId !== userId) {
      return emptyConnection;
    }
    const limit = first ?? 100;
    const cardStyles = await getCardStylesRandomOrder(
      profile.id,
      after,
      limit + 1,
    );
    const sizedCardStyles = cardStyles.slice(0, limit);
    return {
      edges: sizedCardStyles.map(style => ({
        node: style,
        cursor: style.cursor,
      })),
      pageInfo: {
        hasNextPage: cardStyles.length > limit,
        hasPreviousPage: false,
        startCursor: cardStyles[0]?.cursor,
        endCursor: cardStyles[sizedCardStyles.length - 1].cursor,
      },
    };
  },
  colorPalettes: async (
    profile,
    { after, first },
    { auth: { userId }, sessionMemoized },
  ) => {
    if (!profile || !userId || profile.userId !== userId) {
      return emptyConnection;
    }
    first = first ?? 100;
    const colorPalettes = shuffle(
      await sessionMemoized(getColorPalettes),
      simpleHash(profile.id),
    );

    return connectionFromArray(colorPalettes, {
      after,
      first,
    });
  },

  searchStockPhotos: async (
    profile,
    { search, after, first },
    { auth: { userId }, loaders, locale },
  ) => {
    if (!profile || !userId || profile.userId !== userId) {
      return emptyConnection;
    }
    first = first ?? 50;
    const offset = after ? cursorToOffset(after) : 0;
    let result: PexelsSearchResult<Photo>;
    try {
      result = await searchPexelsPhotos(
        search ||
          (await getActivityName(profile.webCardId, locale, loaders)) ||
          null,
        locale,
        offset,
        first,
      );
    } catch (error) {
      console.warn('Error fetching photos from Pexels:', error);
      return emptyConnection;
    }
    const { data, count } = result;
    return connectionFromArraySlice(
      data.map(photo => ({
        id: `pexels_p_${photo.id}`,
        width: photo.width,
        height: photo.height,
        url: photo.src.original,
        author: photo.photographer,
        thumbnail: photo.src.small,
      })),
      { after, first },
      {
        sliceStart: offset + 1,
        arrayLength: count ?? Infinity,
      },
    );
  },

  searchStockVideos: async (
    profile,
    { search, after, first },
    { auth: { userId }, loaders, locale },
  ) => {
    if (!profile || !userId || profile.userId !== userId) {
      return emptyConnection;
    }
    first = first ?? 50;
    const offset = after ? cursorToOffset(after) : 0;
    let result: PexelsSearchResult<Video>;
    try {
      result = await searchPexelsVideos(
        search ||
          (await getActivityName(profile.webCardId, locale, loaders)) ||
          null,
        locale,
        offset,
        first,
      );
    } catch (error) {
      console.warn('Error fetching photos from Pexels:', error);
      return emptyConnection;
    }
    const { data, count } = result;
    return connectionFromArraySlice(
      data.map(video => {
        const videoFile = video.video_files.find(
          ({ quality, width, height }) =>
            quality === 'hd' && width != null && height != null,
        );

        return {
          id: `pexels_v_${video.id}`,
          width: videoFile ? videoFile.width! : video.width,
          height: videoFile ? videoFile.height! : video.height,
          url: videoFile ? videoFile.link : video.url,
          duration: video.duration,
          thumbnail: video.image,
        };
      }),
      { after, first },
      {
        sliceStart: offset + 1,
        arrayLength: count ?? Infinity,
      },
    );
  },
};

const getActivityName = async (
  webCardId: string,
  locale: string,
  loaders: Loaders,
) => {
  const webcard = await loaders.WebCard.load(webCardId);
  const activity = webcard?.companyActivityId
    ? await loaders.CompanyActivity.load(webcard.companyActivityId)
    : null;
  const activityName = activity?.id
    ? await loaders.labels.load([activity.id, locale])
    : null;
  return activityName?.value;
};
