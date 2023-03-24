import DataLoader from 'dataloader';
import {
  getCardsByIds,
  getCardCoversByIds,
  getPostsByIds,
  getUsersCards,
  getProfilesByIds,
  getMediasByIds,
  getCoverTemplatesByIds,
} from '#domains';
import type {
  Card,
  CardCover,
  Post,
  Media,
  Profile,
  CoverTemplate,
} from '#domains';
import type { Viewer } from '@azzapp/auth/viewer';

export type GraphQLContext = {
  auth: Viewer;
  profileLoader: DataLoader<string, Profile | null>;
  cardLoader: DataLoader<string, Card | null>;
  cardByProfileLoader: DataLoader<string, Card | null>;
  coverLoader: DataLoader<string, CardCover | null>;
  postLoader: DataLoader<string, Post | null>;
  mediaLoader: DataLoader<string, Media | null>;
  coverTemplateLoader: DataLoader<string, CoverTemplate | null>;
};

export const createGraphQLContext = (userInfos?: Viewer): GraphQLContext => {
  userInfos = userInfos ?? { isAnonymous: true };

  return {
    auth: userInfos,
    profileLoader: new DataLoader(getProfilesByIds),
    cardByProfileLoader: new DataLoader(getUsersCards),
    cardLoader: new DataLoader(getCardsByIds),
    coverLoader: new DataLoader(getCardCoversByIds),
    postLoader: new DataLoader(getPostsByIds),
    mediaLoader: new DataLoader(getMediasByIds),
    coverTemplateLoader: new DataLoader(getCoverTemplatesByIds),
  };
};
