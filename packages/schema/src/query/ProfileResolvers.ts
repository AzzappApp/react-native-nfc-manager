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
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { shuffle } from '@azzapp/shared/arrayHelpers';
import { serializeContactCard } from '@azzapp/shared/contactCardHelpers';
import ERRORS from '@azzapp/shared/errors';
import serializeAndSignContactCard from '@azzapp/shared/serializeAndSignContactCard';
import { simpleHash } from '@azzapp/shared/stringHelpers';
import {
  buildUserUrl,
  buildUserUrlWithContactCard,
} from '@azzapp/shared/urlHelpers';
import { getOrCreateSessionResource, getSessionInfos } from '#GraphQLContext';
import {
  companyActivityLoader,
  labelLoader,
  profileLoader,
  profileStatisticsLoader,
  userLoader,
  webCardCategoryLoader,
  webCardLoader,
} from '#loaders';
import {
  connectionFromDateSortedItems,
  cursorToDate,
  emptyConnection,
} from '#helpers/connectionsHelpers';
import {
  hasWebCardProfileRight,
  type ProtectedResolver,
} from '#helpers/permissionsHelpers';
import { searchPexelsPhotos, searchPexelsVideos } from '#helpers/pexelsClient';
import { idResolver } from '#helpers/relayIdHelpers';
import type { ProfileResolvers } from '#/__generated__/types';
import type { PexelsSearchResult } from '#helpers/pexelsClient';
import type { Profile, User } from '@azzapp/data';
import type { Photo, Video } from 'pexels';

const profileIsAssociatedToCurrentUser = (profile: Profile) => {
  const { userId } = getSessionInfos();
  return profile.userId === userId;
};

const ProfileResolverImpl: ProtectedResolver<ProfileResolvers> = {
  id: idResolver('Profile'),
  profileRole: async profile => {
    if (
      !profileIsAssociatedToCurrentUser(profile) &&
      !(await hasWebCardProfileRight(profile.webCardId))
    ) {
      return 'user';
    }
    return profile.profileRole;
  },
  invited: async profile => {
    if (
      !profileIsAssociatedToCurrentUser(profile) &&
      !(await hasWebCardProfileRight(profile.webCardId))
    ) {
      return false;
    }
    return profile.invited;
  },
  contactCard: async profile => {
    if (
      !profileIsAssociatedToCurrentUser(profile) &&
      !(await hasWebCardProfileRight(profile.webCardId))
    ) {
      return null;
    }
    return profile.contactCard;
  },
  contactCardDisplayedOnWebCard: async profile => {
    if (!profileIsAssociatedToCurrentUser(profile)) {
      return false;
    }
    return profile.contactCardDisplayedOnWebCard;
  },
  contactCardIsPrivate: async profile => {
    if (!profileIsAssociatedToCurrentUser(profile)) {
      return true;
    }
    return profile.contactCardIsPrivate;
  },
  inviteSent: async profile => {
    if (
      !profileIsAssociatedToCurrentUser(profile) &&
      !(await hasWebCardProfileRight(profile.webCardId))
    ) {
      return false;
    }
    return profile.inviteSent;
  },
  lastContactCardUpdate: async profile => {
    if (!profileIsAssociatedToCurrentUser(profile)) {
      return null;
    }
    return profile.lastContactCardUpdate;
  },
  nbContactCardScans: async profile => {
    if (
      !profileIsAssociatedToCurrentUser(profile) &&
      !(await hasWebCardProfileRight(profile.webCardId))
    ) {
      return null;
    }
    return profile.nbContactCardScans;
  },
  promotedAsOwner: async profile => {
    if (
      !profileIsAssociatedToCurrentUser(profile) &&
      !(await hasWebCardProfileRight(profile.webCardId))
    ) {
      return false;
    }
    return profile.promotedAsOwner;
  },
  user: async profile => {
    if (
      !profileIsAssociatedToCurrentUser(profile) &&
      !(await hasWebCardProfileRight(profile.webCardId))
    ) {
      // TODO schema error, the field should be nullable, but it's not until we
      // can change the schema, we return a fake user here
      return {
        id: profile.userId,
        ...fakeUser,
      };
    }
    const user = await userLoader.load(profile.userId);
    if (!user) {
      // TODO schema error, the field should be nullable, but it's not until we
      // can change the schema, we return a fake user here
      return {
        id: profile.userId,
        ...fakeUser,
      };
    }
    return user;
  },
  avatar: async profile => {
    if (
      !profileIsAssociatedToCurrentUser(profile) &&
      !(await hasWebCardProfileRight(profile.webCardId))
    ) {
      return null;
    }
    return profile.avatarId
      ? {
          media: profile.avatarId,
          assetKind: 'contactCard',
        }
      : null;
  },
  logo: async profile => {
    if (
      !profileIsAssociatedToCurrentUser(profile) &&
      !(await hasWebCardProfileRight(profile.webCardId))
    ) {
      return null;
    }
    return profile.logoId
      ? {
          media: profile.logoId,
          assetKind: 'logo',
        }
      : null;
  },

  statsSummary: async profile => {
    if (
      !profileIsAssociatedToCurrentUser(profile) &&
      !(await hasWebCardProfileRight(profile.webCardId))
    ) {
      return null;
    }
    //get data for the last 30 day
    return profileStatisticsLoader.load(profile.id);
  },
  invitedBy: async profile => {
    if (
      !profile.invitedBy ||
      (!profileIsAssociatedToCurrentUser(profile) &&
        !(await hasWebCardProfileRight(profile.webCardId)))
    ) {
      return null;
    }
    return profileLoader.load(profile.invitedBy);
  },
  serializedContactCard: async profile => {
    if (!profileIsAssociatedToCurrentUser(profile)) {
      return '';
    }
    const webCard = await webCardLoader.load(profile.webCardId);
    return serializeContactCard(
      profile.id,
      profile.webCardId,
      profile.contactCard ?? {},
      webCard?.commonInformation,
    );
  },
  contactCardUrl: async profile => {
    return getContactCardUrl(profile);
  },
  contactCardQrCode: async (profile, { width }) => {
    const result = await toString(await getContactCardUrl(profile), {
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
  webCard: async profile => {
    if (
      !profileIsAssociatedToCurrentUser(profile) &&
      !(await hasWebCardProfileRight(profile.webCardId))
    ) {
      // TODO schema error, the field should be nullable, but it's not until we
      // can change the schema, we throw an error here
      throw new Error(ERRORS.GRAPHQL_ERROR);
    }
    return webCardLoader.load(profile.webCardId);
  },
  suggestedWebCards: async () => {
    return emptyConnection;
  },
  trendingWebCards: async (profile, args) => {
    if (!profileIsAssociatedToCurrentUser(profile)) {
      return emptyConnection;
    }
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
  trendingPosts: async (profile, args) => {
    if (!profileIsAssociatedToCurrentUser(profile)) {
      return emptyConnection;
    }
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
  recommendedWebCards: async (profile, { ...args }) => {
    if (!profileIsAssociatedToCurrentUser(profile)) {
      return emptyConnection;
    }
    const { userId } = getSessionInfos();
    if (!userId || profile.userId !== userId) {
      return connectionFromArray([], args);
    }

    // TODO dummy implementation just to test frontend
    const recommendedWebCards = await getRecommendedWebCards(profile.webCardId);
    recommendedWebCards.forEach(webCard => {
      webCardLoader.prime(webCard.id, webCard);
    });

    return connectionFromArray(recommendedWebCards, args);
  },
  searchPosts: async (profile, { first, after, search }) => {
    if (!profileIsAssociatedToCurrentUser(profile)) {
      return emptyConnection;
    }
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
  searchWebCards: async (profile, { first, after, search }) => {
    if (!profileIsAssociatedToCurrentUser(profile)) {
      return emptyConnection;
    }
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
  moduleBackgrounds: async profile => {
    if (!profileIsAssociatedToCurrentUser(profile)) {
      return [];
    }
    return getModuleBackgrounds();
  },
  coverTemplateTags: profile => {
    if (!profileIsAssociatedToCurrentUser(profile)) {
      return [];
    }
    return getCoverTemplateTags(true);
  },
  coverTemplateTypes: profile => {
    if (!profileIsAssociatedToCurrentUser(profile)) {
      return [];
    }
    return getCoverTemplateTypes(true);
  },
  cardTemplates: async (profile, { cardTemplateTypeId, after, first }) => {
    if (!profileIsAssociatedToCurrentUser(profile)) {
      return emptyConnection;
    }
    const { userId } = getSessionInfos();
    if (profile.userId !== userId) {
      return emptyConnection;
    }
    const webCard = profile?.webCardId
      ? await webCardLoader.load(profile.webCardId)
      : null;
    let typeId = cardTemplateTypeId;
    if (cardTemplateTypeId == null) {
      if (webCard?.companyActivityId) {
        const compActivity = await companyActivityLoader.load(
          webCard.companyActivityId,
        );
        if (compActivity) {
          typeId = compActivity.cardTemplateTypeId;
        }
      }
    }
    if (typeId == null) {
      if (webCard?.webCardCategoryId) {
        const webCardCategory = await webCardCategoryLoader.load(
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
  cardTemplateTypes: async profile => {
    if (!profileIsAssociatedToCurrentUser(profile)) {
      return [];
    }
    return getCardTemplateTypes();
  },
  cardStyles: async (profile, { after, first }) => {
    if (!profileIsAssociatedToCurrentUser(profile)) {
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
  colorPalettes: async (profile, { after, first }) => {
    if (!profileIsAssociatedToCurrentUser(profile)) {
      return emptyConnection;
    }
    first = first ?? 100;
    const colorPalettes = shuffle(
      await getOrCreateSessionResource(
        'profileColorPalettes',
        getColorPalettes,
      ),
      simpleHash(profile.id),
    );

    return connectionFromArray(colorPalettes, {
      after,
      first,
    });
  },
  searchStockPhotos: async (profile, { search, after, first }) => {
    if (!profileIsAssociatedToCurrentUser(profile)) {
      return emptyConnection;
    }
    const { locale } = getSessionInfos();
    first = first ?? 50;
    const offset = after ? cursorToOffset(after) : 0;
    let result: PexelsSearchResult<Photo>;
    try {
      result = await searchPexelsPhotos(
        search || (await getActivityName(profile.webCardId, locale)) || null,
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
  searchStockVideos: async (profile, { search, after, first }) => {
    if (!profileIsAssociatedToCurrentUser(profile)) {
      return emptyConnection;
    }
    const { locale } = getSessionInfos();
    first = first ?? 50;
    const offset = after ? cursorToOffset(after) : 0;
    let result: PexelsSearchResult<Video>;
    try {
      result = await searchPexelsVideos(
        search || (await getActivityName(profile.webCardId, locale)) || null,
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

export { ProfileResolverImpl as Profile };

const getActivityName = async (webCardId: string, locale: string) => {
  const webcard = await webCardLoader.load(webCardId);
  const activity = webcard?.companyActivityId
    ? await companyActivityLoader.load(webcard.companyActivityId)
    : null;
  const activityName = activity?.id
    ? (await labelLoader.load([activity.id, locale])) ??
      (await labelLoader.load([activity.id, DEFAULT_LOCALE]))
    : null;
  return activityName?.value;
};

const getContactCardUrl = async (profile: Profile) => {
  const webCard = await webCardLoader.load(profile.webCardId);
  if (!webCard) {
    return process.env.NEXT_PUBLIC_URL!;
  }
  if (!profileIsAssociatedToCurrentUser(profile)) {
    return buildUserUrl(webCard.userName);
  }
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
};

const fakeUser: Omit<User, 'id'> = {
  createdAt: new Date(),
  deletedAt: null,
  email: null,
  phoneNumber: null,
  roles: [],
  updatedAt: new Date(),
  deleted: false,
  deletedBy: null,
  emailConfirmed: false,
  phoneNumberConfirmed: false,
  invited: false,
  locale: DEFAULT_LOCALE,
  note: null,
  password: null,
};
