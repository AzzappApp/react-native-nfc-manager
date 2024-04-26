import { and, desc, eq, like } from 'drizzle-orm';
import { connectionFromArray } from 'graphql-relay';
import { toString } from 'qrcode';
import {
  db,
  getStaticMediasByUsage,
  PostTable,
  getCoverTemplates,
  getCardTemplates,
  getColorPalettes,
  getCardTemplateTypes,
  getRecommendedWebCards,
  WebCardTable,
  getCardStyles,
  getMediaSuggestions,
} from '@azzapp/data';
import { shuffle } from '@azzapp/shared/arrayHelpers';
import { serializeContactCard } from '@azzapp/shared/contactCardHelpers';
import ERRORS from '@azzapp/shared/errors';
import serializeAndSignContactCard from '@azzapp/shared/serializeAndSignContactCard';
import { simpleHash } from '@azzapp/shared/stringHelpers';
import { buildUserUrlWithContactCard } from '@azzapp/shared/urlHelpers';
import { emptyConnection } from '#helpers/connectionsHelpers';
import { idResolver } from './utils';
import type { ProfileResolvers } from './__generated__/types';

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
    return connectionFromArray(
      await db
        .select()
        .from(WebCardTable)
        .where(
          and(
            eq(WebCardTable.cardIsPublished, true),
            eq(WebCardTable.deleted, false),
          ),
        )
        .orderBy(desc(WebCardTable.createdAt)),
      args,
    );
  },
  trendingPosts: async (_, args) => {
    // TODO dummy implementation just to test frontend
    return connectionFromArray(
      await db
        .select()
        .from(PostTable)
        .innerJoin(
          WebCardTable,
          and(
            eq(PostTable.webCardId, WebCardTable.id),
            eq(WebCardTable.cardIsPublished, true),
            eq(PostTable.deleted, false),
          ),
        )
        .orderBy(desc(PostTable.createdAt))
        .then(res => res.map(({ Post }) => Post)),
      args,
    );
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
  searchPosts: async (_, args, { loaders }) => {
    const posts = await db
      .select()
      .from(PostTable)
      .innerJoin(WebCardTable, eq(PostTable.webCardId, WebCardTable.id))
      .where(
        and(
          like(PostTable.content, `%${args.search}%`),
          eq(WebCardTable.cardIsPublished, true),
          eq(PostTable.deleted, false),
        ),
      );

    posts.forEach(({ WebCard }) => {
      loaders.WebCard.prime(WebCard.id, WebCard);
    });

    return connectionFromArray(
      posts.map(({ Post }) => Post),
      args,
    );
  },
  searchWebCards: async (_, args) => {
    // TODO dummy implementation just to test frontend
    return connectionFromArray(
      await db
        .select()
        .from(WebCardTable)
        .where(
          and(
            eq(WebCardTable.cardIsPublished, true),
            eq(WebCardTable.deleted, false),
            like(WebCardTable.userName, `%${args.search}%`),
          ),
        ),
      args,
    );
  },
  coverBackgrounds: async () =>
    getStaticMediasByUsage('coverBackground').then(medias =>
      medias.map(media => ({
        staticMedia: media,
        assetKind: 'cover',
      })),
    ),
  coverForegrounds: async () =>
    getStaticMediasByUsage('coverForeground').then(medias =>
      medias.map(media => ({
        staticMedia: media,
        assetKind: 'cover',
      })),
    ),
  moduleBackgrounds: async () =>
    getStaticMediasByUsage('moduleBackground').then(medias =>
      medias.map(media => ({
        staticMedia: media,
        assetKind: 'module',
      })),
    ),
  coverTemplates: async (
    profile,
    { kind, after, first },
    { auth: { userId }, loaders },
  ) => {
    const webCard = profile?.webCardId
      ? await loaders.WebCard.load(profile.webCardId)
      : null;
    if (!userId || profile.userId !== userId) {
      return emptyConnection;
    }
    const limit = first ?? 100;
    const templates = await getCoverTemplates(
      webCard?.webCardKind ?? 'business',
      kind,
      profile.webCardId,
      after,
      limit + 1,
    );
    const sizedTemplate = templates.slice(0, limit);
    return {
      edges: sizedTemplate.map(template => ({
        node: template,
        cursor: template.cursor,
      })),
      pageInfo: {
        hasNextPage: templates.length > limit,
        hasPreviousPage: false,
        startCursor: templates[0]?.cursor,
        endCursor: sizedTemplate[sizedTemplate.length - 1].cursor,
      },
    };
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
    const cardTemplates = await getCardTemplates(
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
    const cardStyles = await getCardStyles(profile.id, after, limit + 1);
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
  suggestedMedias: async (
    profile,
    { kind, after, first },
    { auth: { userId }, loaders },
  ) => {
    if (!userId || profile.userId !== userId) {
      return emptyConnection;
    }
    const webCard = profile?.webCardId
      ? await loaders.WebCard.load(profile.webCardId)
      : null;
    if (
      !profile ||
      webCard?.webCardKind !== 'business' ||
      webCard.webCardCategoryId == null //profile category Id is mandatory on busness profile
    ) {
      return emptyConnection;
    }

    const limit = first ?? 100;
    const suggestions = await getMediaSuggestions(
      profile.webCardId,
      kind,
      webCard.webCardCategoryId,
      webCard.companyActivityId,
      after,
      (first ?? 100) + 1,
    );
    const sizedSuggestion = suggestions.slice(0, limit);
    const edges = sizedSuggestion.map(({ cursor, ...media }) => ({
      node: media,
      cursor,
    })) as any[];

    return {
      edges,
      pageInfo: {
        hasNextPage: suggestions.length > limit,
        hasPreviousPage: false,
        startCursor: suggestions[0]?.cursor,
        endCursor: sizedSuggestion[sizedSuggestion.length - 1]?.cursor,
      },
    };
  },
};
