import * as uuid from 'uuid';
import {
  camelCaseObjectKeys,
  createObjectMapper,
  snakeCaseObjectKeys,
  uuidMapping,
} from '../helpers/databaseUtils';
import { getClient } from './db';

export type UserCard = {
  userId: string;
  cardId: string;
  main: boolean;
  cover: UserCardCover;
  modules: UserCardModule[];
};

export type UserCardCover = {
  backgroundColor?: string;
  pictures: string[];
  pictureTransitionTimer: number;
  overlayEffect: string;
  title: string;
  titlePosition: string;
  titleFont: string;
  titleFontSize: number;
  titleColor: string;
  titleRotation: number;
  qrCodePosition: string;
  desktopLayout: string;
  dektopImagePosition: string;
};

export type UserCardModule = MediaModule | SocialModule | TextModule;

export type SocialModule = {
  kind: 'social';
  data: {
    facebook?: string | null;
    instagram?: string | null;
    twitter?: string | null;
    linkdedIn?: string | null;
    youtube?: string | null;
    snapshat?: string | null;
    tiktok?: string | null;
    website?: string | null;
    pinterest?: string | null;
  };
};

export type MediaModule = {
  kind: 'media';
  data: Array<{ kind: 'picture' | 'video'; src: string }>;
};

export type TextModule = {
  kind: 'text';
  data: string;
};

const userCardSymbol = Symbol('User');

const userCardMaper = createObjectMapper<UserCard>(
  {
    userId: uuidMapping,
    cardId: uuidMapping,
    cover: {
      parse: camelCaseObjectKeys,
      serialize: snakeCaseObjectKeys,
    },
    modules: {
      parse: modules =>
        modules
          ? modules.map((module: any) => ({
              kind: module.kind,
              data: JSON.parse(module.data),
            }))
          : null,
      serialize: modules =>
        modules
          ? modules.map((module: any) => ({
              kind: module.kind,
              data: JSON.stringify(module.data),
            }))
          : null,
    },
  },
  userCardSymbol,
);

export const isUserCard = (val: any): val is UserCard => {
  return val != null && val[userCardSymbol] === true;
};

export const getUserCardById = (
  userId: string,
  cardId: string,
): Promise<UserCard | null> =>
  getClient()
    .execute('SELECT * FROM users_cards where user_id=? AND cardId=?', [
      userId,
      cardId,
    ])
    .then(result => userCardMaper.parse(result.first()));

export const getUserMainUserCard = (userId: string): Promise<UserCard | null> =>
  getClient()
    .execute(
      'SELECT * FROM users_cards where user_id=? AND main=true ALLOW FILTERING',
      [userId],
    )
    .then(result => userCardMaper.parse(result.first()));

export const createUserCard = async (card: Omit<UserCard, 'cardId'>) => {
  const cardId = uuid.v4();
  const [query, params] = userCardMaper.createInsert('users_cards', {
    ...card,
    cardId,
  });
  await getClient().execute(query, params, { prepare: true });
  return [card.userId, cardId];
};

export const updateUserCard = async (
  userId: string,
  cardId: string,
  updates: Partial<Omit<UserCard, 'id'>>,
) => {
  const [query, params] = userCardMaper.createUpdate('users_cards', updates, {
    userId,
    cardId,
  });
  await getClient().execute(query, params, { prepare: true });
};
