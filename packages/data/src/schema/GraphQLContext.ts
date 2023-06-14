import DataLoader from 'dataloader';
import { DEFAULT_LOCALE } from '@azzapp/i18n';
import {
  getCardsByIds,
  getCardCoversByIds,
  getPostsByIds,
  getPostCommentsByIds,
  getUsersCards,
  getProfilesByIds,
  getMediasByIds,
  getCoverTemplatesByIds,
  getStaticMediasByIds,
} from '#domains';
import type {
  Card,
  CardCover,
  Post,
  Media,
  Profile,
  CoverTemplate,
  StaticMedia,
  PostComment,
} from '#domains';
import type { SessionData } from '@azzapp/auth/viewer';

export type GraphQLContext = {
  auth: SessionData;
  locale: string;
  profileLoader: DataLoader<string, Profile | null>;
  cardLoader: DataLoader<string, Card | null>;
  cardByProfileLoader: DataLoader<string, Card | null>;
  coverLoader: DataLoader<string, CardCover | null>;
  postLoader: DataLoader<string, Post | null>;
  postCommentLoader: DataLoader<string, PostComment | null>;
  mediaLoader: DataLoader<string, Media | null>;
  staticMediaLoader: DataLoader<string, StaticMedia | null>;
  coverTemplateLoader: DataLoader<string, CoverTemplate | null>;
};

const dataloadersOptions = {
  batchScheduleFn: setTimeout,
};

export const createGraphQLContext = (
  userInfos?: SessionData,
  locale: string = DEFAULT_LOCALE,
): GraphQLContext => {
  userInfos = userInfos ?? { isAnonymous: true };

  return {
    auth: userInfos,
    locale,
    profileLoader: new DataLoader(getProfilesByIds, dataloadersOptions),
    cardByProfileLoader: new DataLoader(async (ids: readonly string[]) => {
      const cards = await getUsersCards(ids as string[]);
      const cardsMap = new Map(cards.map(card => [card.profileId, card]));

      return ids.map(id => cardsMap.get(id) ?? null);
    }, dataloadersOptions),
    cardLoader: new DataLoader(getCardsByIds, dataloadersOptions),
    coverLoader: new DataLoader(getCardCoversByIds, dataloadersOptions),
    postLoader: new DataLoader(getPostsByIds, dataloadersOptions),
    postCommentLoader: new DataLoader(getPostCommentsByIds, dataloadersOptions),
    mediaLoader: new DataLoader(getMediasByIds, dataloadersOptions),
    staticMediaLoader: new DataLoader(getStaticMediasByIds, dataloadersOptions),
    coverTemplateLoader: new DataLoader(
      getCoverTemplatesByIds,
      dataloadersOptions,
    ),
  };
};
