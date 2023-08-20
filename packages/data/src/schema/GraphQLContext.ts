import DataLoader from 'dataloader';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import {
  getPostsByIds,
  getPostCommentsByIds,
  getProfilesByIds,
  getMediasByIds,
  getCoverTemplatesByIds,
  getStaticMediasByIds,
  getUsersByIds,
  getCardStylesByIds,
  getCardTemplatesByIds,
} from '#domains';
import type {
  Post,
  Media,
  Profile,
  CoverTemplate,
  StaticMedia,
  PostComment,
  User,
  CardStyle,
  CardTemplate,
} from '#domains';

export type GraphQLContext = {
  cardUpdateListener: (username: string) => void;
  auth: {
    userId?: string;
    profileId?: string;
  };
  locale: string;
  profileLoader: DataLoader<string, Profile | null>;
  postLoader: DataLoader<string, Post | null>;
  postCommentLoader: DataLoader<string, PostComment | null>;
  mediaLoader: DataLoader<string, Media | null>;
  cardStyleLoader: DataLoader<string, CardStyle | null>;
  staticMediaLoader: DataLoader<string, StaticMedia | null>;
  cardTemplateLoader: DataLoader<string, CardTemplate | null>;
  coverTemplateLoader: DataLoader<string, CoverTemplate | null>;
  userLoader: DataLoader<string, User | null>;
};

const dataloadersOptions = {
  batchScheduleFn: setTimeout,
};

export const createGraphQLContext = (
  cardUpdateListener: (username: string) => void,
  userId?: string,
  profile?: Profile,
  locale: string = DEFAULT_LOCALE,
): GraphQLContext => {
  const profileLoader = new DataLoader(getProfilesByIds, dataloadersOptions);
  if (profile) {
    profileLoader.prime(profile.id, profile);
  }
  return {
    auth: {
      userId,
      profileId: profile?.id,
    },
    locale,
    cardUpdateListener,
    profileLoader,
    postLoader: new DataLoader(getPostsByIds, dataloadersOptions),
    postCommentLoader: new DataLoader(getPostCommentsByIds, dataloadersOptions),
    cardStyleLoader: new DataLoader(getCardStylesByIds, dataloadersOptions),
    mediaLoader: new DataLoader(getMediasByIds, dataloadersOptions),
    staticMediaLoader: new DataLoader(getStaticMediasByIds, dataloadersOptions),
    cardTemplateLoader: new DataLoader(
      getCardTemplatesByIds,
      dataloadersOptions,
    ),
    coverTemplateLoader: new DataLoader(
      getCoverTemplatesByIds,
      dataloadersOptions,
    ),
    userLoader: new DataLoader(async (ids: readonly string[]) => {
      const users = await getUsersByIds(ids as string[]);
      const usersMap = new Map(users.map(user => [user.id, user]));

      return ids.map(id => usersMap.get(id) ?? null);
    }, dataloadersOptions),
  };
};
