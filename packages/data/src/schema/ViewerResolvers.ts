import { and, desc, eq, like } from 'drizzle-orm';
import { connectionFromArray } from 'graphql-relay';
import { shuffle } from '@azzapp/shared/arrayHelpers';
import { simpleHash } from '@azzapp/shared/stringHelpers';
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
} from '#domains';
import { getCardStyles } from '#domains/cardStyles';
import { getMediaSuggestions } from '#domains/mediasSuggestion';
import { emptyConnection } from '#helpers/connectionsHelpers';
import type { ViewerResolvers } from './__generated__/types';

export const Viewer: ViewerResolvers = {
  profile: async (_root, _, { auth, loaders }) => {
    const profileId = auth.profileId;

    if (!profileId) {
      return null;
    }
    return loaders.Profile.load(profileId);
  },
  trendingWebCards: async (_, args) => {
    // TODO dummy implementation just to test frontend
    return connectionFromArray(
      await db
        .select()
        .from(WebCardTable)
        .where(eq(WebCardTable.cardIsPublished, true))
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
          ),
        )
        .orderBy(desc(PostTable.createdAt))
        .then(res => res.map(({ Post }) => Post)),
      args,
    );
  },
  recommendedWebCards: async (_, args, { auth, loaders }) => {
    const { profileId } = auth;

    if (!profileId) {
      return connectionFromArray([], args);
    }

    const profile = await loaders.Profile.load(profileId);

    if (!profile) {
      return connectionFromArray([], args);
    }

    // TODO dummy implementation just to test frontend
    return connectionFromArray(
      await getRecommendedWebCards(profile.id, profile.webCardId),
      args,
    );
  },
  searchPosts: async (_, args) => {
    const posts = await db
      .select()
      .from(PostTable)
      .innerJoin(WebCardTable, eq(PostTable.webCardId, WebCardTable.id))
      .where(
        and(
          like(PostTable.content, `%${args.search}%`),
          eq(WebCardTable.cardIsPublished, true),
        ),
      );
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
    _,
    { kind, after, first },
    { auth: { profileId }, loaders },
  ) => {
    const profile = profileId ? await loaders.Profile.load(profileId) : null;
    const webCard = profile?.webCardId
      ? await loaders.WebCard.load(profile.webCardId)
      : null;
    if (!profile) {
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
    _,
    { cardTemplateTypeId, after, first },
    { auth: { profileId }, loaders },
  ) => {
    const profile = profileId ? await loaders.Profile.load(profileId) : null;
    const webCard = profile?.webCardId
      ? await loaders.WebCard.load(profile.webCardId)
      : null;
    if (!profile) {
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
      const sizedCardtemplate = cardTemplates.slice(0, limit);
      return {
        edges: sizedCardtemplate.map(cardTemplate => ({
          node: cardTemplate,
          cursor: cardTemplate.cursor,
        })),
        pageInfo: {
          hasNextPage: cardTemplates.length > limit,
          hasPreviousPage: false,
          startCursor: cardTemplates[0]?.cursor,
          endCursor: sizedCardtemplate[sizedCardtemplate.length - 1].cursor,
        },
      };
    }
    return emptyConnection;
  },
  cardTemplateTypes: async () => getCardTemplateTypes(),
  cardStyles: async (_, { after, first }, { auth: { profileId } }) => {
    if (!profileId) {
      return emptyConnection;
    }
    const limit = first ?? 100;
    const cardStyles = await getCardStyles(profileId, after, limit + 1);
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
    _,
    { after, first },
    { auth: { profileId }, sessionMemoized },
  ) => {
    if (!profileId) {
      return emptyConnection;
    }
    first = first ?? 100;
    const colorPalettes = shuffle(
      await sessionMemoized(getColorPalettes),
      simpleHash(profileId),
    );

    return connectionFromArray(colorPalettes, {
      after,
      first,
    });
  },
  suggestedMedias: async (
    _,
    { kind, after, first },
    { auth: { profileId }, loaders },
  ) => {
    const profile = profileId ? await loaders.Profile.load(profileId) : null;

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
