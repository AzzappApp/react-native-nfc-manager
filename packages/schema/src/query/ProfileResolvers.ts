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
  searchContacts,
  getContactCount,
  getNbNewContacts,
} from '@azzapp/data';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import { shuffle } from '@azzapp/shared/arrayHelpers';
import { serializeContactCard } from '@azzapp/shared/contactCardHelpers';
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
  profileInUserContactLoader,
  profileLoader,
  profileStatisticsLoader,
  userLoader,
  webCardLoader,
} from '#loaders';
import {
  connectionFromDateSortedItems,
  connectionFromSortedArray,
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
import type { WebCardKind } from '@azzapp/shared/webCardKind';
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
  createdAt: async profile => {
    if (!profileIsAssociatedToCurrentUser(profile)) {
      return null;
    }
    return profile.createdAt;
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
  nbShareBacks: async profile => {
    if (
      !profileIsAssociatedToCurrentUser(profile) &&
      !(await hasWebCardProfileRight(profile.webCardId))
    ) {
      return null;
    }
    return profile.nbShareBacks;
  },
  nbNewContacts: async profile => {
    if (
      !profileIsAssociatedToCurrentUser(profile) &&
      !(await hasWebCardProfileRight(profile.webCardId))
    ) {
      return 0;
    }
    // profile.lastContactCardUpdate;
    const nbNewContacts = await getNbNewContacts(
      profile.id,
      profile.lastContactViewAt,
    );
    return nbNewContacts;
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
    const { userId } = getSessionInfos();

    if (
      profileIsAssociatedToCurrentUser(profile) ||
      (await hasWebCardProfileRight(profile.webCardId)) ||
      (userId &&
        (await profileInUserContactLoader.load({
          userId,
          profileId: profile.id,
        })))
    ) {
      return profile.avatarId
        ? {
            media: profile.avatarId,
            assetKind: 'contactCard',
          }
        : null;
    }

    return null;
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
    const webcard = await webCardLoader.load(profile.webCardId);

    if (
      profileIsAssociatedToCurrentUser(profile) ||
      (await hasWebCardProfileRight(profile.webCardId)) ||
      webcard?.cardIsPublished
    ) {
      return webcard;
    }

    return null;
  },
  nbContacts: async profile => {
    if (!(await hasWebCardProfileRight(profile.webCardId))) {
      return 0;
    }
    return getContactCount(profile.id);
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
  searchContacts: async (profile, { first, after, name, orderBy }) => {
    if (!profileIsAssociatedToCurrentUser(profile)) {
      return emptyConnection;
    }
    const limit = first ?? 50;
    const offset = after ? cursorToOffset(after) : 0;

    const contacts = await searchContacts({
      limit: limit + 1,
      ownerProfileId: profile.id,
      name: name ?? undefined,
      offset,
      orderBy,
    });
    return connectionFromSortedArray(contacts.slice(0, limit), {
      offset,
      hasNextPage: contacts.length > limit,
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
  cardTemplates: async (profile, { after, first }) => {
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
    const limit = first ?? 20;
    const cardTemplates = await getCardTemplatesForWebCardKind(
      (webCard?.webCardKind as WebCardKind) ?? 'business',
      undefined,
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
        let videoFile = video.video_files
          .filter(
            ({ quality, width, height }) =>
              quality === 'hd' && width != null && height != null,
          )
          .reduce((lowest: Video['video_files'][number] | null, current) => {
            // Compare based on width or height
            if (
              !lowest?.width ||
              !lowest?.height ||
              (current.width &&
                current.height &&
                current.width * current.height < lowest.width * lowest.height)
            ) {
              return current;
            }
            return lowest;
          }, null);

        // In some cases, video_files don't include "quality", hence we find the closest to HD (Width of 720)
        if (!videoFile) {
          videoFile = video.video_files.reduce((closestToHD, current) => {
            if (!current.width) {
              return closestToHD;
            }

            if (!closestToHD.width && current.width) {
              return current;
            }

            if (
              closestToHD.width &&
              current.width &&
              Math.abs(closestToHD.width - 720) > Math.abs(current.width - 720)
            ) {
              return current;
            }

            return closestToHD;
          }, video.video_files[0]);
        }

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
  deleted: async profile => {
    return profile.deleted;
  },
};

export { ProfileResolverImpl as Profile };

const getActivityName = async (webCardId: string, locale: string) => {
  const webcard = await webCardLoader.load(webCardId);
  const activity = webcard?.companyActivityId
    ? await companyActivityLoader.load(webcard.companyActivityId)
    : null;
  const activityName = activity?.id
    ? ((await labelLoader.load([activity.id, locale])) ??
      (await labelLoader.load([activity.id, DEFAULT_LOCALE])))
    : null;
  return activityName?.value;
};

const getContactCardUrl = async (profile: Profile) => {
  const webCard = await webCardLoader.load(profile.webCardId);
  if (!webCard || !webCard?.userName) {
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
    webCard.isMultiUser ? webCard?.commonInformation : null,
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
