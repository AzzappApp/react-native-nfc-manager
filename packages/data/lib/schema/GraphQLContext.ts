import DataLoader from 'dataloader';
import {
  getCardsByIds,
  getCardCoversByIds,
  getPostsByIds,
  getUsersCards,
  getProfilesByIds,
  getMediasByIds,
} from '../domains';
import type { Card, CardCover, Post, Media, Profile } from '../domains';

export type ViewerInfos =
  | {
      isAnonymous: false;
      userId: string;
      profileId: string;
    }
  | { isAnonymous: true };

export type GraphQLContext = {
  auth: ViewerInfos;
  profileLoader: DataLoader<string, Profile | null>;
  cardLoader: DataLoader<string, Card | null>;
  cardByProfileLoader: DataLoader<string, Card | null>;
  coverLoader: DataLoader<string, CardCover | null>;
  postLoader: DataLoader<string, Post | null>;
  mediaLoader: DataLoader<string, Media | null>;
};

export const createGraphQLContext = (
  userInfos?: ViewerInfos,
): GraphQLContext => {
  userInfos = userInfos ?? { isAnonymous: true };

  return {
    auth: userInfos,
    profileLoader: new DataLoader(getProfilesByIds),
    cardByProfileLoader: new DataLoader(getUsersCards),
    cardLoader: new DataLoader(getCardsByIds),
    coverLoader: new DataLoader(getCardCoversByIds),
    postLoader: new DataLoader(getPostsByIds),
    mediaLoader: new DataLoader(getMediasByIds),
  };
};
