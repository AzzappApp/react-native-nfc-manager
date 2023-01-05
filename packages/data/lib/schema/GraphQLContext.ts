import DataLoader from 'dataloader';
import {
  getUsersByIds,
  getCardsByIds,
  getCardCoversByIds,
  getPostsByIds,
  getUsersCards,
  getMedias,
} from '../domains';
import type { Card, CardCover, Post, User, Media } from '../domains';

export type UserInfos = {
  userId?: string | null;
  isAnonymous: boolean;
  locale?: string | null;
  location?: { lat: number; lng: number };
};

export type GraphQLContext = {
  userInfos: UserInfos;
  userLoader: DataLoader<string, User | null>;
  cardLoader: DataLoader<string, Card | null>;
  cardByUserLoader: DataLoader<string, Card | null>;
  coverLoader: DataLoader<string, CardCover | null>;
  postLoader: DataLoader<string, Post | null>;
  mediasLoader: DataLoader<string, Media[] | null>;
};

export const createGraphQLContext = (userInfos?: UserInfos): GraphQLContext => {
  userInfos = userInfos ?? { userId: null, isAnonymous: true };

  return {
    userInfos,
    userLoader: new DataLoader(getUsersByIds),
    cardByUserLoader: new DataLoader(getUsersCards),
    cardLoader: new DataLoader(getCardsByIds),
    coverLoader: new DataLoader(getCardCoversByIds),
    postLoader: new DataLoader(getPostsByIds),
    mediasLoader: new DataLoader(getMedias),
  };
};
