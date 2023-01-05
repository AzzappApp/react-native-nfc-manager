import db from './db';
import type {
  Card,
  CardCover,
  CardModule,
  Follow,
  Media,
  MediaKind,
  Post,
  User,
} from '@prisma/client';

type Viewer = {
  userId?: string | null;
  isAnonymous: boolean;
};

export type {
  Card,
  CardCover,
  CardModule,
  Follow,
  Media,
  MediaKind,
  Post,
  User,
  Viewer,
};

export { db };

export * from './cards';
export * from './cardCovers';
export * from './cardModules';
export * from './posts';
export * from './users';
export * from './medias';
export * from './follows';
